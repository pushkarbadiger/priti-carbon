// Vercel API Function for Payment Processing
// File: api/process-payment.js

const Razorpay = require('razorpay');

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        return handlePaymentCreation(req, res);
    } else if (req.method === 'PUT') {
        return handlePaymentVerification(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

async function handlePaymentCreation(req, res) {
    const { amount, currency, receipt, notes } = req.body;

    if (!amount || !currency) {
        return res.status(400).json({ error: 'Missing required fields: amount, currency' });
    }

    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        const options = {
            amount: amount * 100, // Convert to paise
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`,
            notes: notes || {}
        };

        const order = await razorpay.orders.create(options);

        res.status(201).json({
            success: true,
            order: order
        });

    } catch (error) {
        console.error('Payment creation error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Failed to create payment order',
            details: error.message
        });
    }
}

async function handlePaymentVerification(req, res) {
    const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        payment_data 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment verification data' });
    }

    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });

        // Verify payment signature
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Payment signature verification failed'
            });
        }

        // Fetch payment details
        const payment = await razorpay.payments.fetch(razorpay_payment_id);

        // Here you would typically:
        // 1. Save payment record to database
        // 2. Update user's purchase history
        // 3. Send confirmation email
        // 4. Update carbon credit listing availability

        console.log('Payment verified successfully:', {
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id,
            amount: payment.amount,
            status: payment.status
        });

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            payment: {
                id: payment.id,
                amount: payment.amount,
                status: payment.status,
                method: payment.method,
                created_at: payment.created_at
            }
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        
        res.status(500).json({
            success: false,
            error: 'Payment verification failed',
            details: error.message
        });
    }
}
