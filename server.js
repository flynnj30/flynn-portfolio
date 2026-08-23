// server.js - FIXED VERSION (Attendees Removed)
const express = require('express');
const cors = require('cors');

try {
    require('dotenv').config();
    console.log('✅ dotenv loaded');
} catch (e) {
    console.log('⚠️ dotenv not available');
}

const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'flynn-portfolio-api'
    });
});

app.get('/', (req, res) => {
    res.json({ name: 'Flynn Portfolio API', version: '1.0.0', status: 'running' });
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
        console.log('✅ Google Calendar initialized');
        return true;
    } catch (error) {
        console.error('❌ Calendar init error:', error.message);
        return false;
    }
}

initializeCalendar();

// ============================================================
// CREATE BOOKING - FIXED VERSION
// ============================================================
app.post('/api/create-booking', async (req, res) => {
    console.log('📝 Booking request received');

    try {
        const { name, email, phone, subject, message, date, time, timezone } = req.body;

        // Validate
        if (!name || !email || !subject || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
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
        // CREATE CALENDAR EVENT - WITHOUT ATTENDEES
        // ============================================================
        if (calendar && auth && calendarInitialized) {
            try {
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
                        ],
                    },
                };

                console.log('📅 Creating Google Calendar event...');

                const response = await calendar.events.insert({
                    calendarId: 'primary',
                    resource: event,
                    conferenceDataVersion: 1,
                    sendUpdates: 'all',
                });

                eventLink = response.data.hangoutLink || response.data.htmlLink;
                eventId = response.data.id;
                calendarSuccess = true;
                
                console.log('✅ Calendar event created successfully!');
                console.log('🔗 Meet link:', eventLink);

            } catch (error) {
                console.error('❌ Calendar API Error:', error.message);
            }
        } else {
            console.log('⚠️ Calendar not configured - skipping event creation');
        }

        // ============================================================
        // FALLBACK MEET LINK
        // ============================================================
        if (!eventLink) {
            const meetingId = Math.random().toString(36).substring(2, 10);
            eventLink = `https://meet.google.com/${meetingId}`;
            console.log('⚠️ Using fallback Meet link:', eventLink);
        }

        // ============================================================
        // FORMAT DATE
        // ============================================================
        const displayDate = new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        // ============================================================
        // RESPONSE
        // ============================================================
        const responseData = {
            success: true,
            calendarCreated: calendarSuccess,
            eventId: eventId || null,
            eventLink: eventLink,
            meetLink: eventLink,
            message: calendarSuccess ? 'Booking created and added to calendar' : 'Booking created (calendar event failed)'
        };

        console.log('📤 Response:', JSON.stringify(responseData, null, 2));

        // Try to send email
        try {
            await sendConfirmationEmail({
                name, email, phone, subject, message,
                date: displayDate,
                time,
                timezone,
                meetLink: eventLink,
                eventId: eventId,
                calendarSuccess: calendarSuccess
            });
            console.log('✅ Confirmation email sent');
        } catch (emailError) {
            console.error('❌ Email error:', emailError.message);
        }

        res.json(responseData);

    } catch (error) {
        console.error('❌ Booking error:', error);
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
        let nodemailer;
        try { nodemailer = require('nodemailer'); } catch (e) { return; }

        const emailUser = process.env.EMAIL_USER || 'va.flynnjames@gmail.com';
        const emailPass = process.env.EMAIL_PASSWORD;

        if (!emailPass) {
            console.log('⚠️ EMAIL_PASSWORD not set');
            return;
        }

        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: { user: emailUser, pass: emailPass },
        });

        const mailOptions = {
            from: `"Flynn James Pontino" <${emailUser}>`,
            to: [data.email, emailUser],
            subject: `✅ Booking Confirmed: Strategy Call with Flynn James Pontino`,
            html: `
                <h2>🎉 Booking Confirmed!</h2>
                <p>Hi <strong>${data.name}</strong>,</p>
                <p>Your strategy call with Flynn James Pontino has been confirmed.</p>
                
                <div style="background: #f0f0f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <h3>📋 Appointment Details</h3>
                    <p><strong>Date:</strong> ${data.date}</p>
                    <p><strong>Time:</strong> ${data.time} (${data.timezone})</p>
                    <p><strong>Subject:</strong> ${data.subject}</p>
                    ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
                </div>
                
                <div style="background: #e8f5e9; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <h3>🔗 Google Meet Link</h3>
                    <p><a href="${data.meetLink}" target="_blank" style="background: #0a9e40; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block;">Join Meeting</a></p>
                    <p style="font-size: 12px; color: #666;">${data.meetLink}</p>
                    ${data.calendarSuccess ? '<p style="color: #0a9e40; font-size: 12px;">✅ Added to your Google Calendar</p>' : ''}
                </div>
                
                <p>You'll receive reminders 24 hours and 1 hour before the meeting.</p>
                <p>Best regards,<br><strong>Flynn James Pontino</strong></p>
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
// START SERVER
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚀 Flynn Portfolio API Server (FIXED)');
    console.log('='.repeat(60));
    console.log(`📡 Port: ${PORT}`);
    console.log(`📅 Calendar: ${calendar && auth ? 'ACTIVE ✅' : 'DISABLED ⚠️'}`);
    console.log(`📧 Email: ${process.env.EMAIL_PASSWORD ? 'CONFIGURED ✅' : 'NOT CONFIGURED ⚠️'}`);
    console.log('📋 POST /api/create-booking');
    console.log('📌 Attendees removed - events will be created without invitations');
    console.log('='.repeat(60));
});