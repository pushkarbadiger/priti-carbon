// Priti Carbon - Production Ready Indian Carbon Credits Marketplace (Demo Edition)
// DEMO MODE: LocalStorage only, weak hashing, no backend! Do NOT use for real data or production.
// See banners in UI for details.

// Global Application State
let currentUser = null;
let listings = [];
let pendingUsers = [];
let carbonChart = null;
let chartTimeframe = '1D';
let chartIntervalId = null;
let rateLimitCleanupIntervalId = null;

// Security Configuration
const SECURITY_CONFIG = {
    maxLoginAttempts: 5,
    lockoutDuration: 900000, // 15 minutes
    passwordMinLength: 8,
    sessionTimeout: 3600000, // 1 hour
    rateLimitWindow: 60000, // 1 minute
    maxRequestsPerWindow: 10
};

// Rate Limiting Storage
let rateLimitStore = new Map();

// DEMO BANNER
function showDemoBanner() {
    if (document.getElementById('demo-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'demo-banner';
    banner.className = 'bg-yellow-200 text-yellow-900 text-center py-2 px-4 fixed top-0 left-0 w-full z-50';
    banner.innerHTML = `
        <strong>DEMO MODE:</strong> All data is stored in your browser and will be lost if you clear your storage. 
        Security features and email/payment are NOT real. Do NOT use real passwords or data!
        <button onclick="this.parentElement.remove()" class="ml-4 bg-yellow-400 px-2 py-1 rounded">Dismiss</button>
    `;
    document.body.prepend(banner);
}

// Utility: Safe DOM get
function $(id) {
    return document.getElementById(id);
}

// On DOM ready
document.addEventListener('DOMContentLoaded', function() {
    showDemoBanner();
    initializeApp();
    createDefaultAdmin();
});

// Clean up intervals on page unload
window.addEventListener('beforeunload', () => {
    if (chartIntervalId) clearInterval(chartIntervalId);
    if (rateLimitCleanupIntervalId) clearInterval(rateLimitCleanupIntervalId);
});

function initializeApp() {
    // Check for Chart.js and FontAwesome
    if (typeof Chart === "undefined") {
        showNotification('Chart.js not detected. Please include it for charts to work.', 'warning');
    }
    if (!document.querySelector('link[href*="font-awesome"],link[href*="fontawesome"],link[href*="font-awesome"]')) {
        showNotification('FontAwesome not detected. Please include it for icons.', 'warning');
    }
    // Check for existing user session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            if (isSessionValid()) {
                updateUIForLoggedInUser();
            } else {
                logout();
                return;
            }
        } catch (e) {
            localStorage.removeItem('currentUser');
        }
    }
    loadListings();
    loadPendingUsers();
    if (currentUser) showStatusBanner();
    showPage('home');
    if (rateLimitCleanupIntervalId) clearInterval(rateLimitCleanupIntervalId);
    rateLimitCleanupIntervalId = setInterval(cleanupRateLimit, 60000);
}

// Security Functions
function isSessionValid() {
    if (!currentUser || !currentUser.loginTime) return false;
    const now = Date.now();
    const sessionAge = now - currentUser.loginTime;
    return sessionAge < SECURITY_CONFIG.sessionTimeout;
}
function hashPassword(password) {
    // Demo only! Not secure. Use bcrypt on a server in production!
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}
function validatePassword(password) {
    if (password.length < SECURITY_CONFIG.passwordMinLength) {
        return 'Password must be at least 8 characters long';
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return 'Password must contain both letters and numbers';
    }
    return null;
}
function sanitizeInput(input) {
    return input.replace(/[<>\"']/g, '');
}
function checkRateLimit(identifier) {
    const now = Date.now();
    const windowStart = now - SECURITY_CONFIG.rateLimitWindow;
    if (!rateLimitStore.has(identifier)) {
        rateLimitStore.set(identifier, []);
    }
    const requests = rateLimitStore.get(identifier);
    const recentRequests = requests.filter(time => time > windowStart);
    if (recentRequests.length >= SECURITY_CONFIG.maxRequestsPerWindow) {
        return false;
    }
    recentRequests.push(now);
    rateLimitStore.set(identifier, recentRequests);
    return true;
}
function cleanupRateLimit() {
    const now = Date.now();
    const windowStart = now - SECURITY_CONFIG.rateLimitWindow;
    for (const [key, requests] of rateLimitStore.entries()) {
        const recentRequests = requests.filter(time => time > windowStart);
        if (recentRequests.length === 0) {
            rateLimitStore.delete(key);
        } else {
            rateLimitStore.set(key, recentRequests);
        }
    }
}
function checkLoginAttempts(email) {
    const attempts = JSON.parse(localStorage.getItem(`loginAttempts_${email}`)) || { count: 0, lastAttempt: 0 };
    const now = Date.now();
    if (attempts.count >= SECURITY_CONFIG.maxLoginAttempts) {
        const timeSinceLastAttempt = now - attempts.lastAttempt;
        if (timeSinceLastAttempt < SECURITY_CONFIG.lockoutDuration) {
            const remainingTime = Math.ceil((SECURITY_CONFIG.lockoutDuration - timeSinceLastAttempt) / 60000);
            return { locked: true, remainingTime };
        } else {
            attempts.count = 0;
        }
    }
    return { locked: false };
}
function recordLoginAttempt(email, success) {
    const attempts = JSON.parse(localStorage.getItem(`loginAttempts_${email}`)) || { count: 0, lastAttempt: 0 };
    if (success) {
        localStorage.removeItem(`loginAttempts_${email}`);
    } else {
        attempts.count++;
        attempts.lastAttempt = Date.now();
        localStorage.setItem(`loginAttempts_${email}`, JSON.stringify(attempts));
    }
}

// Data Management Functions
function loadListings() {
    const savedListings = localStorage.getItem('carbonListings');
    if (savedListings) {
        listings = JSON.parse(savedListings);
    } else {
        listings = createDummyListings();
        saveListings();
    }
}
function saveListings() {
    localStorage.setItem('carbonListings', JSON.stringify(listings));
}
function loadPendingUsers() {
    const saved = localStorage.getItem('pendingUsers');
    pendingUsers = saved ? JSON.parse(saved) : [];
}
function savePendingUsers() {
    localStorage.setItem('pendingUsers', JSON.stringify(pendingUsers));
}
function addListing(listingData) {
    const newListing = {
        id: 'listing-' + Date.now(),
        ...listingData,
        location: listingData.state + ' - ' + listingData.district,
        farmerId: currentUser.id,
        farmerName: currentUser.name,
        createdAt: new Date().toISOString(),
        verified: false,
        approved: false
    };
    listings.push(newListing);
    saveListings();
    return newListing;
}

// Authentication Functions
function handleLogin(event) {
    event.preventDefault();
    const email = sanitizeInput($('login-email')?.value ?? '');
    const password = $('login-password')?.value ?? '';
    if (!checkRateLimit(`login_${email}`)) {
        showLoginError('Too many login attempts. Please try again later.');
        return;
    }
    const attemptCheck = checkLoginAttempts(email);
    if (attemptCheck.locked) {
        showLoginError(`Account temporarily locked. Try again in ${attemptCheck.remainingTime} minutes.`);
        return;
    }
    setLoginLoading(true);
    setTimeout(() => {
        const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
        const hashedPassword = hashPassword(password);
        let user = storedUsers.find(u => u.email === email && u.password === hashedPassword);
        if (user && user.approved) {
            currentUser = { ...user, loginTime: Date.now() };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            recordLoginAttempt(email, true);
            updateUIForLoggedInUser();
            if (user.role === 'farmer') showPage('farmer-dashboard');
            else if (user.role === 'company') showPage('company-dashboard');
            else if (user.role === 'admin') showPage('admin-dashboard');
            $('login-form')?.reset();
            showStatusBanner();
            showNotification('Welcome back!', 'success');
        } else if (user && !user.approved) {
            recordLoginAttempt(email, false);
            showLoginError('Your account is pending admin approval. Please check back later.');
        } else {
            recordLoginAttempt(email, false);
            showLoginError('Invalid email or password.');
        }
        setLoginLoading(false);
    }, 1000);
}
function handleSignup(event) {
    event.preventDefault();
    const name = sanitizeInput($('signup-name')?.value ?? '');
    const email = sanitizeInput($('signup-email')?.value ?? '');
    const password = $('signup-password')?.value ?? '';
    const confirmPassword = $('signup-confirm-password')?.value ?? '';
    const role = $('signup-role')?.value ?? 'farmer';
    if (!checkRateLimit(`signup_${email}`)) {
        showSignupError('Too many signup attempts. Please try again later.');
        return;
    }
    if (password !== confirmPassword) {
        showSignupError('Passwords do not match.');
        return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
        showSignupError(passwordError);
        return;
    }
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
    if (storedUsers.find(u => u.email === email)) {
        showSignupError('User with this email already exists.');
        return;
    }
    setSignupLoading(true);
    setTimeout(() => {
        const newUser = {
            id: 'user-' + Date.now(),
            name,
            email,
            password: hashPassword(password),
            role,
            createdAt: new Date().toISOString(),
            approved: false,
            emailVerified: false
        };
        storedUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(storedUsers));
        pendingUsers.push(newUser);
        savePendingUsers();
        $('signup-form')?.reset();
        setSignupLoading(false);
        showNotification('Account created! Pending admin approval. You will be notified via email once approved.', 'info');
        showPage('login');
    }, 1500);
}
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUIForLoggedOutUser();
    hideStatusBanner();
    showPage('home');
    showNotification('Logged out successfully', 'success');
}
function setLoginLoading(loading) {
    const btn = $('login-btn');
    const text = $('login-text');
    const spinner = $('login-loading');
    if (!btn || !text || !spinner) return;
    if (loading) {
        btn.disabled = true;
        text.textContent = 'Logging in...';
        spinner.classList.remove('hidden');
    } else {
        btn.disabled = false;
        text.textContent = 'Login';
        spinner.classList.add('hidden');
    }
}
function setSignupLoading(loading) {
    const btn = $('signup-btn');
    const text = $('signup-text');
    const spinner = $('signup-loading');
    if (!btn || !text || !spinner) return;
    if (loading) {
        btn.disabled = true;
        text.textContent = 'Creating Account...';
        spinner.classList.remove('hidden');
    } else {
        btn.disabled = false;
        text.textContent = 'Create Account';
        spinner.classList.add('hidden');
    }
}
function showLoginError(message) {
    const errorDiv = $('login-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}
function showSignupError(message) {
    const errorDiv = $('signup-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

// UI Functions (with safe DOM access)
function showStatusBanner() {
    const banner = $('status-banner');
    const dismissed = localStorage.getItem('bannerDismissed');
    if (!banner) return;
    if (!dismissed && currentUser) {
        banner.style.display = 'block';
    }
}
function hideStatusBanner() {
    const banner = $('status-banner');
    if (banner) banner.style.display = 'none';
}
function dismissBanner() {
    localStorage.setItem('bannerDismissed', 'true');
    hideStatusBanner();
}
function updateUIForLoggedInUser() {
    if ($('auth-buttons')) $('auth-buttons').style.display = 'none';
    if ($('user-menu')) $('user-menu').style.display = 'flex';
    if ($('dashboard-link')) $('dashboard-link').style.display = 'block';
    if ($('user-greeting')) $('user-greeting').textContent = `Hello, ${currentUser.name}`;
    if (currentUser.role === 'admin' && $('admin-link')) {
        $('admin-link').style.display = 'block';
    }
}
function updateUIForLoggedOutUser() {
    if ($('auth-buttons')) $('auth-buttons').style.display = 'block';
    if ($('user-menu')) $('user-menu').style.display = 'none';
    if ($('dashboard-link')) $('dashboard-link').style.display = 'none';
    if ($('admin-link')) $('admin-link').style.display = 'none';
}

// Real-Time Carbon Credit Chart
function initializeCarbonChart() {
    const ctx = $('carbon-credit-chart');
    if (!ctx || typeof Chart === 'undefined') return;
    const chartData = generateChartData(chartTimeframe);
    if (carbonChart) carbonChart.destroy();
    carbonChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Price (₹/ton)',
                data: chartData.prices,
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `₹${context.parsed.y.toLocaleString('en-IN')}/ton`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) { return '₹' + value.toLocaleString('en-IN'); }
                    }
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
    if (chartIntervalId) clearInterval(chartIntervalId);
    chartIntervalId = setInterval(updateChart, 30000);
}
function generateChartData(timeframe) {
    const now = new Date();
    const data = { labels: [], prices: [] };
    let points, interval, basePrice = 750;
    switch (timeframe) {
        case '1D': points = 24; interval = 60 * 60 * 1000; break;
        case '7D': points = 7; interval = 24 * 60 * 60 * 1000; break;
        case '30D': points = 30; interval = 24 * 60 * 60 * 1000; break;
    }
    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now - (i * interval));
        if (timeframe === '1D') {
            data.labels.push(time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        } else {
            data.labels.push(time.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
        }
        const variation = (Math.random() - 0.5) * 100;
        const price = Math.max(500, basePrice + variation);
        data.prices.push(Math.round(price));
        basePrice = price;
    }
    return data;
}
function updateChartTimeframe(newTimeframe) {
    chartTimeframe = newTimeframe;
    ['1D', '7D', '30D'].forEach(period => {
        const btn = $(`chart-${period.toLowerCase()}`);
        if (btn) {
            if (period === newTimeframe) {
                btn.className = 'px-3 py-1 text-xs bg-green-600 text-white rounded-full';
            } else {
                btn.className = 'px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full';
            }
        }
    });
    initializeCarbonChart();
}
function updateChart() {
    if (carbonChart) {
        const newData = generateChartData(chartTimeframe);
        carbonChart.data.labels = newData.labels;
        carbonChart.data.datasets[0].data = newData.prices;
        carbonChart.update('none');
        const currentPrice = newData.prices[newData.prices.length - 1];
        const priceElement = $('current-price');
        if (priceElement) priceElement.textContent = `₹${currentPrice.toLocaleString('en-IN')}`;
        const timeElement = $('last-updated');
        if (timeElement) timeElement.textContent = new Date().toLocaleTimeString('en-IN');
    }
}

// Page Navigation
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.add('hidden'));
    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('text-green-600', 'font-semibold'));
    // Show requested page
    let targetPage;
    switch(pageId) {
        case 'home': targetPage = $('home-page'); break;
        case 'marketplace': targetPage = $('marketplace-page'); displayMarketplaceListings(); break;
        case 'login': targetPage = $('login-page'); $('login-error')?.classList.add('hidden'); break;
        case 'signup': targetPage = $('signup-page'); $('signup-error')?.classList.add('hidden'); break;
        case 'support': targetPage = $('support-page'); break;
        case 'dashboard':
            if (currentUser) {
                if (currentUser.role === 'farmer') {
                    targetPage = $('farmer-dashboard');
                    updateFarmerDashboard();
                } else if (currentUser.role === 'company') {
                    targetPage = $('company-dashboard');
                } else if (currentUser.role === 'admin') {
                    targetPage = $('admin-dashboard');
                    updateAdminDashboard();
                }
            } else {
                showPage('login');
                return;
            }
            break;
        case 'farmer-dashboard':
            if (currentUser && currentUser.role === 'farmer') {
                targetPage = $('farmer-dashboard');
                updateFarmerDashboard();
                setTimeout(initializeCarbonChart, 100);
            } else {
                showPage('login');
                return;
            }
            break;
        case 'company-dashboard':
            if (currentUser && currentUser.role === 'company') {
                targetPage = $('company-dashboard');
            } else {
                showPage('login');
                return;
            }
            break;
        case 'admin-dashboard':
            if (currentUser && currentUser.role === 'admin') {
                targetPage = $('admin-dashboard');
                updateAdminDashboard();
            } else {
                showPage('login');
                return;
            }
            break;
        default: targetPage = $('home-page');
    }
    if (targetPage) targetPage.classList.remove('hidden');
}

// Marketplace Functions
function displayMarketplaceListings() {
    if ($('filter-state')) $('filter-state').value = '';
    if ($('filter-district')) $('filter-district').value = '';
    if ($('filter-price')) $('filter-price').value = '';
    const container = $('marketplace-listings');
    if (!container) return;
    container.innerHTML = '';
    const approvedListings = listings.filter(listing => listing.approved);
    if (approvedListings.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-seedling text-gray-400 text-4xl mb-4"></i>
                <p class="text-gray-600">No verified carbon credits available yet from Indian farmers.</p>
            </div>
        `;
        return;
    }
    approvedListings.forEach(listing => {
        const listingCard = createListingCard(listing);
        container.appendChild(listingCard);
    });
}

// DEMO: Show notification for unimplemented features
function showDemoFeatureBanner(feature) {
    showNotification(`${feature} is not implemented in demo mode.`, 'warning');
}
function showForgotPassword() {
    showDemoFeatureBanner('Password reset');
}
function editListing(listingId) {
    showDemoFeatureBanner('Edit listing');
}

// Create default admin user if none exists
function createDefaultAdmin() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const adminExists = users.some(u => u.role === 'admin');
    if (!adminExists) {
        const adminUser = {
            id: 'admin-default',
            name: 'Priti Carbon Admin',
            email: 'admin@priticarbon.com',
            password: hashPassword('admin123'),
            role: 'admin',
            approved: true,
            emailVerified: true,
            createdAt: new Date().toISOString()
        };
        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Additional code for marketplace/admin/user/utility logic as per your prior implementation...
