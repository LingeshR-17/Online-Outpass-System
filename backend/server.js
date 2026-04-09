const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Rate limiter: 5 requests per 15 mins for the notification endpoint
const notifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many requests. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const allowedOrigins = [
    FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g., curl, Postman, test-email route)
        if (!origin) return callback(null, true);
        if (allowedOrigins.some(o => origin.startsWith(o))) {
            return callback(null, true);
        }
        return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST'],
    credentials: true
}));


app.use(express.json());

// Set up Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/api/notify-parent', async (req, res) => {
    const { outpassId, studentName, parentEmail } = req.body;

    const approveLink = `${FRONTEND_URL}/parent-approval?id=${outpassId}&action=approve`;
    const rejectLink = `${FRONTEND_URL}/parent-approval?id=${outpassId}&action=reject`;


    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: parentEmail,
        subject: `Outpass Approval Request for ${studentName}`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ccc; max-width: 600px;">
                <h2>Outpass Approval Required</h2>
                <p>Dear Parent,</p>
                <p>Your child, <strong style="color: #2563eb;">${studentName}</strong>, has submitted an outpass request.</p>
                <p>As part of the security protocol, we require your approval before the Class Advisor can process the request.</p>
                
                <div style="margin: 30px 0;">
                    <a href="${approveLink}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 15px; font-weight: bold; display: inline-block;">Approve Request</a>
                    <a href="${rejectLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reject Request</a>
                </div>
                
                <p style="color: #666; font-size: 0.9em; line-height: 1.5;">If you did not authorize this, or if you have any questions, please contact the Class Advisor or the HOD immediately.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Approval email successfully sent to ${parentEmail}`);
        res.status(200).json({ message: 'Email and simulated SMS logged successfully' });
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        res.status(500).json({ error: 'Failed to send email. Ensure you have set up EMAIL_USER and EMAIL_PASS in .env.' });
    }
});
app.get("/", (req, res) => {
    res.send("Running successfully");
});

// Diagnostic Route: Test Email from Browser
app.get('/test-email', async (req, res) => {
    console.log('🧪 Diagnostic: Manual Email Test Triggered');
    const testMail = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to self
        subject: 'Diagnostic Test Email',
        text: 'If you see this, your backend email configuration is working perfectly!'
    };

    try {
        await transporter.sendMail(testMail);
        res.send('<h1>✅ Success!</h1><p>Test email sent to yourself. Check your inbox.</p>');
    } catch (err) {
        console.error('❌ Diagnostic Failed:', err.message);
        res.status(500).send(`<h1>❌ Email Failed</h1><p>Error: ${err.message}</p><p>Check your Render Logs for details.</p>`);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 API running on port ${PORT}`);
});

