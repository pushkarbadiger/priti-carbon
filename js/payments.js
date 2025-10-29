// Priti Carbon Payment Integration System
// Supports Razorpay, Google Pay, and BharatPe

// Payment Configuration - using window.ENV for frontend
const PAYMENT_CONFIG = {
    razorpay: {
        key_id: window.ENV?.RAZORPAY_KEY_ID || 'rzp_test_9999999999',
        currency: 'INR',
        name: 'Priti Carbon',
        description: 'Carbon Credits Purchase',
        image: './assets/priti-carbon-logo-4k.png',
        theme: {
            color: '#10B981'
        }
    },
    googlePay: {
        environment: 'TEST', // Change to 'PRODUCTION' for live
        merchantId: window.ENV?.GOOGLE_PAY_MERCHANT_ID || '12345678901234567890',
        merchantName: 'Priti Carbon',
        countryCode: 'IN',
        currencyCode: 'INR'
    },
    bharatPe: {
        merchantId: window.ENV?.BHARATPE_MERCHANT_ID || 'merchant_12345',
        apiKey: window.ENV?.BHARATPE_API_KEY || 'test_api_key'
    }
};

// Payment Database Schema
let paymentDatabase = JSON.parse(localStorage.getItem('paymentDatabase')) || [];

// Save payment to database
function savePaymentRecord(paymentData) {
    const payment = {
        id: 'pay_' + Date.now(),
        receiptNumber: generateReceiptNumber(),
        userId: currentUser.id,
        userEmail: currentUser.email,
        userName: currentUser.name,
        listingId: paymentData.listingId,
        listingTitle: paymentData.listingTitle,
        amount: paymentData.amount,
        quantity: paymentData.quantity,
        pricePerUnit: paymentData.pricePerUnit,
        paymentMethod: paymentData.paymentMethod,
        paymentId: paymentData.paymentId,
        status: paymentData.status,
        timestamp: new Date().toISOString(),
        createdAt: Date.now()
    };
    
    paymentDatabase.push(payment);
    localStorage.setItem('paymentDatabase', JSON.stringify(paymentDatabase));
    
    // Send confirmation email
    sendPaymentConfirmationEmail(payment);
    
    return payment;
}

// Generate unique receipt number
function generateReceiptNumber() {
    const prefix = 'PC';
    const date = new Date();
    const dateStr = date.getFullYear().toString().slice(-2) + 
                   String(date.getMonth() + 1).padStart(2, '0') + 
                   String(date.getDate()).padStart(2, '0');
    const timeStr = Date.now().toString().slice(-6);
    return `${prefix}${dateStr}${timeStr}`;
}

// Send payment confirmation email
async function sendPaymentConfirmationEmail(payment) {
    const emailData = {
        to: payment.userEmail,
        subject: `Payment Confirmation - Receipt #${payment.receiptNumber}`,
        html: generateReceiptHTML(payment)
    };
    
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`Receipt #${payment.receiptNumber} sent to ${payment.userEmail}`, 'success');
        } else {
            console.error('Email sending failed:', result.error);
            showNotification('Receipt generated, but email delivery failed', 'warning');
        }
    } catch (error) {
        console.error('Email sending failed:', error);
        // Fallback - still show success but mention email issue
        showNotification(`Payment successful! Receipt #${payment.receiptNumber} (Email delivery pending)`, 'warning');
    }
}

// Generate receipt HTML
function generateReceiptHTML(payment) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            .amount { font-size: 24px; font-weight: bold; color: #10B981; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🌱 Priti Carbon</h1>
            <p>Payment Confirmation Receipt</p>
        </div>
        
        <div class="content">
            <h2>Thank you for your purchase!</h2>
            <p>Dear ${payment.userName},</p>
            <p>Your payment has been successfully processed. Here are your transaction details:</p>
            
            <table>
                <tr><th>Receipt Number:</th><td><strong>${payment.receiptNumber}</strong></td></tr>
                <tr><th>Date & Time:</th><td>${new Date(payment.timestamp).toLocaleString('en-IN')}</td></tr>
                <tr><th>Carbon Credits:</th><td>${payment.listingTitle}</td></tr>
                <tr><th>Quantity:</th><td>${payment.quantity} tons CO₂</td></tr>
                <tr><th>Price per unit:</th><td>₹${payment.pricePerUnit.toLocaleString('en-IN')}</td></tr>
                <tr><th>Payment Method:</th><td>${payment.paymentMethod}</td></tr>
                <tr><th>Payment ID:</th><td>${payment.paymentId}</td></tr>
                <tr><th>Total Amount:</th><td class="amount">₹${payment.amount.toLocaleString('en-IN')}</td></tr>
            </table>
            
            <p><strong>Environmental Impact:</strong></p>
            <p>🌍 You have offset <strong>${payment.quantity} tons of CO₂</strong> emissions!</p>
            <p>🌱 Thank you for contributing to a sustainable future.</p>
        </div>
        
        <div class="footer">
            <p>Priti Carbon - Indian Carbon Credits Marketplace</p>
            <p>Support: <a href="mailto:support@priticarbon.me">support@priticarbon.me</a> | Website: <a href="https://priticarbon.me">priticarbon.me</a></p>
            <p>This is an automated receipt. Please save this for your records.</p>
        </div>
    </body>
    </html>
    `;
}

// Razorpay Payment Integration
async function payWithRazorpay(listingId) {
    if (!currentUser) {
        showNotification('Please login to make a purchase', 'error');
        showPage('login');
        return;
    }
    
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
        showNotification('Listing not found', 'error');
        return;
    }
    
    const amount = listing.price * listing.quantity * 100; // Convert to paise
    
    const options = {
        key: PAYMENT_CONFIG.razorpay.key_id,
        amount: amount,
        currency: PAYMENT_CONFIG.razorpay.currency,
        name: PAYMENT_CONFIG.razorpay.name,
        description: `${listing.title} - ${listing.quantity} tons CO₂`,
        image: PAYMENT_CONFIG.razorpay.image,
        handler: function(response) {
            handlePaymentSuccess({
                listingId: listingId,
                listingTitle: listing.title,
                amount: listing.price * listing.quantity,
                quantity: listing.quantity,
                pricePerUnit: listing.price,
                paymentMethod: 'Razorpay',
                paymentId: response.razorpay_payment_id,
                status: 'completed'
            });
        },
        prefill: {
            name: currentUser.name,
            email: currentUser.email,
            contact: currentUser.phone || '9999999999'
        },
        notes: {
            listing_id: listingId,
            user_id: currentUser.id
        },
        theme: PAYMENT_CONFIG.razorpay.theme,
        modal: {
            ondismiss: function() {
                showNotification('Payment cancelled', 'warning');
            }
        }
    };
    
    const rzp = new Razorpay(options);
    rzp.open();
}

// Google Pay Integration
async function payWithGooglePay(listingId) {
    if (!currentUser) {
        showNotification('Please login to make a purchase', 'error');
        showPage('login');
        return;
    }
    
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
        showNotification('Listing not found', 'error');
        return;
    }
    
    const amount = listing.price * listing.quantity;
    
    const paymentDataRequest = {
        environment: PAYMENT_CONFIG.googlePay.environment,
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
            type: 'CARD',
            parameters: {
                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA']
            },
            tokenizationSpecification: {
                type: 'PAYMENT_GATEWAY',
                parameters: {
                    gateway: 'razorpay',
                    gatewayMerchantId: PAYMENT_CONFIG.googlePay.merchantId
                }
            }
        }],
        merchantInfo: {
            merchantId: PAYMENT_CONFIG.googlePay.merchantId,
            merchantName: PAYMENT_CONFIG.googlePay.merchantName
        },
        transactionInfo: {
            totalPriceStatus: 'FINAL',
            totalPrice: amount.toString(),
            currencyCode: PAYMENT_CONFIG.googlePay.currencyCode,
            countryCode: PAYMENT_CONFIG.googlePay.countryCode
        }
    };
    
    try {
        const paymentsClient = new google.payments.api.PaymentsClient({ environment: PAYMENT_CONFIG.googlePay.environment });
        
        const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
        
        // Process payment data
        handlePaymentSuccess({
            listingId: listingId,
            listingTitle: listing.title,
            amount: amount,
            quantity: listing.quantity,
            pricePerUnit: listing.price,
            paymentMethod: 'Google Pay',
            paymentId: 'gpay_' + Date.now(),
            status: 'completed'
        });
        
    } catch (err) {
        if (err.statusCode === 'CANCELED') {
            showNotification('Payment cancelled', 'warning');
        } else {
            showNotification('Google Pay not available. Please try another payment method.', 'error');
            console.error('Google Pay error:', err);
        }
    }
}

// BharatPe Payment Integration (Mock implementation)
async function payWithBharatPe(listingId) {
    if (!currentUser) {
        showNotification('Please login to make a purchase', 'error');
        showPage('login');
        return;
    }
    
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
        showNotification('Listing not found', 'error');
        return;
    }
    
    const amount = listing.price * listing.quantity;
    
    // Mock BharatPe payment flow
    const confirmed = confirm(`Pay ₹${amount.toLocaleString('en-IN')} via BharatPe for ${listing.quantity} tons of ${listing.title}?`);
    
    if (confirmed) {
        // Simulate payment processing
        showNotification('Processing BharatPe payment...', 'info');
        
        setTimeout(() => {
            handlePaymentSuccess({
                listingId: listingId,
                listingTitle: listing.title,
                amount: amount,
                quantity: listing.quantity,
                pricePerUnit: listing.price,
                paymentMethod: 'BharatPe',
                paymentId: 'bp_' + Date.now(),
                status: 'completed'
            });
        }, 2000);
    }
}

// Handle successful payment
function handlePaymentSuccess(paymentData) {
    const payment = savePaymentRecord(paymentData);
    
    // Update user's purchase history
    if (!currentUser.purchases) {
        currentUser.purchases = [];
    }
    currentUser.purchases.push(payment.id);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Show success message
    showNotification(`Payment successful! Receipt #${payment.receiptNumber}`, 'success');
    
    // Update company dashboard if user is on it
    if (currentUser.role === 'company') {
        updateCompanyDashboard();
    }
    
    // Show payment confirmation modal
    showPaymentConfirmationModal(payment);
}

// Show payment confirmation modal
function showPaymentConfirmationModal(payment) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md mx-4">
            <div class="text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <i class="fas fa-check text-green-600 text-xl"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h3>
                <p class="text-sm text-gray-500 mb-4">Receipt #${payment.receiptNumber}</p>
                
                <div class="bg-gray-50 rounded-lg p-4 mb-6">
                    <div class="text-sm text-gray-600 space-y-1">
                        <p><strong>Amount:</strong> ₹${payment.amount.toLocaleString('en-IN')}</p>
                        <p><strong>Carbon Credits:</strong> ${payment.quantity} tons CO₂</p>
                        <p><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
                        <p><strong>Confirmation sent to:</strong> ${payment.userEmail}</p>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        Continue Shopping
                    </button>
                    <button onclick="downloadReceipt('${payment.id}')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        Download Receipt
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-close after 10 seconds
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 10000);
}

// Download receipt as PDF (mock implementation)
function downloadReceipt(paymentId) {
    const payment = paymentDatabase.find(p => p.id === paymentId);
    if (!payment) return;
    
    // Create a simple text receipt for download
    const receiptContent = `
PRITI CARBON - PAYMENT RECEIPT
===============================

Receipt Number: ${payment.receiptNumber}
Date: ${new Date(payment.timestamp).toLocaleString('en-IN')}

Customer Details:
- Name: ${payment.userName}
- Email: ${payment.userEmail}

Purchase Details:
- Item: ${payment.listingTitle}
- Quantity: ${payment.quantity} tons CO₂
- Price per unit: ₹${payment.pricePerUnit.toLocaleString('en-IN')}
- Total Amount: ₹${payment.amount.toLocaleString('en-IN')}

Payment Information:
- Method: ${payment.paymentMethod}
- Payment ID: ${payment.paymentId}
- Status: ${payment.status}

Environmental Impact:
🌍 Carbon Offset: ${payment.quantity} tons CO₂
🌱 Thank you for contributing to sustainability!

Support: support@priticarbon.me
Website: https://priticarbon.me

This is a computer-generated receipt.
    `;
    
    // Create download link
    const element = document.createElement('a');
    const file = new Blob([receiptContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `PritiCarbon_Receipt_${payment.receiptNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    showNotification('Receipt downloaded successfully!', 'success');
}

// Get user's payment history
function getUserPayments(userId) {
    return paymentDatabase.filter(payment => payment.userId === userId);
}

// Get payment statistics
function getPaymentStats() {
    const totalPayments = paymentDatabase.length;
    const totalAmount = paymentDatabase.reduce((sum, payment) => sum + payment.amount, 0);
    const totalCO2Offset = paymentDatabase.reduce((sum, payment) => sum + payment.quantity, 0);
    
    return {
        totalPayments,
        totalAmount,
        totalCO2Offset
    };
}