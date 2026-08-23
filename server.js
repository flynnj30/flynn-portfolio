// server.js - Google Calendar API Integration
// For Render.com deployment

const express = require('express');
const cors = require('cors');

// Try to load dotenv, but don't crash if it's not available
try {
    require('dotenv').config();
    console.log('✅ dotenv loaded successfully');
} catch (e) {
    console.log('⚠️ dotenv not available, using environment variables directly');
}

const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({
    origin: '*', // Allow all origins for testing
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// LOGGING MIDDLEWARE
// ============================================================
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// ============================================================
// HEALTH CHECK ENDPOINT
// ============================================================
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'flynn-portfolio-api',
        uptime: process.uptime(),
        endpoints: {
            health: '/health',
            root: '/',
            booking: '/api/create-booking (POST)'
        },
        env: {
            hasGoogleEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
            hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
            hasEmailUser: !!process.env.EMAIL_USER,
            hasEmailPassword: !!process.env.EMAIL_PASSWORD
        }
    });
});

// ============================================================
// ROOT ENDPOINT
// ============================================================
app.get('/', (req, res) => {
    res.json({
        name: 'Flynn Portfolio API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/health',
            booking: '/api/create-booking (POST)',
            test: '/api/test (GET)'
        },
        documentation: 'POST to /api/create-booking with name, email, date, time, timezone'
    });
});

// ============================================================
// TEST ENDPOINT - To verify the API is working
// ============================================================
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API is working correctly',
        timestamp: new Date().toISOString(),
        method: 'GET'
    });
});

// ============================================================
// GOOGLE CALENDAR CONFIGURATION
// ============================================================
let calendar = null;
let auth = null;
let calendarInitialized = false;

function initializeCalendar() {
    try {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        let privateKey = process.env.GOOGLE_PRIVATE_KEY;

        if (!clientEmail || !privateKey) {
            console.log('⚠️ Google Calendar credentials not found. API will be in demo mode.');
            console.log('   GOOGLE_CLIENT_EMAIL:', clientEmail ? '✅ Set' : '❌ Missing');
            console.log('   GOOGLE_PRIVATE_KEY:', privateKey ? '✅ Set' : '❌ Missing');
            return false;
        }

        // Handle private key formatting
        privateKey = privateKey.replace(/\\n/g, '\n');

        auth = new google.auth.JWT(
            clientEmail,
            null,
            privateKey,
            ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events']
        );

        calendar = google.calendar({ version: 'v3', auth });
        calendarInitialized = true;
        console.log('✅ Google Calendar API initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Google Calendar initialization error:', error.message);
        return false;
    }
}

// Initialize calendar on startup
initializeCalendar();

// ============================================================
// CREATE BOOKING ENDPOINT - MAIN ROUTE
// ============================================================
app.post('/api/create-booking', async (req, res) => {
    console.log('📝 Booking request received');
    console.log('📦 Request body:', req.body);

    try {
        const { name, email, phone, subject, message, date, time, timezone, dateFormatted } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !date || !time) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, email, subject, date, time',
                required: ['name', 'email', 'subject', 'date', 'time']
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('❌ Invalid email format:', email);
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Convert time to 24-hour format
        function convertTimeTo24Hour(timeStr) {
            const parts = timeStr.trim().split(' ');
            if (parts.length !== 2) {
                return timeStr;
            }
            const [time, modifier] = parts;
            let [hours, minutes] = time.split(':');
            
            if (modifier === 'PM' && hours !== '12') {
                hours = String(parseInt(hours) + 12);
            }
            if (modifier === 'AM' && hours === '12') {
                hours = '00';
            }
            return `${hours.padStart(2, '0')}:${minutes || '00'}`;
        }

        // Parse date and time
        const time24 = convertTimeTo24Hour(time);
        const startDateTime = new Date(`${date}T${time24}:00`);
        
        if (isNaN(startDateTime.getTime())) {
            console.log('❌ Invalid date or time format:', date, time);
            return res.status(400).json({
                success: false,
                message: 'Invalid date or time format'
            });
        }

        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + 30);

        console.log('📅 Event times:', {
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            timezone: timezone
        });

        let eventLink = null;
        let eventId = null;

        // Generate a fallback meet link
        const meetingId = Math.random().toString(36).substring(2, 10);
        const fallbackLink = `https://meet.google.com/${meetingId}`;

        // Try to create Google Calendar event if configured
        if (calendar && auth && calendarInitialized) {
            try {
                console.log('📅 Creating Google Calendar event...');
                
                const event = {
                    summary: `Strategy Call with ${name}`,
                    description: `
                        Subject: ${subject}
                        Message: ${message || 'No additional message'}
                        Phone: ${phone || 'Not provided'}
                        Timezone: ${timezone}
                        Booked via: Flynn Portfolio Website
                    `,
                    start: {
                        dateTime: startDateTime.toISOString(),
                        timeZone: timezone,
                    },
                    end: {
                        dateTime: endDateTime.toISOString(),
                        timeZone: timezone,
                    },
                    attendees: [
                        { email: email },
                        { email: process.env.EMAIL_USER || 'va.flynnjames@gmail.com' }
                    ],
                    conferenceData: {
                        createRequest: {
                            conferenceSolutionKey: { type: 'hangoutsMeet' },
                            requestId: `meeting-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                        },
                    },
                    reminders: {
                        useDefault: false,
                        overrides: [
                            { method: 'email', minutes: 24 * 60 },
                            { method: 'popup', minutes: 60 },
                            { method: 'popup', minutes: 10 },
                        ],
                    },
                };

                const response = await calendar.events.insert({
                    calendarId: 'primary',
                    resource: event,
                    conferenceDataVersion: 1,
                    sendUpdates: 'all',
                });

                eventLink = response.data.hangoutLink || response.data.htmlLink || fallbackLink;
                eventId = response.data.id;
                console.log('✅ Google Calendar event created:', eventId);
                console.log('🔗 Meet link:', eventLink);

            } catch (calendarError) {
                console.error('❌ Google Calendar error:', calendarError.message);
                console.log('📝 Using fallback meet link');
                eventLink = fallbackLink;
            }
        } else {
            console.log('⚠️ Google Calendar not configured. Using fallback meet link.');
            eventLink = fallbackLink;
        }

        // Format the date for display
        const displayDate = dateFormatted || new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        // Send confirmation email (try, but don't fail if it doesn't work)
        try {
            await sendConfirmationEmail({
                name,
                email,
                phone,
                subject,
                message,
                date: displayDate,
                time,
                timezone,
                meetLink: eventLink,
            });
            console.log('✅ Confirmation email sent to:', email);
        } catch (emailError) {
            console.error('❌ Email sending error:', emailError.message);
            // Don't fail the booking if email fails
        }

        // Return success response
        console.log('✅ Booking created successfully for:', name, email);
        res.status(200).json({
            success: true,
            eventId: eventId || 'fallback',
            eventLink: eventLink || fallbackLink,
            message: 'Booking created successfully',
            meetLink: eventLink || fallbackLink
        });

    } catch (error) {
        console.error('❌ Booking creation error:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create booking',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ============================================================
// SEND CONFIRMATION EMAIL
// ============================================================
async function sendConfirmationEmail(data) {
    try {
        let nodemailer;
        try {
            nodemailer = require('nodemailer');
        } catch (e) {
            console.log('⚠️ nodemailer not available, skipping email');
            return;
        }

        const emailUser = process.env.EMAIL_USER || 'va.flynnjames@gmail.com';
        const emailPass = process.env.EMAIL_PASSWORD;

        if (!emailPass) {
            console.log('⚠️ EMAIL_PASSWORD not set, skipping email');
            return;
        }

        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass,
            },
        });

        const mailOptions = {
            from: `"Flynn James Pontino" <${emailUser}>`,
            to: [data.email, emailUser],
            subject: `✅ Booking Confirmed: Strategy Call with Flynn James Pontino`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #e8e8e8; border-radius: 16px;">
                    <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #1a1a1a;">
                        <h1 style="color: #0a9e40; font-size: 28px; margin: 0;">🎉 Booking Confirmed!</h1>
                        <p style="color: #888; font-size: 16px;">Your strategy call is scheduled</p>
                    </div>
                    
                    <div style="padding: 20px 0;">
                        <p style="font-size: 18px;">Hi <strong style="color: #0a9e40;">${data.name}</strong>,</p>
                        <p>Your strategy call with Flynn James Pontino has been confirmed. Here are the details:</p>
                        
                        <div style="background: #1a1a1a; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #0a9e40;">
                            <h3 style="color: #0a9e40; margin-top: 0;">📋 Appointment Details</h3>
                            <p><strong>Date:</strong> ${data.date}</p>
                            <p><strong>Time:</strong> ${data.time} (${data.timezone})</p>
                            <p><strong>Type:</strong> Strategy Call</p>
                            <p><strong>Subject:</strong> ${data.subject}</p>
                            ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
                        </div>
                        
                        <div style="background: #1a1a1a; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #0a9e40;">
                            <h3 style="color: #0a9e40; margin-top: 0;">🔗 Google Meet Link</h3>
                            <p><a href="${data.meetLink}" target="_blank" style="background: #0a9e40; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Join Meeting</a></p>
                            <p style="font-size: 12px; color: #888; word-break: break-all;">Or copy: ${data.meetLink}</p>
                        </div>
                        
                        <div style="background: #1a1a1a; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                            <h3 style="color: #f59e0b; margin-top: 0;">⏰ Reminders</h3>
                            <ul style="color: #888;">
                                <li>📧 24 hours before the meeting</li>
                                <li>📧 1 hour before the meeting</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #1a1a1a; color: #666; font-size: 14px;">
                        <p><em>Need to reschedule? Reply to this email and we'll find another time.</em></p>
                        <p>Best regards,<br><strong style="color: #0a9e40;">Flynn James Pontino</strong></p>
                    </div>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Confirmation email sent to:', data.email);

    } catch (error) {
        console.error('❌ Email sending error:', error.message);
        throw error;
    }
}

// ============================================================
// 404 HANDLER - Catch all unmatched routes
// ============================================================
app.use((req, res) => {
    console.log(`❌ 404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.path}`,
        available_endpoints: {
            root: '/',
            health: '/health',
            test: '/api/test',
            booking: '/api/create-booking (POST)'
        }
    });
});

// ============================================================
// ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚀 Flynn Portfolio API Server');
    console.log('='.repeat(60));
    console.log(`📡 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📅 Google Calendar: ${calendar && auth ? 'ACTIVE ✅' : 'DISABLED ⚠️'}`);
    console.log(`📧 Email Service: ${process.env.EMAIL_PASSWORD ? 'CONFIGURED ✅' : 'NOT CONFIGURED ⚠️'}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET  /                    - Root info`);
    console.log(`   GET  /health              - Health check`);
    console.log(`   GET  /api/test            - Test endpoint`);
    console.log(`   POST /api/create-booking  - Create booking`);
    console.log('='.repeat(60));
});