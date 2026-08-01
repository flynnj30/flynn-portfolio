require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== SECURITY & MIDDLEWARE =====
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));
app.use(express.json({ limit: '10kb' }));

// ===== RATE LIMITING =====
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/chat', limiter);

// ===== GEMINI AI INITIALIZATION =====
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is not set in .env file');
    console.error('Please add: GEMINI_API_KEY=your-api-key-here');
    process.exit(1);
}

console.log('✅ GEMINI_API_KEY loaded successfully');
const ai = new GoogleGenAI({ apiKey });

// ===== PORTFOLIO KNOWLEDGE BASE =====
const PORTFOLIO_KNOWLEDGE = `
PORTFOLIO KNOWLEDGE BASE - FLYNN JAMES PONTINO

PERSONAL:
- Name: Flynn James Q. Pontino
- Title: Senior Sales Development Representative | Junior Sales Team Lead | SDR | B2B Lead Generation
- Location: Toledo, Cebu, Philippines (Remote / Global)
- Email: va.flynnjames@gmail.com
- Phone: +63 930 635 9306
- LinkedIn: linkedin.com/in/fjpontino
- Facebook: facebook.com/flynn.james.9655

EXPERIENCE:
1. Regen Digital - Junior Sales Team Lead (July 2026 - Present)
   - Coach SDRs on objection handling and prospect qualification
   - Share effective scripts, call strategies, and outreach best practices
   - Foster high-performance, collaborative team culture
   - Support onboarding through mentoring, shadowing, and feedback

2. Regen Digital - Sales Development Representative (May 2026 - Present)
   - Engage decision-makers to qualify prospects
   - Book high-value appointments to drive revenue
   - Build trust by addressing objections through meaningful conversation
   - Key Achievement: Top Performance Tier - Level 4 within three weeks

3. Seek Marketing Partners - Outbound Sales Representative (Nov 2025 - Apr 2026)
   - Conduct B2B outreach via cold emails, LinkedIn, and calls
   - Qualify leads and set appointments

4. Averps - Sales Development Representative (Feb 2025 - Nov 2025)
   - B2B lead generation for custom applications and solutions

5. Public Sector Network - Delegate Sales Acquisition Rep (Nov 2022 - Jan 2025)
   - Spearheaded outreach via email, call, and meetings
   - Used LinkedIn Sales Navigator and HubSpot

6. Pacific Outsource Teleservices - Client Acquisition Manager (Mar 2015 - Jan 2022)
   - Managed client accounts, generated leads, built strong relationships

SKILLS:
- High-Volume Outbound: 10+ years, 100-150 calls/day
- CRM: HubSpot, Pipedrive, Salesforce
- Tools: LinkedIn Sales Navigator, ZoomInfo, Lusha, Outreach.io
- Qualification: BANT, MEDDIC frameworks
- Multi-channel: Email, LinkedIn, cold calling

CERTIFICATIONS:
- SSWB Certification
- LSSWB Certification (Lean Six Sigma White Belt)

HONORS & AWARDS:
- June's Top Performer
- Top Performance Tier (Level 4) - exceeded 60+ KPIs

SERVICES:
1. Pipeline Generation: 30+ meetings/month, 120% quota attainment
2. Sales Consulting: Custom cadences, objection handling, CRM optimization
3. Team Mentorship: Reduce ramp time 8→5 weeks

TESTIMONIALS:
- Van Ng (AVERPS): "A true partner in growth."
- Shann Wong (Yellow Pages): "A pleasure to work with."
- Toby Whittaker (Seek Marketing): "A standout professional."

EDUCATION:
- University of Cebu (2009-2014)
`;

const SYSTEM_PROMPT = `
You are Flynn AI, the official assistant for Flynn James Pontino's portfolio website.

CRITICAL RULES:
1. Answer ONLY using the PORTFOLIO KNOWLEDGE BASE provided below.
2. Never invent, infer, or assume information not explicitly stated.
3. If information doesn't exist, reply: "I couldn't find that in Flynn's portfolio. Please use the contact form for details."
4. Be professional, friendly, concise, and helpful.
5. For contact: email va.flynnjames@gmail.com, phone +63 930 635 9306, LinkedIn linkedin.com/in/fjpontino.

PORTFOLIO KNOWLEDGE BASE:
${PORTFOLIO_KNOWLEDGE}
`;

// ===== CHAT ENDPOINT =====
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (message.length > 2000) {
            return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
        }

        // Build conversation context
        let context = '';
        if (history && history.length > 0) {
            const recent = history.slice(-6);
            context = recent.map(h => `${h.role}: ${h.content}`).join('\n');
        }

        const fullPrompt = `${SYSTEM_PROMPT}\n\nConversation History:\n${context}\n\nUser: ${message}\n\nAssistant:`;

        console.log('📤 Sending request to Gemini API...');

        // Call Gemini API using the correct method
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
            config: {
                temperature: 0.3,
                maxOutputTokens: 1024,
                topP: 0.95,
                topK: 40,
            },
        });

        console.log('📥 Received response from Gemini API');

        // Extract reply from response
        let reply = response.text || 
                    response.candidates?.[0]?.content?.parts?.[0]?.text ||
                    "I'm sorry, I couldn't generate a response. Please try again.";

        // Clean up the reply
        reply = reply.replace(/^Assistant:\s*/i, '').trim();

        // Check if reply is a hallucination
        const lowerReply = reply.toLowerCase();
        if (lowerReply.includes("i don't know") || 
            lowerReply.includes("i'm not sure") || 
            lowerReply.includes("i cannot") ||
            lowerReply.includes("not in the portfolio")) {
            
            const safeResponse = `I couldn't find that specific information in Flynn's portfolio. Would you like to know about his experience, skills, services, or how to contact him?`;
            return res.json({ 
                reply: safeResponse,
                extra: {
                    actions: [
                        { label: '📋 Experience', value: 'Tell me about Flynn\'s experience' },
                        { label: '🛠️ Skills', value: 'What skills does Flynn have?' },
                        { label: '📞 Contact', value: 'How can I contact Flynn?' }
                    ]
                }
            });
        }

        // Check if reply contains contact info and add buttons
        let extra = null;
        if (reply.includes('contact') || reply.includes('email') || reply.includes('phone')) {
            extra = {
                contact: [
                    { label: '📧 Email', url: 'mailto:va.flynnjames@gmail.com', icon: 'fas fa-envelope' },
                    { label: '📞 Phone', url: 'tel:+639306359306', icon: 'fas fa-phone' },
                    { label: '💼 LinkedIn', url: 'https://linkedin.com/in/fjpontino', icon: 'fab fa-linkedin' },
                    { label: '💬 WhatsApp', url: 'https://wa.me/639306359306', icon: 'fab fa-whatsapp' }
                ]
            };
        }

        // Check if CV is mentioned
        if (reply.toLowerCase().includes('cv') || reply.toLowerCase().includes('resume')) {
            extra = {
                ...extra,
                actions: [
                    { label: '📄 Download CV', url: 'https://drive.google.com/file/d/1Vn7IY1x1w8Q296hpnegN0YKGqTtzbGTA/view?usp=sharing' }
                ]
            };
        }

        res.json({ 
            reply,
            extra,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('❌ Gemini API error:', error.message);
        
        // Provide a graceful fallback
        const fallbackReply = `I'm having trouble connecting to my AI brain right now. However, I can tell you that Flynn has 10+ years of experience in B2B sales, lead generation, and team leadership. You can reach him at va.flynnjames@gmail.com or +63 930 635 9306.`;
        
        res.json({ 
            reply: fallbackReply,
            extra: {
                contact: [
                    { label: '📧 Email', url: 'mailto:va.flynnjames@gmail.com', icon: 'fas fa-envelope' },
                    { label: '📞 Phone', url: 'tel:+639306359306', icon: 'fas fa-phone' },
                    { label: '💼 LinkedIn', url: 'https://linkedin.com/in/fjpontino', icon: 'fab fa-linkedin' }
                ]
            },
            fallback: true
        });
    }
});

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: Date.now(),
        apiKeySet: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0
    });
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`✅ AI Chatbot Backend running on port ${PORT}`);
    console.log(`🔑 API Key: ${process.env.GEMINI_API_KEY ? '✓ Set (' + process.env.GEMINI_API_KEY.length + ' chars)' : '✗ Missing'}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
});

module.exports = app;