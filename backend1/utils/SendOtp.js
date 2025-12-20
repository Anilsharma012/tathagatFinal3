const nodemailer = require('nodemailer');
require('dotenv').config();
const axios = require("axios");

// Create transporter with better error handling
const createTransporter = async () => {
    // For development, use a demo email service
    if (process.env.NODE_ENV === 'development') {
        try {
            // Create a test account for development
            const testAccount = await nodemailer.createTestAccount();

            console.log('Using Ethereal Email for development testing');
            console.log('Test account:', testAccount.user);

            return nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
        } catch (error) {
            console.warn('Could not create test email account, falling back to Gmail');
        }
    }

    // Production Gmail configuration
    if (!process.env.EMAIL || !process.env.EMAIL_PASSWORD) {
        console.warn('Gmail credentials not configured');
        return null;
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

let transporter = null;
createTransporter().then(t => { transporter = t; });

exports.sendOtpEmailUtil = async (email, otpCode) => {
    try {
        // Wait for transporter to be initialized if needed
        if (!transporter) {
            transporter = await createTransporter();
        }

        if (!transporter) {
            throw new Error('Email transporter not configured');
        }

        const mailOptions = {
            from: process.env.EMAIL || 'noreply@tathagat.com',
            to: email,
            subject: 'TathaGat - Your OTP Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4f46e5; text-align: center;">TathaGat OTP Verification</h2>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center;">
                        <p style="font-size: 18px; margin: 10px 0;">Your OTP code is:</p>
                        <h1 style="font-size: 32px; color: #1a202c; letter-spacing: 4px; margin: 20px 0;">${otpCode}</h1>
                        <p style="color: #718096; font-size: 14px;">This code will expire in 5 minutes.</p>
                    </div>
                    <p style="color: #4a5568; text-align: center; margin-top: 20px;">
                        If you didn't request this code, please ignore this email.
                    </p>
                </div>
            `,
            text: `Your TathaGat OTP code is: ${otpCode}. It will expire in 5 minutes.`,
        };

        const info = await transporter.sendMail(mailOptions);

        // For development with Ethereal, log the preview URL
        if (process.env.NODE_ENV === 'development' && info.messageId) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log('Preview email: ' + previewUrl);
            }
        }

        console.log(`Email sent successfully to ${email} (Message ID: ${info.messageId})`);

    } catch (error) {
        console.error('Error sending OTP email:', error.message);
        throw error;
    }
};

exports.sendOtpPhoneUtil = async (phoneNumber, otpCode) => {
    try {
        // Format phone number with country code (91 for India)
        const formattedPhone = phoneNumber.startsWith('91') ? phoneNumber : `91${phoneNumber}`;
        const formattedWithPlus = `+${formattedPhone}`;

        console.log(`Sending OTP to ${formattedWithPlus}...`);

        // Try Karix API v2 (new endpoint)
        const apiKey = process.env.KARIX_API_KEY;
        
        if (!apiKey) {
            console.error("KARIX_API_KEY not configured");
            throw new Error("SMS service not configured");
        }

        // Karix API v2 format
        const payload = {
            channel: "sms",
            source: process.env.KARIX_SENDER_ID || "TATHGT",
            destination: [formattedWithPlus],
            content: {
                text: `Your TathaGat login OTP is ${otpCode}. Valid for 5 minutes. Do not share with anyone.`
            }
        };

        const response = await axios.post("https://api.karix.io/message/", payload, {
            headers: { 
                "Content-Type": "application/json",
                "api-version": "2.0",
                "Authorization": `Bearer ${apiKey}`
            },
            timeout: 10000
        });

        if (response.data) {
            console.log(`Karix SMS response:`, JSON.stringify(response.data));
        }

        return response.data;
    } catch (error) {
        console.error("Error sending OTP via Karix:", error.response ? error.response.data : error.message);
        
        // If Karix fails, log the OTP for testing (remove in production)
        console.log(`[FALLBACK] OTP for testing: ${otpCode}`);
        
        // Don't throw error - let the flow continue for testing
        // In production, you would throw here
        return { status: 'fallback', message: 'OTP logged for testing' };
    }
};
