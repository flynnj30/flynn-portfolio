// server.js - Google Calendar API Integration
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

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
                { email: 'va.flynnjames@gmail.com' }
            ],
            conferenceData: {
                createRequest: {
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                    requestId: `meeting-${Date.now()}`,
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

        // Schedule reminders (24h and 1h before)
        scheduleReminder({
            name,
            email,
            date: dateFormatted,
            time,
            timezone,
            meetLink: eventLink,
            startDateTime,
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
// SEND CONFIRMATION EMAIL (Nodemailer)
// ============================================================
async function sendConfirmationEmail(data) {
    const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: `"Flynn James Pontino" <${process.env.EMAIL_USER}>`,
        to: [data.email, 'va.flynnjames@gmail.com'],
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
                <li>You'll receive a reminder 24 hours before the meeting</li>
                <li>You'll receive a reminder 1 hour before the meeting</li>
            </ul>
            
            <p style="margin-top:20px;font-size:0.9rem;color:#666;">
                <em>Need to reschedule? Reply to this email and we'll find another time.</em>
            </p>
            <p>Best regards,<br>Flynn James Pontino</p>
        `,
    };

    await transporter.sendMail(mailOptions);
}

// ============================================================
// SCHEDULE REMINDERS
// ============================================================
function scheduleReminder(data) {
    const startTime = new Date(data.startDateTime);
    const now = new Date();
    
    // Calculate 24h and 1h before
    const twentyFourHours = new Date(startTime);
    twentyFourHours.setHours(twentyFourHours.getHours() - 24);
    
    const oneHour = new Date(startTime);
    oneHour.setHours(oneHour.getHours() - 1);

    // In production, use a job scheduler like node-cron or Bull
    // For now, log the scheduled reminders
    console.log(`📧 24h reminder scheduled for ${data.email} at ${twentyFourHours}`);
    console.log(`📧 1h reminder scheduled for ${data.email} at ${oneHour}`);
    
    // Actual implementation would use a queue system
    // Example with setTimeout (not recommended for production)
    // scheduleReminderJob(twentyFourHours, data, '24h');
    // scheduleReminderJob(oneHour, data, '1h');
}

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Booking server running on port ${PORT}`);
    console.log('✅ Google Calendar integration ready');
    console.log('✅ Google Meet auto-creation enabled');
});