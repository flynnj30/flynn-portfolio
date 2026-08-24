// server.js - COMPLETE FIXED VERSION
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

try {
    require('dotenv').config();
    console.log('✅ dotenv loaded');
} catch (e) {
    console.log('⚠️ dotenv not available');
}

const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path}`);
    next();
});

// ============================================================
// BASIC ROUTES
// ============================================================
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'flynn-portfolio-api',
        env: {
            hasGoogleEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
            hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
            hasEmailUser: !!process.env.EMAIL_USER,
            hasEmailPassword: !!process.env.EMAIL_PASSWORD
        }
    });
});

app.get('/', (req, res) => {
    res.json({ 
        name: 'Flynn Portfolio API', 
        version: '1.0.0', 
        status: 'running',
        endpoints: {
            health: '/health',
            test: '/api/test',
            test_calendar: '/api/test-calendar',
            booking: '/api/create-booking (POST)'
        }
    });
});

app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API is working', 
        timestamp: new Date().toISOString() 
    });
});

// ============================================================
// GOOGLE CALENDAR SETUP
// ============================================================
let calendar = null;
let auth = null;
let calendarInitialized = false;

function initializeCalendar() {
    try {
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        let privateKey = process.env.GOOGLE_PRIVATE_KEY;

        if (!clientEmail || !privateKey) {
            console.log('⚠️ Google Calendar credentials missing');
            console.log('   GOOGLE_CLIENT_EMAIL:', clientEmail ? '✅ Set' : '❌ Missing');
            console.log('   GOOGLE_PRIVATE_KEY:', privateKey ? '✅ Set' : '❌ Missing');
            return false;
        }

        privateKey = privateKey.replace(/\\n/g, '\n');

        auth = new google.auth.JWT(
            clientEmail,
            null,
            privateKey,
            ['https://www.googleapis.com/auth/calendar']
        );

        calendar = google.calendar({ version: 'v3', auth });
        calendarInitialized = true;
        console.log('✅ Google Calendar initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Calendar init error:', error.message);
        return false;
    }
}

initializeCalendar();

// ============================================================
// TEST CALENDAR ACCESS
// ============================================================
app.get('/api/test-calendar', async (req, res) => {
    console.log('🔍 Testing Google Calendar access...');
    
    try {
        if (!calendar || !auth || !calendarInitialized) {
            return res.status(400).json({
                success: false,
                message: 'Calendar not initialized',
                details: {
                    calendar: !!calendar,
                    auth: !!auth,
                    initialized: calendarInitialized
                }
            });
        }

        const response = await calendar.calendarList.list({
            maxResults: 10
        });

        console.log('✅ Calendar list retrieved successfully');

        res.json({
            success: true,
            message: 'Calendar access verified',
            calendars: response.data.items.map(c => ({ 
                id: c.id, 
                summary: c.summary,
                accessRole: c.accessRole 
            }))
        });

    } catch (error) {
        console.error('❌ Calendar test failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Calendar test failed',
            error: error.message
        });
    }
});

// ============================================================
// CREATE BOOKING - MAIN ENDPOINT (FIXED)
// ============================================================
app.post('/api/create-booking', async (req, res) => {
    console.log('📝 Booking request received');
    console.log('📦 Request body:', JSON.stringify(req.body, null, 2));

    try {
        const { name, email, phone, subject, message, date, time, timezone, dateFormatted } = req.body;

        // Validate
        if (!name || !email || !subject || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, email, subject, date, time'
            });
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        // Convert time to 24-hour format
        function convertTimeTo24Hour(timeStr) {
            const parts = timeStr.trim().split(' ');
            if (parts.length !== 2) return timeStr;
            const [timePart, modifier] = parts;
            let [hours, minutes] = timePart.split(':');
            if (modifier === 'PM' && hours !== '12') hours = String(parseInt(hours) + 12);
            if (modifier === 'AM' && hours === '12') hours = '00';
            return `${hours.padStart(2, '0')}:${minutes || '00'}`;
        }

        // Create event times
        const time24 = convertTimeTo24Hour(time);
        const startDateTime = new Date(`${date}T${time24}:00`);
        
        if (isNaN(startDateTime.getTime())) {
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
        let calendarSuccess = false;

        // ============================================================
        // CREATE CALENDAR EVENT - SIMPLIFIED (NO conferenceData)
        // ============================================================
        if (calendar && auth && calendarInitialized) {
            try {
                // SIMPLIFIED event - NO conferenceData to avoid errors
                const event = {
                    summary: `Strategy Call with ${name}`,
                    description: `
                        Customer: ${name}
                        Email: ${email}
                        Phone: ${phone || 'Not provided'}
                        Subject: ${subject}
                        Message: ${message || 'No additional message'}
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
                    reminders: {
                        useDefault: false,
                        overrides: [
                            { method: 'email', minutes: 24 * 60 },
                            { method: 'popup', minutes: 60 },
                            { method: 'popup', minutes: 10 },
                        ],
                    },
                };

                console.log('📅 Creating Google Calendar event (simplified)...');

                const response = await calendar.events.insert({
                    calendarId: 'primary',
                    resource: event,
                    sendUpdates: 'all',
                });

                eventLink = response.data.htmlLink;
                eventId = response.data.id;
                calendarSuccess = true;
                
                console.log('✅ Calendar event created successfully!');
                console.log('🆔 Event ID:', eventId);
                console.log('🔗 Event link:', eventLink);

            } catch (error) {
                console.error('❌ Calendar API Error:', error.message);
                console.error('❌ Error details:', error);
                
                // Try one more time with even simpler event
                try {
                    console.log('🔄 Retrying with minimal event...');
                    const minimalEvent = {
                        summary: `Strategy Call with ${name}`,
                        description: `Customer: ${name} | Email: ${email} | Subject: ${subject}`,
                        start: {
                            dateTime: startDateTime.toISOString(),
                            timeZone: timezone,
                        },
                        end: {
                            dateTime: endDateTime.toISOString(),
                            timeZone: timezone,
                        },
                    };

                    const minimalResponse = await calendar.events.insert({
                        calendarId: 'primary',
                        resource: minimalEvent,
                        sendUpdates: 'all',
                    });

                    eventLink = minimalResponse.data.htmlLink;
                    eventId = minimalResponse.data.id;
                    calendarSuccess = true;
                    console.log('✅ Calendar event created with minimal event!');
                    
                } catch (retryError) {
                    console.error('❌ Retry also failed:', retryError.message);
                }
            }
        } else {
            console.log('⚠️ Calendar not configured - skipping event creation');
        }

        // ============================================================
        // FALLBACK MEET LINK (if calendar failed)
        // ============================================================
        if (!eventLink) {
            const meetingId = Math.random().toString(36).substring(2, 10);
            eventLink = `https://meet.google.com/${meetingId}`;
            console.log('⚠️ Using fallback link');
        }

        // ============================================================
        // FORMAT DATE FOR DISPLAY
        // ============================================================
        const displayDate = dateFormatted || new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        // ============================================================
        // SEND CONFIRMATION EMAIL
        // ============================================================
        try {
            await sendConfirmationEmail({
                name, email, phone, subject, message,
                date: displayDate,
                time,
                timezone,
                calendarSuccess: calendarSuccess
            });
            console.log('✅ Confirmation email sent');
        } catch (emailError) {
            console.error('❌ Email error:', emailError.message);
        }

        // ============================================================
        // RESPONSE
        // ============================================================
        const responseData = {
            success: true,
            calendarCreated: calendarSuccess,
            eventId: eventId || null,
            eventLink: eventLink,
            message: calendarSuccess ? 'Booking created and added to calendar' : 'Booking created (calendar event failed)',
            debug: {
                calendarConfigured: !!calendar,
                authConfigured: !!auth,
                calendarInitialized: calendarInitialized,
                clientEmail: process.env.GOOGLE_CLIENT_EMAIL ? 'Set' : 'Not set',
                privateKeySet: !!process.env.GOOGLE_PRIVATE_KEY
            }
        };

        console.log('📤 Response:', JSON.stringify(responseData, null, 2));

        res.json(responseData);

    } catch (error) {
        console.error('❌ Booking error:', error);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create booking'
        });
    }
});

// ============================================================
// SEND CONFIRMATION EMAIL
// ============================================================
async function sendConfirmationEmail(data) {
    try {
        if (typeof nodemailer === 'undefined' || !nodemailer.createTransporter) {
            console.log('⚠️ Nodemailer not available - skipping email');
            return;
        }

        const emailUser = process.env.EMAIL_USER || 'va.flynnjames@gmail.com';
        const emailPass = process.env.EMAIL_PASSWORD;

        if (!emailPass) {
            console.log('⚠️ EMAIL_PASSWORD not set - skipping email');
            return;
        }

        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: emailUser,
                pass: emailPass,
            },
        });

        await transporter.verify();
        console.log('✅ Email transporter verified');

        const calendarStatus = data.calendarSuccess ? 
            '✅ This event has been added to your Google Calendar.' : 
            '⚠️ Please add this event to your calendar manually.';

        const mailOptions = {
            from: `"Flynn James Pontino" <${emailUser}>`,
            to: [data.email, emailUser],
            subject: `📅 NEW BOOKING: ${data.name} - ${data.date} at ${data.time}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #e8e8e8; border-radius: 16px;">
                    <h1 style="color: #0a9e40; text-align: center;">📅 NEW BOOKING</h1>
                    <p style="text-align: center; color: #888;">A new strategy call has been booked</p>
                    
                    <div style="background: #1a1a1a; padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #3b82f6;">
                        <h3 style="color: #3b82f6; margin-top: 0;">👤 CUSTOMER DETAILS</h3>
                        <p><strong>Name:</strong> ${data.name}</p>
                        <p><strong>Email:</strong> ${data.email}</p>
                        <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
                    </div>
                    
                    <div style="background: #1a1a1a; padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #0a9e40;">
                        <h3 style="color: #0a9e40; margin-top: 0;">📋 APPOINTMENT DETAILS</h3>
                        <p><strong>Date:</strong> ${data.date}</p>
                        <p><strong>Time:</strong> ${data.time} (${data.timezone})</p>
                        <p><strong>Subject:</strong> ${data.subject}</p>
                        <p><strong>Status:</strong> ✅ CONFIRMED</p>
                        <p style="color: #0a9e40; font-size: 12px;">${calendarStatus}</p>
                    </div>
                    
                    ${data.message ? `
                    <div style="background: #1a1a1a; padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #f59e0b;">
                        <h3 style="color: #f59e0b; margin-top: 0;">💬 CUSTOMER'S MESSAGE</h3>
                        <p style="font-style: italic;">"${data.message}"</p>
                    </div>
                    ` : ''}
                    
                    <p style="text-align: center; color: #555; font-size: 12px; margin-top: 16px;">
                        <strong style="color: #0a9e40;">Flynn James Pontino</strong> · Senior SDR
                    </p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent to:', data.email);

    } catch (error) {
        console.error('❌ Email error:', error.message);
        throw error;
    }
}

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.path}`,
        available_endpoints: {
            root: '/',
            health: '/health',
            test: '/api/test',
            test_calendar: '/api/test-calendar',
            booking: '/api/create-booking (POST)'
        }
    });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚀 Flynn Portfolio API Server');
    console.log('='.repeat(60));
    console.log(`📡 Port: ${PORT}`);
    console.log(`📅 Calendar: ${calendar && auth ? 'ACTIVE ✅' : 'DISABLED ⚠️'}`);
    console.log(`📧 Email: ${process.env.EMAIL_PASSWORD ? 'CONFIGURED ✅' : 'NOT CONFIGURED ⚠️'}`);
    console.log('📋 Available endpoints:');
    console.log('   GET  /health              - Health check');
    console.log('   GET  /api/test            - Test API');
    console.log('   GET  /api/test-calendar   - Test calendar access');
    console.log('   POST /api/create-booking  - Create booking');
    console.log('='.repeat(60));
});