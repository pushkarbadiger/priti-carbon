// Priti Carbon - Production Ready Indian Carbon Credits Marketplace
// Security & Authentication System

// Global Application State
let currentUser = null;
let listings = [];
let pendingUsers = [];
let carbonChart = null;
let chartTimeframe = '1D';

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

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check for existing user session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            // Verify session validity
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
    
    // Load application data
    loadListings();
    loadPendingUsers();
    
    // Show status banner for logged in users
    if (currentUser) {
        showStatusBanner();
    }
    
    // Show home page by default
    showPage('home');
    
    // Initialize rate limiting cleanup
    setInterval(cleanupRateLimit, 60000);
}

// Security Functions
function isSessionValid() {
    if (!currentUser || !currentUser.loginTime) return false;
    const now = Date.now();
    const sessionAge = now - currentUser.loginTime;
    return sessionAge < SECURITY_CONFIG.sessionTimeout;
}

function hashPassword(password) {
    // Simple hash for demo - in production use proper bcrypt
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
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
    // Remove old requests outside the window
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
            // Reset attempts after lockout period
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

// Indian Market Dummy Data
function createDummyListings() {
    return [
        {
            id: 'verified-1',
            title: 'Organic Farm Carbon Credits - Maharashtra',
            quantity: 50,
            price: 800,
            description: 'Premium carbon credits from certified organic farming operations in Maharashtra. Zero-tillage, crop rotation, and bio-fertilizers enhance soil carbon sequestration.',
            farmerId: 'verified-farmer-1',
            farmerName: 'Maharashtra Organic Collective',
            state: 'Maharashtra',
            district: 'Pune',
            location: 'Maharashtra - Pune',
            createdAt: new Date(2024, 2, 15).toISOString(),
            verified: true,
            approved: true
        },
        {
            id: 'verified-2',
            title: 'Community Forest Carbon Credits - Karnataka',
            quantity: 100,
            price: 600,
            description: 'High-quality carbon credits from community-managed forest regeneration project. 500 acres of degraded land restored over 3 years.',
            farmerId: 'verified-farmer-2',
            farmerName: 'Karnataka Forest Collective',
            state: 'Karnataka',
            district: 'Mysuru',
            location: 'Karnataka - Mysuru',
            createdAt: new Date(2024, 2, 20).toISOString(),
            verified: true,
            approved: true
        },
        {
            id: 'verified-3',
            title: 'Sustainable Agro Project - Uttar Pradesh',
            quantity: 70,
            price: 750,
            description: 'Integrated farming system combining organic farming with solar irrigation and biomass management to maximize carbon capture.',
            farmerId: 'verified-farmer-3',
            farmerName: 'UP Sustainable Farmers Union',
            state: 'Uttar Pradesh',
            district: 'Lucknow',
            location: 'Uttar Pradesh - Lucknow',
            createdAt: new Date(2024, 3, 1).toISOString(),
            verified: true,
            approved: true
        }
    ];
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
        approved: false // Requires admin approval
    };
    
    listings.push(newListing);
    saveListings();
    return newListing;
}

// Enhanced Authentication Functions
function handleLogin(event) {
    event.preventDefault();
    
    const email = sanitizeInput(document.getElementById('login-email').value);
    const password = document.getElementById('login-password').value;
    
    // Rate limiting check
    if (!checkRateLimit(`login_${email}`)) {
        showLoginError('Too many login attempts. Please try again later.');
        return;
    }
    
    // Check login attempts
    const attemptCheck = checkLoginAttempts(email);
    if (attemptCheck.locked) {
        showLoginError(`Account temporarily locked. Try again in ${attemptCheck.remainingTime} minutes.`);
        return;
    }
    
    // Show loading state
    setLoginLoading(true);
    
    // Simulate authentication delay
    setTimeout(() => {
        const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
        const hashedPassword = hashPassword(password);
        let user = storedUsers.find(u => u.email === email && u.password === hashedPassword);
        
        if (user && user.approved) {
            // Successful login
            currentUser = {
                ...user,
                loginTime: Date.now()
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            recordLoginAttempt(email, true);
            updateUIForLoggedInUser();
            
            // Role-based redirection
            if (user.role === 'farmer') {
                showPage('farmer-dashboard');
            } else if (user.role === 'company') {
                showPage('company-dashboard');
            } else if (user.role === 'admin') {
                showPage('admin-dashboard');
            }
            
            // Clear form and show banner
            document.getElementById('login-form').reset();
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
    
    const name = sanitizeInput(document.getElementById('signup-name').value);
    const email = sanitizeInput(document.getElementById('signup-email').value);
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const role = document.getElementById('signup-role').value;
    
    // Rate limiting check
    if (!checkRateLimit(`signup_${email}`)) {
        showSignupError('Too many signup attempts. Please try again later.');
        return;
    }
    
    // Validation
    if (password !== confirmPassword) {
        showSignupError('Passwords do not match.');
        return;
    }
    
    const passwordError = validatePassword(password);
    if (passwordError) {
        showSignupError(passwordError);
        return;
    }
    
    // Check if user already exists
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
    if (storedUsers.find(u => u.email === email)) {
        showSignupError('User with this email already exists.');
        return;
    }
    
    // Show loading state
    setSignupLoading(true);
    
    // Simulate signup delay
    setTimeout(() => {
        // Create new user
        const newUser = {
            id: 'user-' + Date.now(),
            name,
            email,
            password: hashPassword(password),
            role,
            createdAt: new Date().toISOString(),
            approved: false, // Requires admin approval
            emailVerified: false
        };
        
        storedUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(storedUsers));
        
        // Add to pending users for admin approval
        pendingUsers.push(newUser);
        savePendingUsers();
        
        // Clear form
        document.getElementById('signup-form').reset();
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
    const btn = document.getElementById('login-btn');
    const text = document.getElementById('login-text');
    const spinner = document.getElementById('login-loading');
    
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
    const btn = document.getElementById('signup-btn');
    const text = document.getElementById('signup-text');
    const spinner = document.getElementById('signup-loading');
    
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
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function showSignupError(message) {
    const errorDiv = document.getElementById('signup-error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Status Banner Functions
function showStatusBanner() {
    const banner = document.getElementById('status-banner');
    const dismissed = localStorage.getItem('bannerDismissed');
    
    if (!dismissed && currentUser) {
        banner.style.display = 'block';
    }
}

function hideStatusBanner() {
    const banner = document.getElementById('status-banner');
    banner.style.display = 'none';
}

function dismissBanner() {
    localStorage.setItem('bannerDismissed', 'true');
    hideStatusBanner();
}

// UI Update Functions
function updateUIForLoggedInUser() {
    document.getElementById('auth-buttons').style.display = 'none';
    document.getElementById('user-menu').style.display = 'flex';
    document.getElementById('dashboard-link').style.display = 'block';
    document.getElementById('user-greeting').textContent = `Hello, ${currentUser.name}`;
    
    // Show admin link for admin users
    if (currentUser.role === 'admin') {
        document.getElementById('admin-link').style.display = 'block';
    }
}

function updateUIForLoggedOutUser() {
    document.getElementById('auth-buttons').style.display = 'block';
    document.getElementById('user-menu').style.display = 'none';
    document.getElementById('dashboard-link').style.display = 'none';
    document.getElementById('admin-link').style.display = 'none';
}

// Real-Time Carbon Credit Chart
function initializeCarbonChart() {
    const ctx = document.getElementById('carbon-credit-chart');
    if (!ctx) return;
    
    // Generate mock data for the chart
    const chartData = generateChartData(chartTimeframe);
    
    if (carbonChart) {
        carbonChart.destroy();
    }
    
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
                legend: {
                    display: false
                },
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
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
    
    // Auto-refresh chart every 30 seconds
    setInterval(updateChart, 30000);
}

function generateChartData(timeframe) {
    const now = new Date();
    const data = { labels: [], prices: [] };
    let points, interval, basePrice = 750;
    
    switch (timeframe) {
        case '1D':
            points = 24;
            interval = 60 * 60 * 1000; // 1 hour
            break;
        case '7D':
            points = 7;
            interval = 24 * 60 * 60 * 1000; // 1 day
            break;
        case '30D':
            points = 30;
            interval = 24 * 60 * 60 * 1000; // 1 day
            break;
    }
    
    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now - (i * interval));
        
        if (timeframe === '1D') {
            data.labels.push(time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        } else {
            data.labels.push(time.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
        }
        
        // Generate realistic price fluctuation
        const variation = (Math.random() - 0.5) * 100; // ±50 variation
        const price = Math.max(500, basePrice + variation);
        data.prices.push(Math.round(price));
        basePrice = price; // Use previous price as base for next point
    }
    
    return data;
}

function updateChartTimeframe(newTimeframe) {
    chartTimeframe = newTimeframe;
    
    // Update button states
    ['1D', '7D', '30D'].forEach(period => {
        const btn = document.getElementById(`chart-${period.toLowerCase()}`);
        if (period === newTimeframe) {
            btn.className = 'px-3 py-1 text-xs bg-green-600 text-white rounded-full';
        } else {
            btn.className = 'px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-full';
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
        
        // Update current price display
        const currentPrice = newData.prices[newData.prices.length - 1];
        const priceElement = document.getElementById('current-price');
        if (priceElement) {
            priceElement.textContent = `₹${currentPrice.toLocaleString('en-IN')}`;
        }
        
        // Update last updated time
        const timeElement = document.getElementById('last-updated');
        if (timeElement) {
            timeElement.textContent = new Date().toLocaleTimeString('en-IN');
        }
    }
}

// Page Navigation Functions
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.add('hidden'));
    
    // Update navigation active state
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('text-green-600', 'font-semibold'));
    
    // Show requested page
    let targetPage;
    switch(pageId) {
        case 'home':
            targetPage = document.getElementById('home-page');
            break;
        case 'marketplace':
            targetPage = document.getElementById('marketplace-page');
            displayMarketplaceListings();
            break;
        case 'login':
            targetPage = document.getElementById('login-page');
            // Clear any previous errors
            document.getElementById('login-error').classList.add('hidden');
            break;
        case 'signup':
            targetPage = document.getElementById('signup-page');
            // Clear any previous errors
            document.getElementById('signup-error').classList.add('hidden');
            break;
        case 'support':
            targetPage = document.getElementById('support-page');
            break;
        case 'dashboard':
            if (currentUser) {
                if (currentUser.role === 'farmer') {
                    targetPage = document.getElementById('farmer-dashboard');
                    updateFarmerDashboard();
                } else if (currentUser.role === 'company') {
                    targetPage = document.getElementById('company-dashboard');
                } else if (currentUser.role === 'admin') {
                    targetPage = document.getElementById('admin-dashboard');
                    updateAdminDashboard();
                }
            } else {
                showPage('login');
                return;
            }
            break;
        case 'farmer-dashboard':
            if (currentUser && currentUser.role === 'farmer') {
                targetPage = document.getElementById('farmer-dashboard');
                updateFarmerDashboard();
                setTimeout(initializeCarbonChart, 100);
            } else {
                showPage('login');
                return;
            }
            break;
        case 'company-dashboard':
            if (currentUser && currentUser.role === 'company') {
                targetPage = document.getElementById('company-dashboard');
                updateCompanyDashboard();
            } else {
                showPage('login');
                return;
            }
            break;
        case 'admin-dashboard':
            if (currentUser && currentUser.role === 'admin') {
                targetPage = document.getElementById('admin-dashboard');
                updateAdminDashboard();
            } else {
                showPage('login');
                return;
            }
            break;
        default:
            targetPage = document.getElementById('home-page');
    }
    
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
}

// Marketplace Functions
function displayMarketplaceListings() {
    // Clear filters first
    document.getElementById('filter-state').value = '';
    document.getElementById('filter-district').value = '';
    document.getElementById('filter-price').value = '';
    
    const container = document.getElementById('marketplace-listings');
    container.innerHTML = '';
    
    // Only show approved listings
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

function createListingCard(listing, showActions = false) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow';
    
    const verifiedBadge = listing.verified && listing.approved ? 
        '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2"><i class="fas fa-check-circle mr-1"></i>Verified & Approved</span>' : 
        listing.approved ?
        '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2"><i class="fas fa-check mr-1"></i>Approved</span>' :
        '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mb-2"><i class="fas fa-clock mr-1"></i>Pending Approval</span>';
    
    const actionsHtml = showActions ? `
        <div class="mt-4 flex space-x-2">
            <button onclick="editListing('${listing.id}')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-edit mr-1"></i>Edit
            </button>
            <button onclick="deleteListing('${listing.id}')" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-trash mr-1"></i>Delete
            </button>
        </div>
    ` : `
        <div class="mt-4">
            <button onclick="purchaseCredits('${listing.id}')" class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                <i class="fas fa-shopping-cart mr-1"></i>Purchase Credits
            </button>
        </div>
    `;
    
    card.innerHTML = `
        ${verifiedBadge}
        <h3 class="text-lg font-semibold text-gray-900 mb-2">${listing.title}</h3>
        <p class="text-gray-600 text-sm mb-3">${listing.description}</p>
        
        <div class="flex items-center text-sm text-gray-500 mb-3">
            <i class="fas fa-map-marker-alt mr-1"></i>
            <span>${listing.location}</span>
        </div>
        
        <div class="flex items-center text-sm text-gray-500 mb-3">
            <i class="fas fa-user mr-1"></i>
            <span>${listing.farmerName}</span>
        </div>
        
        <div class="flex justify-between items-center mb-3">
            <div>
                <span class="text-2xl font-bold text-green-600">₹${listing.price.toLocaleString('en-IN')}</span>
                <span class="text-gray-500 text-sm">/ton CO₂</span>
            </div>
            <div class="text-right">
                <div class="text-lg font-semibold text-gray-900">${listing.quantity} tons</div>
                <div class="text-sm text-gray-500">available</div>
            </div>
        </div>
        
        ${actionsHtml}
    `;
    
    return card;
}

// Purchase Credits Function - integrated with payment system
function purchaseCredits(listingId) {
    if (!currentUser) {
        showNotification('Please login to purchase carbon credits', 'error');
        showPage('login');
        return;
    }
    
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
        showNotification('This listing is not available for purchase', 'error');
        return;
    }
    
    // Show payment method selection modal
    showPaymentMethodModal(listingId);
}

// Farmer Dashboard Functions
function updateFarmerDashboard() {
    if (!currentUser || currentUser.role !== 'farmer') return;
    
    const farmerListings = listings.filter(listing => listing.farmerId === currentUser.id);
    
    // Update stats
    document.getElementById('total-listings').textContent = farmerListings.length;
    
    const totalCO2 = farmerListings.reduce((sum, listing) => sum + listing.quantity, 0);
    document.getElementById('total-co2').textContent = `${totalCO2} tons`;
    
    // Display farmer's listings
    const container = document.getElementById('farmer-listings');
    container.innerHTML = '';
    
    if (farmerListings.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 bg-white rounded-lg shadow-md">
                <i class="fas fa-seedling text-gray-400 text-4xl mb-4"></i>
                <p class="text-gray-600 mb-4">You haven't created any listings yet.</p>
                <button onclick="showAddListingForm()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium">
                    Create Your First Listing
                </button>
            </div>
        `;
        return;
    }
    
    farmerListings.forEach(listing => {
        const listingCard = createListingCard(listing, true);
        container.appendChild(listingCard);
    });
}

function showAddListingForm() {
    document.getElementById('add-listing-form').classList.remove('hidden');
    document.getElementById('listing-title').focus();
}

function hideAddListingForm() {
    document.getElementById('add-listing-form').classList.add('hidden');
    document.getElementById('listing-form').reset();
}

function handleAddListing(event) {
    event.preventDefault();
    
    if (!currentUser || currentUser.role !== 'farmer') {
        showNotification('Only farmers can add listings', 'error');
        return;
    }
    
    const listingData = {
        title: sanitizeInput(document.getElementById('listing-title').value),
        quantity: parseFloat(document.getElementById('listing-quantity').value),
        price: parseFloat(document.getElementById('listing-price').value),
        state: document.getElementById('listing-state').value,
        district: sanitizeInput(document.getElementById('listing-district').value),
        description: sanitizeInput(document.getElementById('listing-description').value)
    };
    
    // Additional validation
    if (listingData.quantity <= 0 || listingData.price <= 0) {
        showNotification('Quantity and price must be greater than zero', 'error');
        return;
    }
    
    const newListing = addListing(listingData);
    
    // Hide form and refresh dashboard
    hideAddListingForm();
    updateFarmerDashboard();
    
    showNotification('Listing submitted for admin approval!', 'success');
}

function deleteListing(listingId) {
    if (confirm('Are you sure you want to delete this listing?')) {
        listings = listings.filter(listing => listing.id !== listingId);
        saveListings();
        updateFarmerDashboard();
        showNotification('Listing deleted successfully', 'success');
    }
}

// Admin Dashboard Functions
function updateAdminDashboard() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const pendingListings = listings.filter(l => !l.approved);
    const verifiedUsers = JSON.parse(localStorage.getItem('users') || '[]').filter(u => u.approved);
    
    // Update stats
    document.getElementById('admin-pending-users').textContent = pendingUsers.length;
    document.getElementById('admin-pending-listings').textContent = pendingListings.length;
    document.getElementById('admin-verified-users').textContent = verifiedUsers.length;
    document.getElementById('admin-flagged-items').textContent = '0'; // Placeholder
    
    // Update user management section
    updateAdminUsersList();
    updateAdminListingsList();
}

function updateAdminUsersList() {
    const container = document.getElementById('admin-users-list');
    container.innerHTML = '';
    
    if (pendingUsers.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-users text-4xl mb-4"></i>
                <p>No pending user approvals</p>
            </div>
        `;
        return;
    }
    
    pendingUsers.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'border rounded-lg p-4';
        userCard.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <h4 class="font-medium">${user.name}</h4>
                    <p class="text-sm text-gray-600">${user.email}</p>
                    <p class="text-sm text-gray-500">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="approveUser('${user.id}')" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                        Approve
                    </button>
                    <button onclick="rejectUser('${user.id}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                        Reject
                    </button>
                </div>
            </div>
        `;
        container.appendChild(userCard);
    });
}

function updateAdminListingsList() {
    const container = document.getElementById('admin-listings-list');
    container.innerHTML = '';
    
    const pendingListings = listings.filter(l => !l.approved);
    
    if (pendingListings.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-list text-4xl mb-4"></i>
                <p>No pending listing approvals</p>
            </div>
        `;
        return;
    }
    
    pendingListings.forEach(listing => {
        const listingCard = document.createElement('div');
        listingCard.className = 'border rounded-lg p-4';
        listingCard.innerHTML = `
            <div class="mb-2">
                <h4 class="font-medium">${listing.title}</h4>
                <p class="text-sm text-gray-600">${listing.location}</p>
                <p class="text-sm text-gray-500">₹${listing.price.toLocaleString('en-IN')}/ton × ${listing.quantity} tons</p>
            </div>
            <div class="flex space-x-2 mt-3">
                <button onclick="approveListing('${listing.id}')" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm">
                    Approve
                </button>
                <button onclick="rejectListing('${listing.id}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                    Reject
                </button>
            </div>
        `;
        container.appendChild(listingCard);
    });
}

function approveUser(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        users[userIndex].approved = true;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Remove from pending users
        pendingUsers = pendingUsers.filter(u => u.id !== userId);
        savePendingUsers();
        
        updateAdminDashboard();
        showNotification('User approved successfully!', 'success');
    }
}

function rejectUser(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const filteredUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('users', JSON.stringify(filteredUsers));
    
    // Remove from pending users
    pendingUsers = pendingUsers.filter(u => u.id !== userId);
    savePendingUsers();
    
    updateAdminDashboard();
    showNotification('User rejected and removed', 'success');
}

function approveListing(listingId) {
    const listing = listings.find(l => l.id === listingId);
    if (listing) {
        listing.approved = true;
        listing.verified = true; // Auto-verify when approved by admin
        saveListings();
        updateAdminDashboard();
        showNotification('Listing approved successfully!', 'success');
    }
}

function rejectListing(listingId) {
    listings = listings.filter(l => l.id !== listingId);
    saveListings();
    updateAdminDashboard();
    showNotification('Listing rejected and removed', 'success');
}

// Marketplace Filtering Functions
function filterMarketplaceListings() {
    const stateFilter = document.getElementById('filter-state').value.toLowerCase();
    const districtFilter = document.getElementById('filter-district').value.toLowerCase();
    const priceFilter = parseFloat(document.getElementById('filter-price').value) || Infinity;
    
    const approvedListings = listings.filter(listing => listing.approved);
    
    const filteredListings = approvedListings.filter(listing => {
        const matchesState = !stateFilter || listing.state?.toLowerCase().includes(stateFilter);
        const matchesDistrict = !districtFilter || listing.district?.toLowerCase().includes(districtFilter);
        const matchesPrice = listing.price <= priceFilter;
        
        return matchesState && matchesDistrict && matchesPrice;
    });
    
    displayFilteredListings(filteredListings);
}

function displayFilteredListings(filteredListings) {
    const container = document.getElementById('marketplace-listings');
    container.innerHTML = '';
    
    if (filteredListings.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-search text-gray-400 text-4xl mb-4"></i>
                <p class="text-gray-600">No carbon credits match your filters.</p>
                <button onclick="clearFilters()" class="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
                    Clear Filters
                </button>
            </div>
        `;
        return;
    }
    
    filteredListings.forEach(listing => {
        const listingCard = createListingCard(listing);
        container.appendChild(listingCard);
    });
}

function clearFilters() {
    document.getElementById('filter-state').value = '';
    document.getElementById('filter-district').value = '';
    document.getElementById('filter-price').value = '';
    displayMarketplaceListings();
}

// Utility Functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm transition-all duration-300 transform translate-x-full`;
    
    // Set color based on type
    switch(type) {
        case 'success':
            notification.className += ' bg-green-600 text-white';
            break;
        case 'error':
            notification.className += ' bg-red-600 text-white';
            break;
        case 'warning':
            notification.className += ' bg-yellow-600 text-white';
            break;
        default:
            notification.className += ' bg-blue-600 text-white';
    }
    
    notification.innerHTML = `
        <div class="flex items-center">
            <span class="flex-1">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

function showForgotPassword() {
    showNotification('Password reset functionality coming soon! Contact support for assistance.', 'info');
}

function editListing(listingId) {
    showNotification('Edit functionality coming soon!', 'info');
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

// Initialize default admin on page load
document.addEventListener('DOMContentLoaded', function() {
    createDefaultAdmin();
});

// Update company dashboard with purchase history
function updateCompanyDashboard() {
    if (!currentUser || currentUser.role !== 'company') return;
    
    const userPayments = getUserPayments(currentUser.id);
    const totalPurchases = userPayments.length;
    const totalSpent = userPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalCO2Offset = userPayments.reduce((sum, payment) => sum + payment.quantity, 0);
    
    // Update stats in company dashboard
    const totalPurchasesElement = document.getElementById('company-total-purchases');
    const totalSpentElement = document.getElementById('company-total-spend');
    const totalCO2Element = document.getElementById('company-total-co2');
    
    if (totalPurchasesElement) totalPurchasesElement.textContent = totalPurchases;
    if (totalSpentElement) totalSpentElement.textContent = `₹${totalSpent.toLocaleString('en-IN')}`;
    if (totalCO2Element) totalCO2Element.textContent = `${totalCO2Offset} tons`;
    
    // Update purchases list
    const purchasesContainer = document.getElementById('company-purchases');
    if (purchasesContainer && userPayments.length > 0) {
        purchasesContainer.innerHTML = '';
        
        userPayments.slice(-5).reverse().forEach(payment => {
            const paymentCard = document.createElement('div');
            paymentCard.className = 'bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500';
            paymentCard.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-medium text-gray-900">${payment.listingTitle}</h4>
                        <p class="text-sm text-gray-600">Receipt #${payment.receiptNumber}</p>
                        <p class="text-sm text-gray-500">${new Date(payment.timestamp).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-semibold text-green-600">₹${payment.amount.toLocaleString('en-IN')}</p>
                        <p class="text-sm text-gray-500">${payment.quantity} tons CO₂</p>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ${payment.paymentMethod}
                        </span>
                    </div>
                </div>
            `;
            purchasesContainer.appendChild(paymentCard);
        });
    }
}

// Show payment method selection modal
function showPaymentMethodModal(listingId) {
    const listing = listings.find(l => l.id === listingId);
    const totalAmount = listing.price * listing.quantity;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md mx-4">
            <div class="text-center mb-6">
                <h3 class="text-lg font-medium text-gray-900 mb-2">Choose Payment Method</h3>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-sm text-gray-600">${listing.title}</p>
                    <p class="text-lg font-semibold text-gray-900">${listing.quantity} tons CO₂</p>
                    <p class="text-2xl font-bold text-green-600">₹${totalAmount.toLocaleString('en-IN')}</p>
                </div>
            </div>
            
            <div class="space-y-3 mb-6">
                <button onclick="payWithRazorpay('${listingId}'); this.closest('.fixed').remove()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-lg flex items-center justify-center">
                    <i class="fas fa-credit-card mr-3"></i>
                    <div class="text-left">
                        <div class="font-medium">Razorpay</div>
                        <div class="text-sm opacity-90">Cards, UPI, Net Banking</div>
                    </div>
                </button>
                
                <button onclick="payWithGooglePay('${listingId}'); this.closest('.fixed').remove()" class="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg flex items-center justify-center">
                    <i class="fab fa-google-pay mr-3"></i>
                    <div class="text-left">
                        <div class="font-medium">Google Pay</div>
                        <div class="text-sm opacity-90">Quick & Secure</div>
                    </div>
                </button>
                
                <button onclick="payWithBharatPe('${listingId}'); this.closest('.fixed').remove()" class="w-full bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg flex items-center justify-center">
                    <i class="fas fa-mobile-alt mr-3"></i>
                    <div class="text-left">
                        <div class="font-medium">BharatPe</div>
                        <div class="text-sm opacity-90">UPI & Digital Payments</div>
                    </div>
                </button>
            </div>
            
            <button onclick="this.closest('.fixed').remove()" class="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md">
                Cancel
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}
