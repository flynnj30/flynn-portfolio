// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'flynn-portfolio-api'
    });
});

// ============================================================
// GOOGLE CALENDAR CONFIGURATION
// ============================================================
const auth = new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events']
);

const calendar = google.calendar({ version: 'v3', auth });

// ============================================================
// CREATE BOOKING ENDPOINT
// ============================================================
app.post('/api/create-booking', async (req, res) => {
    try {
        const { name, email, phone, subject, message, date, time, timezone, dateFormatted } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !date || !time) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Convert time to 24-hour format
        function convertTimeTo24Hour(timeStr) {
            const [time, modifier] = timeStr.split(' ');
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
        const startDateTime = new Date(`${date}T${convertTimeTo24Hour(time)}:00`);
        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + 30);

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

        const eventLink = response.data.hangoutLink || response.data.htmlLink;

        // Send confirmation email
        await sendConfirmationEmail({
            name,
            email,
            phone,
            subject,
            message,
            date: dateFormatted,
            time,
            timezone,
            meetLink: eventLink,
        });

        res.json({
            success: true,
            eventId: response.data.id,
            eventLink: eventLink,
            message: 'Booking created successfully'
        });

    } catch (error) {
        console.error('Booking creation error:', error);
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
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'va.flynnjames@gmail.com',
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: `"Flynn James Pontino" <${process.env.EMAIL_USER || 'va.flynnjames@gmail.com'}>`,
            to: [data.email, process.env.EMAIL_USER || 'va.flynnjames@gmail.com'],
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
        console.error('Email sending error:', error);
        // Don't fail the booking if email fails
    }
}

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`🚀 Booking server running on port ${PORT}`);
    console.log(`📅 Google Calendar integration: ${auth ? 'ACTIVE' : 'DISABLED'}`);
    console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
});