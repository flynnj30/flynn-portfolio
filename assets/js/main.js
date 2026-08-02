/**
 * ============================================================
 * FLYNN JAMES PONTINO | PORTFOLIO MAIN SCRIPT
 * Version: 1.0.0
 * Last Updated: 2026-08-02
 * ============================================================
 */

(function() {
    'use strict';

    // ============================================================
    // CONFIGURATION
    // ============================================================
    const CONFIG = {
        emailjs: {
            publicKey: 'crekfvN6H352DXAfx',
            serviceID: 'service_av4pfmh',
            templateID: 'template_vcqi0qv'
        },
        recaptcha: {
            siteKey: '6LfAaXEtAAAAALnWqDEYvVKOX-4CqLrMIBIeAEXd'
        },
        roles: ['SALES LEADER', 'PIPELINE ARCHITECT', 'TEAM BUILDER', 'GROWTH STRATEGIST'],
        particleCount: 70,
        notificationInterval: 20000
    };

    // ============================================================
    // DOM REFERENCES
    // ============================================================
    const DOM = {
        scrollContainer: document.getElementById('scrollContainer'),
        sections: document.querySelectorAll('.section-wrapper'),
        navLinks: document.querySelectorAll('.nav-link'),
        progressDots: document.querySelectorAll('.section-progress .dot'),
        backToTop: document.getElementById('backToTop'),
        themeToggle: document.getElementById('themeToggle'),
        themeIcon: document.getElementById('themeIcon'),
        logoBtn: document.getElementById('logoBtn'),
        hamburgerBtn: document.getElementById('hamburgerBtn'),
        cancelBtn: document.getElementById('cancelBtn'),
        mobileDropdown: document.getElementById('mobileDropdown'),
        chatWindow: document.getElementById('chatWindow'),
        chatMessages: document.getElementById('chatMessages'),
        chatInput: document.getElementById('chatInput'),
        sendChatBtn: document.getElementById('sendChatMsg'),
        closeChat: document.getElementById('closeChat'),
        hubToggle: document.getElementById('hubToggle'),
        actionHub: document.getElementById('actionHub'),
        contactForm: document.getElementById('contactForm'),
        formStatus: document.getElementById('formStatus'),
        submitBtn: document.getElementById('formSubmitBtn'),
        notificationToast: document.getElementById('notificationToast'),
        toastTitle: document.getElementById('toastTitle'),
        toastMessage: document.getElementById('toastMessage'),
        toastClose: document.getElementById('toastClose'),
        shortcutsHint: document.getElementById('shortcutsHint'),
        typedSpan: document.querySelector('.typewriter-text'),
        stats: document.querySelectorAll('.stat-item .number'),
        heroSection: document.getElementById('section-home'),
        particleCanvas: document.getElementById('particleCanvas'),
        recaptchaWidget: document.getElementById('recaptchaWidget')
    };

    // ============================================================
    // UTILITY FUNCTIONS
    // ============================================================
    const Utils = {
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        showToast: function(title, message) {
            const toast = DOM.notificationToast;
            DOM.toastTitle.textContent = title;
            DOM.toastMessage.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 5000);
        },

        setStatus: function(type, message) {
            DOM.formStatus.className = 'form-status ' + type;
            DOM.formStatus.style.display = 'block';
            DOM.formStatus.innerHTML = message;
            clearTimeout(window.statusTimeout);
            window.statusTimeout = setTimeout(() => {
                DOM.formStatus.className = 'form-status';
                DOM.formStatus.style.display = 'none';
            }, 6000);
        },

        onRecaptchaSuccess: function(token) {
            DOM.submitBtn.disabled = false;
            DOM.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
            DOM.submitBtn.style.opacity = '1';
        },

        onRecaptchaExpired: function() {
            DOM.submitBtn.disabled = true;
            DOM.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Complete reCAPTCHA First';
            DOM.submitBtn.style.opacity = '0.6';
        },

        resetRecaptcha: function() {
            if (typeof grecaptcha !== 'undefined') {
                try {
                    grecaptcha.reset();
                } catch(e) {
                    // Silently handle reset errors
                }
            }
        }
    };

    // Expose reCAPTCHA callbacks globally
    window.onRecaptchaSuccess = Utils.onRecaptchaSuccess;
    window.onRecaptchaExpired = Utils.onRecaptchaExpired;

    // ============================================================
    // PARTICLES SYSTEM
    // ============================================================
    class ParticleSystem {
        constructor(canvas, count) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.particles = [];
            this.count = count || CONFIG.particleCount;
            this.mouseX = -1000;
            this.mouseY = -1000;
            this.init();
        }

        init() {
            this.resize();
            window.addEventListener('resize', () => this.resize());
            document.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            });
            document.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) {
                    this.mouseX = e.touches[0].clientX;
                    this.mouseY = e.touches[0].clientY;
                }
            });
            for (let i = 0; i < this.count; i++) {
                this.particles.push(this.createParticle());
            }
            this.animate();
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        createParticle() {
            return {
                x: Math.random() * this.canvas.width,
                y: this.canvas.height + Math.random() * 100,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 1.2,
                speedY: -(Math.random() * 1.5 + 0.6),
                life: 1,
                decay: Math.random() * 0.003 + 0.001,
                hue: Math.random() * 40 + 100
            };
        }

        updateParticle(p) {
            const dx = this.mouseX - p.x;
            const dy = this.mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                const angle = Math.atan2(dy, dx);
                p.speedX -= Math.cos(angle) * 0.2;
                p.speedY -= Math.sin(angle) * 0.2;
            }
            p.x += p.speedX;
            p.y += p.speedY;
            p.life -= p.decay;
            if (p.y < -20 || p.life <= 0 || p.x < -20 || p.x > this.canvas.width + 20) {
                Object.assign(p, this.createParticle());
                p.y = this.canvas.height + Math.random() * 50;
            }
        }

        drawParticle(p) {
            const alpha = p.life * 0.6;
            const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
            gradient.addColorStop(0, `hsla(${p.hue}, 100%, 50%, ${alpha})`);
            gradient.addColorStop(0.6, `hsla(${p.hue}, 100%, 20%, ${alpha * 0.4})`);
            gradient.addColorStop(1, 'transparent');
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
            this.ctx.fill();
        }

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.particles.forEach(p => {
                this.updateParticle(p);
                this.drawParticle(p);
            });
            requestAnimationFrame(() => this.animate());
        }
    }

    // ============================================================
    // TYPEWRITER EFFECT
    // ============================================================
    class Typewriter {
        constructor(element, roles) {
            this.element = element;
            this.roles = roles;
            this.roleIndex = 0;
            this.charIndex = 0;
            this.isDeleting = false;
            setTimeout(() => this.type(), 400);
        }

        type() {
            if (!this.element) return;
            const currentRole = this.roles[this.roleIndex];
            if (!this.isDeleting && this.charIndex <= currentRole.length) {
                this.element.textContent = currentRole.substring(0, this.charIndex);
                this.charIndex++;
                setTimeout(() => this.type(), 80);
            } else if (this.isDeleting && this.charIndex >= 0) {
                this.element.textContent = currentRole.substring(0, this.charIndex);
                this.charIndex--;
                setTimeout(() => this.type(), 35);
            } else if (!this.isDeleting && this.charIndex > currentRole.length) {
                this.isDeleting = true;
                setTimeout(() => this.type(), 1600);
            } else if (this.isDeleting && this.charIndex < 0) {
                this.isDeleting = false;
                this.roleIndex = (this.roleIndex + 1) % this.roles.length;
                this.charIndex = 0;
                setTimeout(() => this.type(), 200);
            }
        }
    }

    // ============================================================
    // THEME MANAGER
    // ============================================================
    class ThemeManager {
        constructor() {
            this.isDarkMode = true;
            this.toggle = DOM.themeToggle;
            this.icon = DOM.themeIcon;
            this.init();
        }

        init() {
            this.loadTheme();
            this.toggle.addEventListener('click', () => this.toggleTheme());
        }

        loadTheme() {
            const saved = localStorage.getItem('theme');
            if (saved === 'light') {
                this.isDarkMode = false;
                document.body.classList.add('light-mode');
                this.icon.className = 'fas fa-sun';
            }
        }

        toggleTheme() {
            this.isDarkMode = !this.isDarkMode;
            document.body.classList.toggle('light-mode', !this.isDarkMode);
            this.icon.className = this.isDarkMode ? 'fas fa-moon' : 'fas fa-sun';
            localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
        }
    }

    // ============================================================
    // SCROLL NAVIGATION
    // ============================================================
    class ScrollNavigation {
        constructor() {
            this.sections = DOM.sections;
            this.navLinks = DOM.navLinks;
            this.progressDots = DOM.progressDots;
            this.scrollContainer = DOM.scrollContainer;
            this.currentIndex = 0;
            this.isScrolling = false;
            this.init();
        }

        init() {
            this.updateActiveSection(0);
            this.navLinks.forEach((link, i) => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.scrollToSection(i);
                });
            });
            this.progressDots.forEach((dot, i) => {
                dot.addEventListener('click', () => this.scrollToSection(i));
            });
            this.setupIntersectionObserver();
            this.setupHeroBlur();
            this.setupNavScroll();
            this.setupStatsAnimation();
        }

        updateActiveSection(index) {
            if (this.isScrolling) return;
            this.isScrolling = true;
            this.sections.forEach((s, i) => s.classList.toggle('active', i === index));
            this.navLinks.forEach((l, i) => l.classList.toggle('active', i === index));
            this.progressDots.forEach((d, i) => d.classList.toggle('active', i === index));
            this.currentIndex = index;
            setTimeout(() => { this.isScrolling = false; }, 150);
        }

        scrollToSection(index) {
            if (index < 0 || index >= this.sections.length || !this.sections[index]) return;
            const target = this.sections[index];
            const containerRect = this.scrollContainer.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const scrollOffset = targetRect.top - containerRect.top + this.scrollContainer.scrollTop;
            this.scrollContainer.scrollTo({ top: scrollOffset, behavior: 'smooth' });
            setTimeout(() => this.updateActiveSection(index), 200);
            DOM.chatWindow.classList.remove('open');
            DOM.actionHub.classList.remove('expanded');
            if (DOM.mobileDropdown) DOM.mobileDropdown.style.transform = 'translateY(-105%)';
        }

        setupIntersectionObserver() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.dataset.index);
                        if (!isNaN(index) && index !== this.currentIndex && !this.isScrolling) {
                            this.updateActiveSection(index);
                        }
                        if (index === 0) DOM.heroSection?.classList.remove('hero-blur');
                    }
                });
            }, { threshold: 0.3, root: this.scrollContainer });
            this.sections.forEach(s => observer.observe(s));
        }

        setupHeroBlur() {
            let timeout;
            const updateHeroBlur = () => {
                if (!DOM.heroSection) return;
                if (timeout) clearTimeout(timeout);
                const vh = window.innerHeight;
                const rect = DOM.heroSection.getBoundingClientRect();
                if (rect.top < -vh * 0.3 || rect.bottom < vh * 0.2) {
                    timeout = setTimeout(() => DOM.heroSection.classList.add('hero-blur'), 100);
                } else {
                    DOM.heroSection.classList.remove('hero-blur');
                }
            };
            this.scrollContainer.addEventListener('scroll', () => requestAnimationFrame(updateHeroBlur));
            setTimeout(updateHeroBlur, 100);
        }

        setupNavScroll() {
            const nav = document.querySelector('nav');
            this.scrollContainer.addEventListener('scroll', () => {
                nav.classList.toggle('scrolled', this.scrollContainer.scrollTop > 10);
            });
            DOM.logoBtn.addEventListener('click', () => this.scrollToSection(0));
        }

        setupStatsAnimation() {
            let statsAnimated = false;
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !statsAnimated) {
                        statsAnimated = true;
                        DOM.stats.forEach(stat => {
                            const target = parseInt(stat.dataset.count);
                            let current = 0;
                            const increment = target / 40;
                            const timer = setInterval(() => {
                                current += increment;
                                if (current >= target) {
                                    stat.textContent = target + (target === 120 || target === 150 ? '%' : '+');
                                    clearInterval(timer);
                                } else {
                                    stat.textContent = Math.floor(current);
                                }
                            }, 30);
                        });
                    }
                });
            }, { threshold: 0.3, root: this.scrollContainer });
            const homeSection = document.getElementById('section-home');
            if (homeSection) observer.observe(homeSection);
        }
    }

    // ============================================================
    // BACK TO TOP
    // ============================================================
    class BackToTop {
        constructor() {
            this.button = DOM.backToTop;
            this.scrollContainer = DOM.scrollContainer;
            this.init();
        }

        init() {
            this.scrollContainer.addEventListener('scroll', () => this.updateVisibility());
            this.button.addEventListener('click', (e) => this.scrollToTop(e));
            this.button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.scrollToTop(e);
            }, { passive: false });
            setTimeout(() => this.updateVisibility(), 200);
        }

        updateVisibility() {
            if (this.scrollContainer.scrollTop > window.innerHeight * 0.6) {
                this.button.classList.add('visible');
            } else {
                this.button.classList.remove('visible');
            }
        }

        scrollToTop(e) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            this.button.style.transform = 'scale(0.85)';
            setTimeout(() => {
                if (this.button.classList.contains('visible')) this.button.style.transform = '';
            }, 300);
            const nav = new ScrollNavigation();
            nav.scrollToSection(0);
            setTimeout(() => {
                if (DOM.scrollContainer.scrollTop > 10) {
                    DOM.scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 50);
        }
    }

    // ============================================================
    // NOTIFICATION SYSTEM
    // ============================================================
    class NotificationSystem {
        constructor() {
            this.messages = [
                { title: "💡 Did you know?", message: "Flynn books 40+ qualified meetings monthly — that's basically a meeting every working hour!" },
                { title: "📞 Ring Ring!", message: "150 cold calls daily? Flynn treats rejection like a gym workout — every 'no' builds stronger sales muscles." },
                { title: "🚀 Pipeline Magic", message: "Flynn doesn't just fill your pipeline — he makes it rain opportunities. Some say he dreams in CRM dashboards." },
                { title: "🧠 Sales Wisdom", message: "Flynn believes sales isn't about selling — it's about solving. He listens first, pitches second." },
                { title: "🏆 Fun Fact", message: "Flynn reduced SDR ramp time from 8 weeks to 5. That's 3 extra weeks of productivity!" },
                { title: "🌍 Global Reach", message: "APAC, US, UK, AU — Flynn works across time zones so smoothly, even the sun asks for tips." }
            ];
            this.currentIndex = 0;
            this.visible = false;
            this.init();
        }

        init() {
            setTimeout(() => this.showNotification(), 2000);
            this.interval = setInterval(() => this.showNotification(), CONFIG.notificationInterval);
            DOM.toastClose.addEventListener('click', () => this.hideNotification());
            DOM.notificationToast.addEventListener('click', (e) => {
                if (e.target !== DOM.toastClose) this.hideNotification();
            });
        }

        showNotification() {
            if (this.visible) return;
            this.visible = true;
            const notif = this.messages[this.currentIndex];
            DOM.toastTitle.textContent = notif.title;
            DOM.toastMessage.textContent = notif.message;
            DOM.notificationToast.classList.add('show');
            this.currentIndex = (this.currentIndex + 1) % this.messages.length;
            setTimeout(() => this.hideNotification(), 6000);
        }

        hideNotification() {
            DOM.notificationToast.classList.remove('show');
            this.visible = false;
        }
    }

    // ============================================================
    // ACTION HUB
    // ============================================================
    class ActionHub {
        constructor() {
            this.init();
        }

        init() {
            DOM.hubToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                DOM.actionHub.classList.toggle('expanded');
            });
            document.addEventListener('click', (e) => {
                if (!DOM.actionHub.contains(e.target)) DOM.actionHub.classList.remove('expanded');
            });
            document.querySelectorAll('.hub-item[data-action]').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = item.dataset.action;
                    switch(action) {
                        case 'cv':
                            window.open('https://drive.google.com/file/d/1Vn7IY1x1w8Q296hpnegN0YKGqTtzbGTA/view?usp=sharing', '_blank');
                            break;
                        case 'email':
                            window.location.href = 'mailto:va.flynnjames@gmail.com';
                            break;
                        case 'phone':
                            window.location.href = 'tel:+639306359306';
                            break;
                        case 'chat':
                            DOM.chatWindow.classList.toggle('open');
                            break;
                    }
                    DOM.actionHub.classList.remove('expanded');
                });
            });
        }
    }

    // ============================================================
    // CHATBOT
    // ============================================================
    class Chatbot {
        constructor() {
            this.sectionIndices = {
                home: 0, about: 1, skills: 2, services: 3,
                gallery: 4, testimonials: 5, certifications: 6, contact: 7
            };
            this.init();
        }

        init() {
            DOM.closeChat.addEventListener('click', () => DOM.chatWindow.classList.remove('open'));
            DOM.sendChatBtn.addEventListener('click', () => this.sendMessage());
            DOM.chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            document.querySelectorAll('.chat-actions button[data-action]').forEach(btn => {
                btn.addEventListener('click', () => this.handleAction(btn.dataset.action));
            });
        }

        sendMessage() {
            const msg = DOM.chatInput.value.trim();
            if (!msg) return;
            this.addMessage(msg, 'user');
            DOM.chatInput.value = '';
            this.addMessage("👋 Use the buttons above to navigate. I'm here to help!", 'bot');
        }

        addMessage(text, sender) {
            const div = document.createElement('div');
            div.className = `chat-message ${sender}`;
            div.textContent = text;
            DOM.chatMessages.appendChild(div);
            DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
        }

        handleAction(action) {
            DOM.chatWindow.classList.remove('open');
            if (this.sectionIndices[action] !== undefined) {
                new ScrollNavigation().scrollToSection(this.sectionIndices[action]);
            } else if (action === 'hire') {
                window.location.href = 'mailto:va.flynnjames@gmail.com';
            } else if (action === 'cv') {
                window.open('https://drive.google.com/file/d/1Vn7IY1x1w8Q296hpnegN0YKGqTtzbGTA/view?usp=sharing', '_blank');
            }
        }
    }

    // ============================================================
    // MOBILE MENU
    // ============================================================
    class MobileMenu {
        constructor() {
            this.dropdown = DOM.mobileDropdown;
            this.init();
        }

        init() {
            DOM.hamburgerBtn.addEventListener('click', () => {
                this.dropdown.style.transform = 'translateY(0)';
            });
            DOM.cancelBtn.addEventListener('click', () => {
                this.dropdown.style.transform = 'translateY(-105%)';
            });
            this.dropdown.querySelectorAll('.links a').forEach(link => {
                link.addEventListener('click', () => {
                    this.dropdown.style.transform = 'translateY(-105%)';
                    const idx = parseInt(link.dataset.index);
                    if (!isNaN(idx)) new ScrollNavigation().scrollToSection(idx);
                });
            });
        }
    }

    // ============================================================
    // KEYBOARD SHORTCUTS
    // ============================================================
    class KeyboardShortcuts {
        constructor() {
            this.init();
        }

        init() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    DOM.chatWindow.classList.remove('open');
                    DOM.actionHub.classList.remove('expanded');
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    DOM.chatWindow.classList.toggle('open');
                    if (DOM.chatWindow.classList.contains('open')) DOM.chatInput.focus();
                }
                if (e.altKey && e.key >= '1' && e.key <= '8') {
                    e.preventDefault();
                    new ScrollNavigation().scrollToSection(parseInt(e.key) - 1);
                    DOM.chatWindow.classList.remove('open');
                }
            });
        }
    }

    // ============================================================
    // SHORTCUTS HINT
    // ============================================================
    class ShortcutsHint {
        constructor() {
            this.init();
        }

        init() {
            setTimeout(() => {
                DOM.shortcutsHint.classList.add('visible');
                setTimeout(() => DOM.shortcutsHint.classList.remove('visible'), 6000);
            }, 3000);
        }
    }

    // ============================================================
    // CONTACT FORM HANDLER (with reCAPTCHA)
    // ============================================================
    class ContactForm {
        constructor() {
            this.init();
        }

        init() {
            // Initialize submit button as disabled
            DOM.submitBtn.disabled = true;
            DOM.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Complete reCAPTCHA First';
            DOM.submitBtn.style.opacity = '0.6';

            // Render reCAPTCHA explicitly when the API is ready
            this.renderRecaptcha();

            // Handle form submission
            DOM.contactForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        renderRecaptcha() {
            try {
                // Check if reCAPTCHA widget container exists
                if (!DOM.recaptchaWidget) {
                    console.warn('reCAPTCHA widget container not found');
                    return;
                }

                // Check if grecaptcha is available
                if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
                    grecaptcha.render(DOM.recaptchaWidget.id, {
                        sitekey: CONFIG.recaptcha.siteKey,
                        callback: function(token) {
                            Utils.onRecaptchaSuccess(token);
                        },
                        'expired-callback': function() {
                            Utils.onRecaptchaExpired();
                        },
                        'error-callback': function() {
                            // Silently handle reCAPTCHA errors
                        }
                    });
                    console.log('✅ reCAPTCHA rendered successfully');
                } else {
                    // If grecaptcha is not available, wait for it
                    let attempts = 0;
                    const maxAttempts = 20;
                    const checkInterval = setInterval(() => {
                        attempts++;
                        if (typeof grecaptcha !== 'undefined' && grecaptcha.render) {
                            clearInterval(checkInterval);
                            grecaptcha.render(DOM.recaptchaWidget.id, {
                                sitekey: CONFIG.recaptcha.siteKey,
                                callback: function(token) {
                                    Utils.onRecaptchaSuccess(token);
                                },
                                'expired-callback': function() {
                                    Utils.onRecaptchaExpired();
                                }
                            });
                            console.log('✅ reCAPTCHA rendered successfully (delayed)');
                        } else if (attempts >= maxAttempts) {
                            clearInterval(checkInterval);
                            console.warn('⚠️ reCAPTCHA API not loaded after ' + maxAttempts + ' attempts');
                        }
                    }, 500);
                }
            } catch (e) {
                // Silently handle reCAPTCHA render errors
                console.warn('reCAPTCHA render warning:', e.message);
            }
        }

        async handleSubmit(e) {
            e.preventDefault();
            DOM.formStatus.className = 'form-status';
            DOM.formStatus.style.display = 'none';

            // Check if reCAPTCHA is completed
            let recaptchaResponse;
            try {
                if (typeof grecaptcha !== 'undefined') {
                    recaptchaResponse = grecaptcha.getResponse();
                }
            } catch(e) {
                Utils.setStatus('error', '⚠️ reCAPTCHA not loaded. Please refresh the page.');
                return;
            }

            if (!recaptchaResponse) {
                Utils.setStatus('error', '⚠️ Please complete the reCAPTCHA verification.');
                return;
            }

            // Validate EmailJS config
            if (!CONFIG.emailjs.publicKey || !CONFIG.emailjs.serviceID || !CONFIG.emailjs.templateID) {
                Utils.setStatus('error', '⚠️ Email service not configured. Please contact the site owner.');
                Utils.resetRecaptcha();
                return;
            }

            // Get form data
            const formData = {
                user_name: document.getElementById('user_name').value.trim(),
                user_email: document.getElementById('user_email').value.trim(),
                user_phone: document.getElementById('user_phone').value.trim(),
                user_subject: document.getElementById('user_subject').value,
                user_message: document.getElementById('user_message').value.trim()
            };

            // Validate required fields
            if (!formData.user_name || !formData.user_email || !formData.user_subject || !formData.user_message) {
                Utils.setStatus('error', '⚠️ Please fill in all required fields.');
                Utils.resetRecaptcha();
                return;
            }

            // Disable button
            DOM.submitBtn.disabled = true;
            DOM.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

            try {
                // ============================================================
                // IMPORTANT: Server-side reCAPTCHA Verification
                // The secret key should be stored as an environment variable
                // on your server. NEVER expose it in client-side code!
                // 
                // For local development, create a .env file:
                //   RECAPTCHA_SECRET_KEY=your_secret_key_here
                //
                // For production (Render.com, Vercel, etc.), set it as an 
                // environment variable in your deployment dashboard.
                // ============================================================
                
                // Send the reCAPTCHA token to your server for verification
                const verifyResponse = await fetch('/api/verify-recaptcha', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        token: recaptchaResponse
                    })
                });

                const verifyData = await verifyResponse.json();

                if (!verifyData.success) {
                    throw new Error(verifyData.message || 'reCAPTCHA verification failed. Please try again.');
                }

                // reCAPTCHA verified - now send the email
                DOM.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

                // Send email via EmailJS
                await emailjs.send(
                    CONFIG.emailjs.serviceID,
                    CONFIG.emailjs.templateID,
                    {
                        user_name: formData.user_name,
                        user_email: formData.user_email,
                        user_phone: formData.user_phone,
                        user_subject: formData.user_subject,
                        user_message: formData.user_message
                    }
                );

                Utils.setStatus('success', '✅ Message sent successfully! I\'ll get back to you within 24 hours.');
                DOM.contactForm.reset();
                Utils.resetRecaptcha();
                Utils.showToast('📨 Message Sent!', 'Thanks for reaching out. I\'ll respond within 24 hours.');

            } catch (error) {
                console.error('Error:', error);
                Utils.setStatus('error', '❌ ' + error.message + ' Please try again or email me directly.');
                Utils.resetRecaptcha();
            } finally {
                DOM.submitBtn.disabled = true;
                DOM.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Complete reCAPTCHA First';
                DOM.submitBtn.style.opacity = '0.6';
            }
        }
    }

    // ============================================================
    // INITIALIZE ALL MODULES
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize EmailJS with proper error handling
        try {
            if (CONFIG.emailjs.publicKey && CONFIG.emailjs.publicKey !== 'YOUR_PUBLIC_KEY') {
                emailjs.init(CONFIG.emailjs.publicKey);
                console.log('✅ EmailJS initialized successfully');
            } else {
                console.warn('⚠️ EmailJS not configured properly. Please update your public key.');
            }
        } catch (error) {
            console.warn('⚠️ EmailJS init error:', error);
        }

        // Initialize all modules
        new ParticleSystem(DOM.particleCanvas, CONFIG.particleCount);
        new Typewriter(DOM.typedSpan, CONFIG.roles);
        new ThemeManager();
        new ScrollNavigation();
        new BackToTop();
        new NotificationSystem();
        new ActionHub();
        new Chatbot();
        new MobileMenu();
        new KeyboardShortcuts();
        new ShortcutsHint();
        new ContactForm();

        console.log('✅ Portfolio Ready — All modules initialized');
        console.log('📧 EmailJS Config:', CONFIG.emailjs);
        console.log('🔒 reCAPTCHA Site Key:', CONFIG.recaptcha.siteKey);
        console.log('⚠️ Remember: Set RECAPTCHA_SECRET_KEY as an environment variable on your server!');
    });

})();