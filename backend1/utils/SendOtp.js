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
        // Format phone number (remove +91 or 91 prefix if present)
        let cleanPhone = phoneNumber.replace(/^\+?91/, '');
        cleanPhone = cleanPhone.replace(/\D/g, ''); // Remove non-digits
        const formattedPhone = `91${cleanPhone}`; // Karix needs 91XXXXXXXXXX format
        
        console.log(`[Karix SMS] Sending OTP to ${formattedPhone}...`);

        // Use ONLY Karix API
        const karixApiKey = process.env.KARIX_API_KEY;
        const karixSenderId = process.env.KARIX_SENDER_ID || "TATHGT";
        
        if (!karixApiKey) {
            console.error("[Karix SMS] ERROR: KARIX_API_KEY not configured in environment");
            throw new Error("Karix API key not configured");
        }

        console.log(`[Karix SMS] Using Sender ID: ${karixSenderId}`);
        console.log(`[Karix SMS] API Key configured: ${karixApiKey.substring(0, 10)}...`);

        // Karix API v2 payload (NEW ENDPOINT: manage.karix.solutions)
        const payload = {
            ver: "1.0",
            key: karixApiKey,
            messages: [
                {
                    dest: [formattedPhone],
                    text: `Your TathaGat login OTP is ${otpCode}. Valid for 5 minutes. Do not share with anyone.`,
                    send: karixSenderId,
                    type: "Plain",
                    dlr_req: "1"
                }
            ]
        };

        console.log(`[Karix SMS] Request payload:`, JSON.stringify(payload, null, 2));

        // Using the NEW Karix API endpoint
        const response = await axios.post("https://manage.karix.solutions/api/v2/message", payload, {
            headers: { 
                "Content-Type": "application/json"
            },
            timeout: 15000
        });

        console.log(`[Karix SMS] Response status: ${response.status}`);
        console.log(`[Karix SMS] Response data:`, JSON.stringify(response.data));
        
        // Check for success
        if (response.data && (response.data.status?.code === "200" || response.data.ackid)) {
            return { status: 'success', provider: 'karix', data: response.data };
        } else {
            console.error("[Karix SMS] Unexpected response:", response.data);
            throw new Error(`Karix API returned: ${JSON.stringify(response.data)}`);
        }

    } catch (error) {
        const errorDetails = error.response?.data || error.message;
        console.error("[Karix SMS] ERROR:", errorDetails);
        
        if (error.code === 'ENOTFOUND') {
            console.error("[Karix SMS] DNS resolution failed. Check network connectivity.");
        }
        
        if (error.response?.status === 401) {
            console.error("[Karix SMS] Authentication failed. Check KARIX_API_KEY.");
        }
        
        if (error.response?.status === 403) {
            console.error("[Karix SMS] Forbidden. Check API permissions or sender ID.");
        }

        throw new Error(`SMS sending failed: ${error.message}`);
    }
};
