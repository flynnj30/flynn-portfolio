/**
 * Flynn AI Chatbot - Frontend Client
 * Communicates with secure backend proxy for Gemini AI
 */

// ===== CONFIGURATION =====
const CONFIG = {
    // Backend API URL - update this to match your server
    API_URL: 'http://localhost:3001/api/chat',
    TIMEOUT_MS: 15000,
    MAX_RETRIES: 2,
};

// ===== DOM ELEMENTS =====
const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const closeChat = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendChatMsg');
const chatStatus = document.querySelector('.chat-status');
const quickActions = document.querySelectorAll('.quick-actions button');

// ===== CONVERSATION HISTORY =====
let conversationHistory = [];
let isProcessing = false;

// ===== UI HELPERS =====
function addMessage(text, sender, extra = null) {
    const div = document.createElement('div');
    div.className = `chat-message ${sender}`;

    if (sender === 'bot' && extra) {
        let html = text;

        // Add contact buttons
        if (extra.contact) {
            html += '<div class="contact-row">';
            extra.contact.forEach(c => {
                html += `<a href="${c.url}" target="_blank"><i class="${c.icon}"></i> ${c.label}</a>`;
            });
            html += '</div>';
        }

        // Add action buttons
        if (extra.actions) {
            html += '<div style="margin-top:8px;">';
            extra.actions.forEach(a => {
                html += `<a href="${a.url}" target="_blank" class="action-btn">${a.label}</a> `;
            });
            html += '</div>';
        }

        div.innerHTML = html;
    } else {
        div.textContent = text;
    }

    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
    const div = document.createElement('div');
    div.className = 'chat-message loading';
    div.id = 'typingIndicator';
    div.textContent = '● ● ●';
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

function setStatus(text, online = true) {
    chatStatus.innerHTML = `<span class="${online ? 'online' : 'offline'}">●</span> ${text}`;
}

// ===== SEND TO BACKEND =====
async function sendToBackend(message) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: message,
                history: conversationHistory,
                timestamp: Date.now()
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.warn('Backend error:', error);
        return null;
    }
}

// ===== FALLBACK LOCAL RESPONSES =====
function getLocalResponse(message) {
    const lower = message.toLowerCase();

    // CV/Resume detection
    if (lower.includes('cv') || lower.includes('resume') || lower.includes('curriculum')) {
        return {
            reply: "You can download Flynn's CV here:",
            extra: {
                actions: [
                    { label: '📄 Download CV', url: 'https://drive.google.com/file/d/1Vn7IY1x1w8Q296hpnegN0YKGqTtzbGTA/view?usp=sharing' }
                ]
            }
        };
    }

    // Contact detection
    if (lower.includes('contact') || lower.includes('email') || lower.includes('phone') || 
        lower.includes('linkedin') || lower.includes('whatsapp') || lower.includes('reach')) {
        return {
            reply: "You can reach Flynn through these channels:",
            extra: {
                contact: [
                    { label: '📧 Email', url: 'mailto:va.flynnjames@gmail.com', icon: 'fas fa-envelope' },
                    { label: '📞 Phone', url: 'tel:+639306359306', icon: 'fas fa-phone' },
                    { label: '💼 LinkedIn', url: 'https://linkedin.com/in/fjpontino', icon: 'fab fa-linkedin' },
                    { label: '💬 WhatsApp', url: 'https://wa.me/639306359306', icon: 'fab fa-whatsapp' }
                ]
            }
        };
    }

    // Experience detection
    if (lower.includes('experience') || lower.includes('background') || lower.includes('work history') || 
        lower.includes('career') || lower.includes('jobs') || lower.includes('worked at')) {
        return {
            reply: "Flynn has over 10 years of experience in B2B sales, lead generation, and outbound telemarketing. He's currently Junior Sales Team Lead at Regen Digital, and has previously worked at Seek Marketing Partners, Averps, Public Sector Network, and Pacific Outsource Teleservices.",
            extra: null
        };
    }

    // Skills detection
    if (lower.includes('skill') || lower.includes('tools') || lower.includes('technology') || 
        lower.includes('tech stack') || lower.includes('software') || lower.includes('proficient')) {
        return {
            reply: "Flynn's core skills include: High-volume cold calling (100-150/day), CRM management (HubSpot, Pipedrive, Salesforce), LinkedIn Sales Navigator, ZoomInfo, Lusha, Outreach.io, BANT/MEDDIC qualification, multi-channel sequencing, and consultative selling.",
            extra: null
        };
    }

    // Services detection
    if (lower.includes('service') || lower.includes('offer') || lower.includes('help') || 
        lower.includes('consulting') || lower.includes('pipeline') || lower.includes('mentorship')) {
        return {
            reply: "Flynn offers: 1) End-to-end pipeline generation (30+ meetings/month, 120% quota attainment), 2) Sales development consulting (custom cadences, objection handling, CRM optimization), 3) Team mentorship & ramp-up (reduce ramp time from 8 to 5 weeks).",
            extra: null
        };
    }

    // Default fallback
    return {
        reply: "I couldn't find that specific information in Flynn's portfolio. Would you like to know about his experience, skills, services, or how to contact him?",
        extra: {
            actions: [
                { label: '📋 Experience', value: 'Tell me about Flynn\'s experience' },
                { label: '🛠️ Skills', value: 'What skills does Flynn have?' },
                { label: '📞 Contact', value: 'How can I contact Flynn?' }
            ]
        }
    };
}

// ===== HANDLE SEND =====
async function handleSend() {
    const msg = chatInput.value.trim();
    if (!msg || isProcessing) return;

    // Disable input
    isProcessing = true;
    chatInput.disabled = true;
    sendBtn.disabled = true;
    setStatus('Processing...', true);

    // Add user message
    addMessage(msg, 'user');
    chatInput.value = '';
    conversationHistory.push({ role: 'user', content: msg });

    // Show typing indicator
    showTyping();

    try {
        // Try backend first
        let result = await sendToBackend(msg);

        // If backend fails, use local fallback
        if (!result) {
            console.log('Using local fallback response');
            result = getLocalResponse(msg);
            setStatus('AI Ready (Local)', true);
        } else {
            setStatus('AI Ready', true);
        }

        hideTyping();

        // Add bot response
        addMessage(result.reply, 'bot', result.extra || null);

        // Store in history
        conversationHistory.push({ role: 'assistant', content: result.reply });

    } catch (error) {
        hideTyping();
        console.error('Chat error:', error);

        // Use local fallback as emergency
        const fallback = getLocalResponse(msg);
        addMessage(fallback.reply, 'bot', fallback.extra || null);
        conversationHistory.push({ role: 'assistant', content: fallback.reply });
        setStatus('AI Ready (Fallback)', true);
    }

    // Re-enable input
    isProcessing = false;
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.focus();

    // Trim history if too long
    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-10);
    }
}

// ===== EVENT LISTENERS =====

// Quick action buttons
quickActions.forEach(btn => {
    btn.addEventListener('click', () => {
        const question = btn.getAttribute('data-question');
        if (question) {
            chatInput.value = question;
            handleSend();
        }
    });
});

// Chat toggle
chatToggle.addEventListener('click', () => {
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open')) {
        chatInput.focus();
        setStatus('AI Ready', true);
    }
});

// Close chat
closeChat.addEventListener('click', () => chatWindow.classList.remove('open'));

// Send message
sendBtn.addEventListener('click', handleSend);

// Enter key
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

// Escape key to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatWindow.classList.contains('open')) {
        chatWindow.classList.remove('open');
    }
    // Ctrl+K to toggle chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        chatToggle.click();
    }
});

// ===== NAVIGATION PANEL TOGGLE =====
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const section = this.getAttribute('data-section');
        document.querySelectorAll('.info-panel').forEach(p => p.classList.remove('active'));
        if (section === 'home') {
            document.getElementById('home-section').scrollIntoView({ behavior: 'smooth' });
            return;
        }
        const panel = document.getElementById(`${section}-panel`);
        if (panel) panel.classList.add('active');
        document.getElementById('mobileDropdown').style.transform = 'translateY(-120%)';
    });
});

// Mobile menu
document.getElementById('hamburgerBtn').addEventListener('click', () => {
    document.getElementById('mobileDropdown').style.transform = 'translateY(0%)';
});
document.getElementById('cancelBtn').addEventListener('click', () => {
    document.getElementById('mobileDropdown').style.transform = 'translateY(-120%)';
});

// Close panels on hero click
document.getElementById('home-section').addEventListener('click', (e) => {
    if (!e.target.closest('.info-panel')) {
        document.querySelectorAll('.info-panel').forEach(p => p.classList.remove('active'));
    }
});

// ===== INITIALIZATION =====
console.log('✅ Flynn AI Chatbot initialized');
console.log(`📡 Backend endpoint: ${CONFIG.API_URL}`);
console.log('💡 Tip: Press Ctrl+K to open/close chat');
console.log('🔒 API key is securely stored on the backend');

// Check backend health
async function checkBackendHealth() {
    try {
        const healthUrl = CONFIG.API_URL.replace('/chat', '/health');
        const response = await fetch(healthUrl);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend healthy:', data);
        } else {
            console.warn('⚠️ Backend health check failed');
        }
    } catch (e) {
        console.warn('⚠️ Backend not reachable, using local fallback mode');
    }
}
checkBackendHealth();