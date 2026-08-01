require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== SECURITY & MIDDLEWARE =====
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts
}));
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'],
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

// ===== SERVE STATIC FRONTEND =====
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// ===== GEMINI AI INITIALIZATION =====
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY not set. Chat will use fallback mode.');
}

let ai = null;
try {
    if (apiKey) {
        ai = new GoogleGenAI({ apiKey });
        console.log('✅ Gemini AI initialized');
    }
} catch (error) {
    console.warn('⚠️ Failed to initialize Gemini AI:', error.message);
}

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
1. Regen Digital - Junior Sales Team Lead (July 2026 - Present)
   - Coach SDRs on objection handling and prospect qualification
   - Share effective scripts, call strategies, and outreach best practices
   - Foster high-performance, collaborative team culture

2. Regen Digital - SDR (May 2026 - Present)
   - Engage decision-makers, book appointments, manage CRM
   - Achievement: Level 4 Top Performance Tier in 3 weeks

3. Seek Marketing Partners - Outbound Sales Rep (Nov 2025 - Apr 2026)
   - B2B outreach, lead qualification, appointment setting

4. Averps - SDR / B2B Lead Gen (Feb 2025 - Nov 2025)

5. Public Sector Network - Delegate Sales Acquisition (Nov 2022 - Jan 2025)

6. Pacific Outsource - Client Acquisition Manager (Mar 2015 - Jan 2022)

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
- Top Performance Tier (Level 4)

SERVICES:
1. Pipeline Generation: 30+ meetings/month, 120% quota attainment
2. Sales Consulting: Custom cadences, objection handling, CRM optimization
3. Team Mentorship: Reduce ramp time 8→5 weeks

EDUCATION: University of Cebu (2009-2014)
`;

const SYSTEM_PROMPT = `
You are Flynn AI, the official assistant for Flynn James Pontino's portfolio.

RULES:
1. Answer ONLY using the PORTFOLIO KNOWLEDGE BASE below.
2. Never invent or assume information.
3. If info doesn't exist, reply: "I couldn't find that in Flynn's portfolio."
4. Be professional, friendly, and concise.

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

        // Build conversation context
        let context = '';
        if (history && history.length > 0) {
            const recent = history.slice(-6);
            context = recent.map(h => `${h.role}: ${h.content}`).join('\n');
        }

        // Try Gemini if available
        if (ai) {
            try {
                const fullPrompt = `${SYSTEM_PROMPT}\n\nConversation:\n${context}\n\nUser: ${message}\n\nAssistant:`;
                
                const response = await ai.models.generateContent({
                    model: 'gemini-2.0-flash-exp',
                    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                    config: {
                        temperature: 0.3,
                        maxOutputTokens: 1024,
                        topP: 0.95,
                    },
                });

                let reply = response.text || 
                           response.candidates?.[0]?.content?.parts?.[0]?.text ||
                           "I couldn't generate a response.";

                reply = reply.replace(/^Assistant:\s*/i, '').trim();

                // Check for contact info
                let extra = null;
                if (reply.toLowerCase().includes('contact') || reply.toLowerCase().includes('email')) {
                    extra = {
                        contact: [
                            { label: '📧 Email', url: 'mailto:va.flynnjames@gmail.com', icon: 'fas fa-envelope' },
                            { label: '📞 Phone', url: 'tel:+639306359306', icon: 'fas fa-phone' },
                            { label: '💼 LinkedIn', url: 'https://linkedin.com/in/fjpontino', icon: 'fab fa-linkedin' }
                        ]
                    };
                }

                return res.json({ reply, extra, timestamp: Date.now() });
            } catch (error) {
                console.warn('Gemini error, using fallback:', error.message);
            }
        }

        // ===== FALLBACK RESPONSES =====
        const lower = message.toLowerCase();
        let reply = "I couldn't find that in Flynn's portfolio. Please use the contact form for details.";
        let extra = null;

        if (lower.includes('cv') || lower.includes('resume')) {
            reply = "You can download Flynn's CV here:";
            extra = {
                actions: [{ label: '📄 Download CV', url: 'https://drive.google.com/file/d/1Vn7IY1x1w8Q296hpnegN0YKGqTtzbGTA/view?usp=sharing' }]
            };
        } else if (lower.includes('contact') || lower.includes('email') || lower.includes('phone')) {
            reply = "You can reach Flynn through these channels:";
            extra = {
                contact: [
                    { label: '📧 Email', url: 'mailto:va.flynnjames@gmail.com', icon: 'fas fa-envelope' },
                    { label: '📞 Phone', url: 'tel:+639306359306', icon: 'fas fa-phone' },
                    { label: '💼 LinkedIn', url: 'https://linkedin.com/in/fjpontino', icon: 'fab fa-linkedin' }
                ]
            };
        } else if (lower.includes('experience') || lower.includes('background')) {
            reply = "Flynn has over 10 years of experience in B2B sales, lead generation, and outbound telemarketing. He's currently Junior Sales Team Lead at Regen Digital.";
        } else if (lower.includes('skill') || lower.includes('tools')) {
            reply = "Flynn's core skills include: High-volume cold calling (100-150/day), CRM management (HubSpot, Pipedrive), LinkedIn Sales Navigator, ZoomInfo, and BANT/MEDDIC qualification.";
        } else if (lower.includes('service') || lower.includes('offer')) {
            reply = "Flynn offers: 1) Pipeline generation (30+ meetings/month), 2) Sales consulting, 3) Team mentorship & ramp-up (8→5 weeks).";
        }

        res.json({ reply, extra, timestamp: Date.now(), fallback: true });

    } catch (error) {
        console.error('Chat error:', error);
        res.json({
            reply: "I'm having trouble connecting. Please contact Flynn directly at va.flynnjames@gmail.com",
            extra: {
                contact: [
                    { label: '📧 Email', url: 'mailto:va.flynnjames@gmail.com', icon: 'fas fa-envelope' },
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
        environment: process.env.NODE_ENV || 'development'
    });
});

// ===== CATCH-ALL ROUTE =====
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    }
});

// ===== START SERVER =====
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? '✓ Configured' : '✗ Using fallback mode'}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});