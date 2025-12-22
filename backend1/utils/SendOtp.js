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
        
        console.log(`Sending OTP ${otpCode} to ${cleanPhone}...`);

        // Try Fast2SMS first (India's reliable SMS provider)
        const fast2smsKey = process.env.FAST2SMS_API_KEY;
        
        if (fast2smsKey) {
            try {
                const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
                    variables_values: otpCode,
                    route: 'otp',
                    numbers: cleanPhone
                }, {
                    headers: {
                        'authorization': fast2smsKey,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });

                if (response.data && response.data.return) {
                    console.log(`Fast2SMS response:`, JSON.stringify(response.data));
                    return { status: 'success', provider: 'fast2sms', data: response.data };
                }
            } catch (fast2smsError) {
                console.error("Fast2SMS error:", fast2smsError.response?.data || fast2smsError.message);
            }
        }

        // Try Karix as fallback
        const karixKey = process.env.KARIX_API_KEY;
        
        if (karixKey) {
            try {
                const formattedWithPlus = `+91${cleanPhone}`;
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
                        "Authorization": `Bearer ${karixKey}`
                    },
                    timeout: 10000
                });

                if (response.data) {
                    console.log(`Karix SMS response:`, JSON.stringify(response.data));
                    return { status: 'success', provider: 'karix', data: response.data };
                }
            } catch (karixError) {
                console.error("Karix error:", karixError.response?.data || karixError.message);
            }
        }

        // If both SMS providers fail, log OTP for development/testing
        console.log(`[SMS FALLBACK] No SMS provider available. OTP for phone ${cleanPhone}: ${otpCode}`);
        console.log(`[SMS FALLBACK] For testing, use OTP: ${otpCode}`);
        
        return { status: 'fallback', message: 'SMS not sent - check logs for OTP' };
    } catch (error) {
        console.error("Error in sendOtpPhoneUtil:", error.message);
        console.log(`[SMS ERROR FALLBACK] OTP for testing: ${otpCode}`);
        return { status: 'error', message: error.message };
    }
};
