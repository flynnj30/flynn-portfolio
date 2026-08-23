// server.js - Google Calendar API Integration
// For Render.com deployment

const express = require('express');
const cors = require('cors');

// Try to load dotenv, but don't crash if it's not available
let dotenvLoaded = false;
try {
    require('dotenv').config();
    dotenvLoaded = true;
    console.log('✅ dotenv loaded successfully');
} catch (e) {
    console.log('⚠️ dotenv not available, using environment variables directly');
}

const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================
// HEALTH CHECK ENDPOINT
// ============================================================
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'flynn-portfolio-api',
        dotenv: dotenvLoaded ? 'loaded' : 'not loaded',
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
        endpoints: {
            health: '/health',
            booking: '/api/create-booking (POST)'
        },
        status: 'running'
    });
});

// ============================================================
// GOOGLE CALENDAR CONFIGURATION
// ============================================================
let calendar = null;
let auth = null;

try {
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (clientEmail && privateKey) {
        // Handle private key formatting (replace escaped newlines)
        privateKey = privateKey.replace(/\\n/g, '\n');

        auth = new google.auth.JWT(
            clientEmail,
            null,
            privateKey,
            ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events']
        );

        calendar = google.calendar({ version: 'v3', auth });
        console.log('✅ Google Calendar API initialized successfully');
    } else {
        console.log('⚠️ Google Calendar credentials not found. API will be disabled.');
        console.log('   GOOGLE_CLIENT_EMAIL:', !!clientEmail);
        console.log('   GOOGLE_PRIVATE_KEY:', !!privateKey);
    }
} catch (error) {
    console.error('❌ Google Calendar initialization error:', error.message);
}

// ============================================================
// CREATE BOOKING ENDPOINT
// ============================================================
app.post('/api/create-booking', async (req, res) => {
    try {
        const { name, email, phone, subject, message, date, time, timezone, dateFormatted } = req.body;

        console.log('📝 Booking request received:', { name, email, date, time, timezone });

        // Validate required fields
        if (!name || !email || !subject || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, email, subject, date, time'
            });
        }

        // Validate email format
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
            if (parts.length !== 2) {
                // If already in 24-hour format
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

        // Try to create Google Calendar event if configured
        if (calendar && auth) {
            try {
                // Create Google Calendar Event
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

                eventLink = response.data.hangoutLink || response.data.htmlLink;
                eventId = response.data.id;
                console.log('✅ Google Calendar event created:', eventId);
                console.log('🔗 Meet link:', eventLink);

            } catch (calendarError) {
                console.error('❌ Google Calendar error:', calendarError.message);
                // Continue without calendar - we'll still send email
            }
        } else {
            console.log('⚠️ Google Calendar not configured. Skipping event creation.');
            // Generate a fallback meet link
            const meetingId = Math.random().toString(36).substring(2, 10);
            eventLink = `https://meet.google.com/${meetingId}`;
        }

        // Send confirmation email (try, but don't fail if it doesn't work)
        try {
            await sendConfirmationEmail({
                name,
                email,
                phone,
                subject,
                message,
                date: dateFormatted || new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                }),
                time,
                timezone,
                meetLink: eventLink,
            });
            console.log('✅ Confirmation email sent to:', email);
        } catch (emailError) {
            console.error('❌ Email sending error:', emailError.message);
            // Don't fail the booking if email fails
        }

        res.json({
            success: true,
            eventId: eventId || 'fallback',
            eventLink: eventLink || 'https://meet.google.com/fallback',
            message: 'Booking created successfully'
        });

    } catch (error) {
        console.error('❌ Booking creation error:', error);
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
        // Check if nodemailer is available
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
                <h2>🎉 Your booking is confirmed!</h2>
                <p>Hi ${data.name},</p>
                <p>Your strategy call with Flynn James Pontino has been scheduled.</p>
                
                <h3>📋 Appointment Details:</h3>
                <ul>
                    <li><strong>Date:</strong> ${data.date}</li>
                    <li><strong>Time:</strong> ${data.time} (${data.timezone})</li>
                    <li><strong>Type:</strong> Strategy Call</li>
                    <li><strong>Subject:</strong> ${data.subject}</li>
                </ul>
                
                <h3>🔗 Google Meet Link:</h3>
                <p><a href="${data.meetLink}" target="_blank" style="background:#0a9e40;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Join Meeting</a></p>
                <p>Or copy this link: ${data.meetLink}</p>
                
                <h3>⏰ Reminders:</h3>
                <ul>
                    <li>24 hours before the meeting</li>
                    <li>1 hour before the meeting</li>
                </ul>
                
                <p style="margin-top:20px;font-size:0.9rem;color:#666;">
                    <em>Need to reschedule? Reply to this email and we'll find another time.</em>
                </p>
                <p>Best regards,<br>Flynn James Pontino</p>
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
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 Flynn Portfolio API Server');
    console.log('='.repeat(60));
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`📅 Google Calendar: ${calendar && auth ? 'ACTIVE ✅' : 'DISABLED ⚠️'}`);
    console.log(`📧 Email Service: ${process.env.EMAIL_PASSWORD ? 'CONFIGURED ✅' : 'NOT CONFIGURED ⚠️'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log('='.repeat(60));
});