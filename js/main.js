// Priti Carbon - Premium White Theme
// Clean, minimal JavaScript for informational website

class PritiCarbon {
    constructor() {
        this.currentSection = 'home';
        this.isScrolling = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupScrollAnimations();
        this.setupNavigation();
        this.setupContactForm();
        this.initializeAnimations();
    }

    setupEventListeners() {
        // Scroll handler for navbar
        window.addEventListener('scroll', () => this.handleScroll());
        
        // Resize handler
        window.addEventListener('resize', () => this.handleResize());
        
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.getElementById('navLinks');
        
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            });
        }

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            });
        });
    }

    setupScrollAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Observe all fade-in elements
        document.querySelectorAll('.fade-in').forEach(el => {
            observer.observe(el);
        });
    }

    setupNavigation() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('.nav-link, .btn-primary').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href');
                if (target.startsWith('#')) {
                    this.navigateToSection(target.substring(1));
                }
            });
        });

        // Update active navigation based on current section
        this.updateActiveNavigation();
    }

    navigateToSection(sectionId) {
        if (this.isScrolling) return;
        
        this.isScrolling = true;
        this.currentSection = sectionId;

        // Hide all sections
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Smooth scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            // Update navigation
            this.updateActiveNavigation();

            // Re-trigger animations for the new section
            setTimeout(() => {
                this.triggerSectionAnimations(targetSection);
                this.isScrolling = false;
            }, 600);
        } else {
            this.isScrolling = false;
        }
    }

    updateActiveNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${this.currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    triggerSectionAnimations(section) {
        const animatedElements = section.querySelectorAll('.fade-in');
        animatedElements.forEach((el, index) => {
            el.classList.remove('visible');
            setTimeout(() => {
                el.classList.add('visible');
            }, index * 150);
        });
    }

    handleScroll() {
        const navbar = document.getElementById('navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    handleResize() {
        // Close mobile menu on resize to desktop
        const navLinks = document.getElementById('navLinks');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        
        if (window.innerWidth > 768) {
            navLinks.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.add('fa-bars');
            icon.classList.remove('fa-times');
        }
    }

    setupContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
        }
    }

    handleContactSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message')
        };

        // Validate required fields
        if (!data.name || !data.email || !data.message) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Validate email format
        if (!this.isValidEmail(data.email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        // Process form submission
        setTimeout(() => {
            this.processContactForm(data, submitBtn, originalText, e.target);
        }, 1000);
    }

    processContactForm(data, submitBtn, originalText, form) {
        try {
            // Create mailto link with form data
            const subject = encodeURIComponent(`Contact Form: ${data.name}`);
            const body = encodeURIComponent(
                `Name: ${data.name}\n` +
                `Email: ${data.email}\n\n` +
                `Message:\n${data.message}\n\n` +
                `---\nSent via Priti Carbon Contact Form`
            );
            
            // Send to primary support email
            const mailtoLink = `mailto:support@priticarbon.me?subject=${subject}&body=${body}`;
            
            // Open email client
            window.location.href = mailtoLink;
            
            // Show success message
            this.showNotification(
                'Thank you for your message! Your email client will open with a pre-filled message. We\'ll respond within 24 hours.',
                'success'
            );
            
            // Reset form
            form.reset();
            
        } catch (error) {
            console.error('Contact form error:', error);
            this.showNotification(
                'There was an issue processing your request. Please email us directly at support@priticarbon.me',
                'error'
            );
        } finally {
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showNotification(message, type = 'success') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                <span>${message}</span>
                <button class="notification-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add notification styles
        const bgColor = type === 'success' ? '#6b8e7a' : '#dc2626';
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
            border: none;
        `;

        // Add animation styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    font-size: 14px;
                    font-weight: 500;
                }
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                .notification-close:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }

        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        });

        // Auto-remove after 6 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 6000);

        document.body.appendChild(notification);
    }

    initializeAnimations() {
        // Stagger animations on page load
        setTimeout(() => {
            const elements = document.querySelectorAll('.fade-in');
            elements.forEach((el, index) => {
                setTimeout(() => {
                    el.classList.add('visible');
                }, index * 100);
            });
        }, 300);

        // Setup card hover effects
        document.querySelectorAll('.feature-card, .solution-card, .insight-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }
}

// Global navigation function for card clicks
function navigateToSection(sectionId) {
    if (window.pritiCarbon) {
        window.pritiCarbon.navigateToSection(sectionId);
    }
}

// Enhanced smooth scrolling for older browsers
function setupSmoothScrolling() {
    if (!('scrollBehavior' in document.documentElement.style)) {
        // Polyfill for smooth scrolling
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌱 Priti Carbon - Premium Climate Solutions Platform Loaded');
    
    // Initialize main application
    window.pritiCarbon = new PritiCarbon();
    
    // Setup smooth scrolling
    setupSmoothScrolling();
    
    // Add loaded class for CSS transitions
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PritiCarbon;
}