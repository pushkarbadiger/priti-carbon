# 🌱 Priti Carbon - Indian Carbon Credits Marketplace

[![Deploy to Vercel](https://github.com/pushkarbadiger/priti-carbon/actions/workflows/deploy.yml/badge.svg)](https://github.com/pushkarbadiger/priti-carbon/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready platform connecting Indian farmers with companies for verified carbon credit trading with integrated payments and real-time market analytics.

## 🚀 **Live Demo**
- **Website**: [https://priticarbon.vercel.app](https://priticarbon.vercel.app)
- **Admin Panel**: Login with admin credentials for full access

## ✨ **Key Features**

### 💳 **Integrated Payment System**
- **Razorpay**: Cards, UPI, Net Banking, Wallets
- **Google Pay**: Quick & secure payments
- **BharatPe**: UPI & digital payment solutions
- **Auto Receipt Generation**: Email confirmations with unique receipt numbers
- **Payment Logging**: Complete transaction history and analytics

### 🔐 **Seamless Authentication**
- **Instant Access**: No approval delays - start trading immediately
- **Secure Sessions**: JWT-style authentication with password hashing
- **Role-based Access**: Farmer and Company dashboards
- **Auto-login**: Smooth signup → login → dashboard flow

### 📊 **Real-Time Market Analytics**
- **Live Charts**: Auto-refreshing carbon credit price tracking
- **Multiple Timeframes**: 1D, 7D, 30D market views
- **Interactive UI**: Chart.js powered with hover tooltips
- **Current Pricing**: ₹600-800/ton with live updates

### 🇮🇳 **Indian Market Optimized**
- **Complete INR Integration**: Native Indian Rupee support
- **All 29 States**: Geographic filtering and location-based search
- **Regional Features**: Tailored for Indian carbon credit market
- **Professional Support**: Official domain emails and 24/7 support

## 🛠 **Tech Stack**

### Frontend
- **HTML5/CSS3**: Semantic structure with Tailwind CSS
- **Vanilla JavaScript**: Modern ES6+ with async/await
- **Chart.js**: Real-time market analytics
- **Responsive Design**: Mobile-first approach

### Backend APIs (Vercel Functions)
- **Node.js**: Serverless functions for payment and email processing
- **Razorpay SDK**: Payment gateway integration
- **Nodemailer**: SMTP email delivery
- **MongoDB**: User and transaction data storage

### Payment Integration
- **Razorpay**: Primary payment processor
- **Google Pay API**: Mobile-optimized payments
- **BharatPe**: UPI and digital payments

## 🔧 **Environment Variables**

Create a `.env` file or configure in Vercel:

```bash
# Payment Gateway Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
BHARATPE_MERCHANT_ID=your_bharatpe_merchant_id
BHARATPE_API_KEY=your_bharatpe_api_key
GOOGLE_PAY_MERCHANT_ID=your_google_pay_merchant_id

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=support@priticarbon.me
SMTP_PASS=your_app_specific_password
EMAIL_FROM=support@priticarbon.me

# Database Configuration
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_here

# Official Domain Emails
SUPPORT_EMAIL=support@priticarbon.me
PUSHKAR_EMAIL=pushkar@priticarbon.me
YASH_EMAIL=yash@priticarbon.me

# Application Configuration
APP_URL=https://priticarbon.vercel.app
NODE_ENV=production
```

## 🚀 **Quick Deploy to Vercel**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpushkarbadiger%2Fpriti-carbon)

### Manual Deployment Steps:

1. **Fork/Clone Repository**
   ```bash
   git clone https://github.com/pushkarbadiger/priti-carbon.git
   cd priti-carbon
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

4. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all required environment variables from `.env` template

## 📱 **User Flows**

### **Farmer Journey**
1. **Sign Up** → Instant account creation (no approval needed)
2. **Auto-Login** → Redirected to farmer dashboard
3. **Add Listings** → Create carbon credit listings with INR pricing
4. **Real-time Analytics** → View market trends and pricing
5. **Earnings Tracking** → Monitor sales and environmental impact

### **Company Journey**
1. **Sign Up** → Immediate access to marketplace
2. **Browse Credits** → Filter by state, district, price range
3. **Secure Payment** → Choose Razorpay/Google Pay/BharatPe
4. **Instant Receipt** → Email confirmation with unique receipt number
5. **Impact Tracking** → Monitor CO₂ offset and purchase history

### **Payment Process**
1. **Select Credits** → Choose from verified farmer listings
2. **Payment Method** → Razorpay, Google Pay, or BharatPe
3. **Secure Processing** → Encrypted payment handling
4. **Auto Receipt** → Email confirmation with download option
5. **Database Logging** → Complete transaction records

## 📧 **Official Support**

- **General Support**: [support@priticarbon.me](mailto:support@priticarbon.me)
- **Yash (Primary)**: [yash@priticarbon.me](mailto:yash@priticarbon.me)
- **Pushkar (Technical)**: [pushkar@priticarbon.me](mailto:pushkar@priticarbon.me)

## 🎨 **Branding Assets**

High-quality logo assets included:
- `assets/priti-carbon-logo-4k.png` - Square logo (1024×1024)
- `assets/priti-carbon-logo-banner.png` - Horizontal banner
- `assets/priti-carbon-logo-4k.jpg` - JPG version for compatibility

## 🔒 **Security Features**

- **Password Hashing**: Secure client-side password processing
- **Session Management**: Auto-expiring secure sessions
- **Input Sanitization**: XSS and injection attack prevention
- **Rate Limiting**: API abuse protection
- **HTTPS Enforcement**: Secure data transmission
- **Payment Security**: PCI-compliant payment processing

## 🌍 **Environmental Impact**

Track your positive environmental impact:
- **CO₂ Offset Tracking**: Monitor total carbon offset in tons
- **Verified Credits**: All listings from certified sustainable practices
- **Real Impact**: Supporting Indian farmers in sustainable agriculture
- **Transparency**: Complete transaction and impact records

## 📊 **Payment Analytics**

Complete payment tracking system:
- **Transaction History**: Detailed payment records
- **Revenue Analytics**: Farmer earnings and company spending
- **Payment Methods**: Track popular payment preferences
- **Receipt Management**: Automatic receipt generation and email delivery

## 🔄 **Auto Deployment**

GitHub Actions automatically deploys to Vercel on:
- **Push to main/master branch**
- **Pull request merges**
- **Manual workflow triggers**

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🌟 **Acknowledgments**

- Built for the Indian carbon credits market
- Supports sustainable farming practices
- Promotes environmental responsibility
- Connects rural farmers with urban companies

---

**© 2024 Priti Carbon. Made in India 🇮🇳 | Connecting Farmers & Companies for a Sustainable Future**

**Repository**: [https://github.com/pushkarbadiger/priti-carbon](https://github.com/pushkarbadiger/priti-carbon)
**Website**: [https://priticarbon.vercel.app](https://priticarbon.vercel.app)
