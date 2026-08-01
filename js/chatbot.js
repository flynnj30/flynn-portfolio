/**
 * Chatbot JavaScript - Gemini AI Integration
 */

// ===== CONFIGURATION =====
const GEMINI_API_KEY = 'AQ.Ab8RN6JXS2brh_npcMHMfmbtT7mplkfU-A6wt9TpZlJYeaVYzg';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY;

// ===== PORTFOLIO KNOWLEDGE BASE =====
const PORTFOLIO_KNOWLEDGE = `
PORTFOLIO KNOWLEDGE BASE - FLYNN JAMES PONTINO

PERSONAL:
- Name: Flynn James Q. Pontino
- Title: Senior Sales Development Representative | Junior Sales Team Lead
- Location: Toledo, Cebu, Philippines (Remote)
- Email: va.flynnjames@gmail.com
- Phone: +63 930 635 9306
- LinkedIn: linkedin.com/in/fjpontino

EXPERIENCE:
1. Regen Digital - Junior Sales Team Lead (Jul 2026-Present)
   - Coach SDRs, share scripts/strategies, mentor team members
   - Foster high-performance culture, monitor metrics

2. Regen Digital - SDR (May 2026-Present)
   - Engage decision-makers, book appointments, manage CRM
   - Achievement: Level 4 Top Performance Tier in 3 weeks

3. Seek Marketing Partners - Outbound Sales Rep (Nov 2025-Apr 2026)
   - B2B outreach, lead qualification, appointment setting

4. Averps - SDR / B2B Lead Gen (Feb 2025-Nov 2025)
   - Lead generation for custom applications

5. Public Sector Network - Delegate Sales Acquisition (Nov 2022-Jan 2025)
   - Outreach via email/calls, LinkedIn Sales Navigator, HubSpot

6. Pacific Outsource - Client Acquisition Manager (Mar 2015-Jan 2022)
   - Client management, lead generation, meeting scheduling

SKILLS:
- High-Volume Outbound: 10+ years, 100-150 calls/day
- CRM: HubSpot, Pipedrive, Salesforce
- Tools: LinkedIn Sales Navigator, ZoomInfo, Lusha, Outreach.io
- Qualification: BANT, MEDDIC frameworks

CERTIFICATIONS:
- SSWB Certification
- LSSWB Certification (Lean Six Sigma White Belt)

AWARDS:
- June's Top Performer
- Top Performance Tier (Level 4) - 60+ KPIs exceeded

SERVICES:
1. Pipeline Generation: 30+ meetings/month, 120% quota attainment
2. Sales Consulting: Custom cadences, objection handling, CRM optimization
3. Team Mentorship: Reduce ramp time 8→5 weeks

TESTIMONIALS:
- Van Ng (AVERPS): "A true partner in growth."
- Shann Wong (Yellow Pages): "A pleasure to work with."
- Toby Whittaker (Seek Marketing): "A standout professional."

EDUCATION: University of Cebu (2009-2014)
`;

const SYSTEM_PROMPT = `
You are the official AI assistant for Flynn James Pontino's portfolio website.
Answer ONLY using the PORTFOLIO KNOWLEDGE BASE provided below.

RULES:
- Never invent or assume information not in the knowledge base.
- If you don't know, say: "I couldn't find that in the portfolio. Please use the contact form for more details."
- Be professional, friendly, concise, and helpful.
- For contact: email va.flynnjames@gmail.com, phone +63 930 635 9306, LinkedIn linkedin.com/in/fjpontino.

PORTFOLIO KNOWLEDGE BASE:
${PORTFOLIO_KNOWLEDGE}
`;

// ===== DOM Elements =====
const chatToggle = document.getElementById('chatToggle');
const chatWindow = document.getElementById('chatWindow');
const closeChat = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendChatMsg');
const chatStatus = document.querySelector('.chat-status');

let conversationHistory = [];
let isProcessing = false;

// ===== UI Helpers =====
function addMessage(text, sender, extra = null) {
    const div = document.createElement('div');
    div.className = `chat-message ${sender}`;

    if (sender === 'bot' && extra) {
        let html = text;
        if (extra.contact) {
            html += '<div class="contact-row">';
            extra.contact.forEach(c => {
                html += `<a href="${c.url}" target="_blank"><i class="${c.icon}"></i> ${c.label}</a>`;
            });
            html += '</div>';
        }
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

// ===== Send to Gemini API =====
async function sendToGemini(message) {
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: SYSTEM_PROMPT },
                        { text: `User question: ${message}` }
                    ]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 800,
                    topP: 0.95,
                }
            })
        });

        if (!response.ok) {
            console.error('API Error:', response.status);
            return null;
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (error) {
        console.error('Gemini API error:', error);
        return null;
    }
}

// ===== Fallback Responses =====
function getFallbackReply(message) {
    const lower = message.toLowerCase();

    if (lower.includes('cv') || lower.includes('resume')) {
        return {
            reply: "You can download Flynn's CV here:",
            extra: { actions: [{ label: '📄 Download CV', url: 'https://drive.google.com/file/d/1Vn7IY1x1w8Q296hpnegN0YKGqTtzbGTA/view?usp=sharing' }] }
        };
    }
    if (lower.includes('contact') || lower.includes('email') || lower.includes('phone') || lower.includes('linkedin')) {
        return {
            reply: "You can reach Flynn through these channels:",
            extra: {
                contact: [
                    { label: '📧 Email', url: 'mailto:va.flynnjames@gmail.com', icon: 'fas fa-envelope' },
                    { label: '📞 Phone', url: 'tel:+639306359306', icon: 'fas fa-phone' },
                    { label: '💼 LinkedIn', url: 'https://linkedin.com/in/fjpontino', icon: 'fab fa-linkedin' }
                ]
            }
        };
    }
    if (lower.includes('experience') || lower.includes('background') || lower.includes('work')) {
        return {
            reply: "Flynn has over 10 years of experience in B2B sales, lead generation, and outbound telemarketing across APAC, US, UK, and AU markets.",
            extra: null
        };
    }
    if (lower.includes('skill') || lower.includes('tools') || lower.includes('technology')) {
        return {
            reply: "Flynn's core skills include high-volume cold calling, CRM management (HubSpot, Pipedrive), LinkedIn Sales Navigator, ZoomInfo, Lusha, and Outreach.io.",
            extra: null
        };
    }
    if (lower.includes('service') || lower.includes('offer') || lower.includes('help')) {
        return {
            reply: "Flynn offers end-to-end pipeline generation, sales development consulting, and team mentorship.",
            extra: null
        };
    }

    return {
        reply: "I couldn't find that in the portfolio. Please use the contact form for more details.",
        extra: {
            actions: [
                { label: '📋 Experience', value: 'Tell me about Flynn\'s experience' },
                { label: '🛠️ Skills', value: 'What skills does Flynn have?' },
                { label: '📞 Contact', value: 'How can I contact Flynn?' }
            ]
        }
    };
}

// ===== Handle Send =====
async function handleSend() {
    const msg = chatInput.value.trim();
    if (!msg || isProcessing) return;

    isProcessing = true;
    chatInput.disabled = true;
    sendBtn.disabled = true;
    setStatus('Processing...', true);

    addMessage(msg, 'user');
    chatInput.value = '';
    conversationHistory.push({ role: 'user', content: msg });

    showTyping();

    try {
        let reply = await sendToGemini(msg);
        let extra = null;

        if (!reply) {
            const fallback = getFallbackReply(msg);
            reply = fallback.reply;
            extra = fallback.extra;
            setStatus('AI Ready (Local)', true);
        } else {
            // Check if reply contains contact info
            if (reply.toLowerCase().includes('contact') || reply.toLowerCase().includes('email')) {
                extra = {
                    contact: [
                        { label: '📧 Email', url: 'mailto:va.flynnjames@gmail.com', icon: 'fas fa-envelope' },
                        { label: '📞 Phone', url: 'tel:+639306359306', icon: 'fas fa-phone' },
                        { label: '💼 LinkedIn', url: 'https://linkedin.com/in/fjpontino', icon: 'fab fa-linkedin' }
                    ]
                };
            }
            if (reply.toLowerCase().includes('cv') || reply.toLowerCase().includes('resume')) {
                extra = {
                    ...extra,
                    actions: [{ label: '📄 Download CV', url: 'https://drive.google.com/file/d/1Vn7IY1x1w8Q296hpnegN0YKGqTtzbGTA/view?usp=sharing' }]
                };
            }
            setStatus('AI Ready', true);
        }

        hideTyping();
        addMessage(reply, 'bot', extra);
        conversationHistory.push({ role: 'assistant', content: reply });

    } catch (error) {
        hideTyping();
        const fallback = getFallbackReply(msg);
        addMessage(fallback.reply, 'bot', fallback.extra);
        conversationHistory.push({ role: 'assistant', content: fallback.reply });
        setStatus('AI Ready (Fallback)', true);
    }

    isProcessing = false;
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.focus();

    if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-10);
    }
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', function() {
    // Quick actions
    document.querySelectorAll('.quick-actions button').forEach(btn => {
        btn.addEventListener('click', () => {
            const question = btn.dataset.question;
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

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatWindow.classList.contains('open')) {
            chatWindow.classList.remove('open');
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            chatToggle.click();
        }
    });
});

console.log('✅ Chatbot JS loaded');
console.log('🔑 Gemini API: ' + (GEMINI_API_KEY ? '✓ Configured' : '✗ Missing'));