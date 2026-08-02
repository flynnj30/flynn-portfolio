/**
 * ============================================================
 * SERVER-SIDE reCAPTCHA VERIFICATION
 * ============================================================
 * This is a serverless function / API route that verifies
 * the reCAPTCHA token with Google's servers.
 * 
 * IMPORTANT: The secret key must NEVER be exposed to the client.
 * 
 * For local development, create a .env file:
 *   RECAPTCHA_SECRET_KEY=your_secret_key_here
 * 
 * For Render.com deployment, set an environment variable:
 *   Key: RECAPTCHA_SECRET_KEY
 *   Value: your_secret_key_here
 * ============================================================
 */

// ============================================================
// DEPENDENCIES
// ============================================================
// Install with: npm install express cors dotenv node-fetch
// ============================================================

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// ============================================================
// INITIALIZE EXPRESS APP
// ============================================================
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================
// Enable CORS for all routes
app.use(cors({
    origin: '*', // In production, restrict to your domain
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Parse JSON request bodies
app.use(express.json());

// Serve static files (optional - for serving your portfolio)
app.use(express.static(path.join(__dirname, '..')));

// ============================================================
// CONFIGURATION
// ============================================================
// Get secret key from environment variable - NEVER hardcode!
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

// Log configuration status
if (!RECAPTCHA_SECRET_KEY) {
    console.error('❌ ERROR: RECAPTCHA_SECRET_KEY environment variable is not set!');
    console.error('📋 Please set it in your .env file or deployment environment variables.');
    console.error('📋 Get your secret key from: https://www.google.com/recaptcha/admin/');
} else {
    console.log('✅ RECAPTCHA_SECRET_KEY is configured');
}

// ============================================================
// API ROUTE: Verify reCAPTCHA
// ============================================================
app.post('/api/verify-recaptcha', async (req, res) => {
    // Set response headers for security
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    // Extract token from request body
    const { token } = req.body;

    // Validate token presence
    if (!token) {
        console.warn('⚠️ reCAPTCHA verification failed: Missing token');
        return res.status(400).json({
            success: false,
            message: 'Missing reCAPTCHA token. Please complete the reCAPTCHA challenge.'
        });
    }

    // Check if secret key is configured
    if (!RECAPTCHA_SECRET_KEY) {
        console.error('❌ reCAPTCHA verification failed: Secret key not configured');
        return res.status(500).json({
            success: false,
            message: 'Server configuration error. Please contact the site administrator.'
        });
    }

    try {
        console.log('🔍 Verifying reCAPTCHA token...');

        // Send verification request to Google's API
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`
        });

        // Parse Google's response
        const data = await response.json();

        // Log the response for debugging (without exposing sensitive data)
        console.log('📊 Google reCAPTCHA Response:', {
            success: data.success,
            score: data.score,
            action: data.action,
            challenge_ts: data.challenge_ts,
            hostname: data.hostname,
            error_codes: data['error-codes'] || []
        });

        // Check if verification was successful
        if (data.success === true) {
            // For reCAPTCHA v2, success: true is sufficient
            // For v3, you might also want to check the score
            console.log('✅ reCAPTCHA verification successful!');
            return res.json({
                success: true,
                message: 'reCAPTCHA verified successfully',
                timestamp: new Date().toISOString()
            });
        } else {
            // Verification failed - log the error codes
            const errorCodes = data['error-codes'] || ['Unknown error'];
            console.error('❌ reCAPTCHA verification failed:', errorCodes.join(', '));
            
            return res.status(400).json({
                success: false,
                message: `reCAPTCHA verification failed: ${errorCodes.join(', ')}. Please try again.`
            });
        }
    } catch (error) {
        // Handle network or parsing errors
        console.error('❌ reCAPTCHA verification error:', error.message);
        
        return res.status(500).json({
            success: false,
            message: 'Server error during reCAPTCHA verification. Please try again later.'
        });
    }
});

// ============================================================
// HEALTH CHECK ENDPOINT
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        recaptcha_configured: !!RECAPTCHA_SECRET_KEY,
        environment: process.env.NODE_ENV || 'development'
    });
});

// ============================================================
// FALLBACK ROUTE (for SPA routing)
// ============================================================
app.get('*', (req, res) => {
    // For static sites, serve the index.html
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log('=' .repeat(60));
    console.log('🚀 reCAPTCHA Verification Server');
    console.log('=' .repeat(60));
    console.log(`📡 Server running on port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔒 reCAPTCHA Secret Key: ${RECAPTCHA_SECRET_KEY ? '✓ Configured' : '✗ Missing'}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`📋 reCAPTCHA API: POST http://localhost:${PORT}/api/verify-recaptcha`);
    console.log('=' .repeat(60));
    console.log('⚠️  Important: Never expose your RECAPTCHA_SECRET_KEY in client-side code!');
    console.log('=' .repeat(60));
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM signal, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT signal, shutting down gracefully...');
    process.exit(0);
});

// ============================================================
// EXPORT FOR TESTING
// ============================================================
module.exports = app;