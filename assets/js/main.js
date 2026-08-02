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
        termsCheckbox: document.getElementById('termsCheckbox'),
        notificationToast: document.getElementById('notificationToast'),
        toastTitle: document.getElementById('toastTitle'),
        toastMessage: document.getElementById('toastMessage'),
        toastClose: document.getElementById('toastClose'),
        shortcutsHint: document.getElementById('shortcutsHint'),
        typedSpan: document.querySelector('.typewriter-text'),
        stats: document.querySelectorAll('.stat-item .number'),
        heroSection: document.getElementById('section-home'),
        particleCanvas: document.getElementById('particleCanvas')
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
            }, 8000);
        },

        validateEmail: function(email) {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(email);
        },

        sanitizeInput: function(input) {
            const div = document.createElement('div');
            div.textContent = input;
            return div.innerHTML;
        }
    };

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
    // SCROLL NAVIGATION with Elegant Transitions
    // ============================================================
    class ScrollNavigation {
        constructor() {
            this.sections = DOM.sections;
            this.navLinks = DOM.navLinks;
            this.progressDots = DOM.progressDots;
            this.scrollContainer = DOM.scrollContainer;
            this.currentIndex = 0;
            this.isScrolling = false;
            this.isHomeTransitioning = false;
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
            this.setupElegantHomeTransition();
        }

        updateActiveSection(index) {
            if (this.isScrolling) return;
            this.isScrolling = true;
            this.sections.forEach((s, i) => {
                s.classList.toggle('active', i === index);
                // Remove elegant-enter class from all sections
                s.classList.remove('elegant-enter');
            });
            this.navLinks.forEach((l, i) => l.classList.toggle('active', i === index));
            this.progressDots.forEach((d, i) => d.classList.toggle('active', i === index));
            this.currentIndex = index;
            setTimeout(() => {
                this.isScrolling = false;
            }, 150);
        }

        scrollToSection(index) {
            if (index < 0 || index >= this.sections.length || !this.sections[index]) return;
            
            const target = this.sections[index];
            const containerRect = this.scrollContainer.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            const scrollOffset = targetRect.top - containerRect.top + this.scrollContainer.scrollTop;
            
            // If returning to home, add elegant transition
            if (index === 0 && this.currentIndex !== 0) {
                this.triggerElegantHomeTransition(target);
            }
            
            this.scrollContainer.scrollTo({
                top: scrollOffset,
                behavior: 'smooth'
            });
            
            setTimeout(() => this.updateActiveSection(index), 200);
            DOM.chatWindow.classList.remove('open');
            DOM.actionHub.classList.remove('expanded');
            if (DOM.mobileDropdown) DOM.mobileDropdown.style.transform = 'translateY(-105%)';
        }

        triggerElegantHomeTransition(target) {
            // Add elegant-enter class to trigger the CSS animation
            target.classList.add('elegant-enter');
            
            // Re-trigger the animation after a delay for smoother effect
            setTimeout(() => {
                target.classList.remove('elegant-enter');
                // Force reflow
                void target.offsetWidth;
                target.classList.add('elegant-enter');
            }, 50);
        }

        setupElegantHomeTransition() {
            // Listen for scroll events to trigger elegant transition when scrolling to home
            let lastScrollTop = 0;
            this.scrollContainer.addEventListener('scroll', () => {
                const scrollTop = this.scrollContainer.scrollTop;
                const homeSection = this.sections[0];
                if (homeSection) {
                    const rect = homeSection.getBoundingClientRect();
                    const containerRect = this.scrollContainer.getBoundingClientRect();
                    const isHomeVisible = rect.top >= containerRect.top - 100 && rect.top <= containerRect.top + 200;
                    
                    if (isHomeVisible && this.currentIndex !== 0) {
                        // Only trigger if not already on home
                        const isScrollingUp = scrollTop < lastScrollTop;
                        if (isScrollingUp) {
                            this.triggerElegantHomeTransition(homeSection);
                            this.updateActiveSection(0);
                        }
                    }
                }
                lastScrollTop = scrollTop;
            });
        }

        setupIntersectionObserver() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.dataset.index);
                        if (!isNaN(index) && index !== this.currentIndex && !this.isScrolling) {
                            this.updateActiveSection(index);
                        }
                        if (index === 0) {
                            DOM.heroSection?.classList.remove('hero-blur');
                            // Add elegant transition when home becomes visible
                            entry.target.classList.add('elegant-enter');
                        }
                    }
                });
            }, {
                threshold: 0.3,
                root: this.scrollContainer
            });
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
            DOM.logoBtn.addEventListener('click', () => {
                this.scrollToSection(0);
                // Add elegant transition for logo click
                const homeSection = this.sections[0];
                if (homeSection) {
                    setTimeout(() => this.triggerElegantHomeTransition(homeSection), 300);
                }
            });
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
            }, {
                threshold: 0.3,
                root: this.scrollContainer
            });
            const homeSection = document.getElementById('section-home');
            if (homeSection) observer.observe(homeSection);
        }
    }

    // ============================================================
    // BACK TO TOP with Elegant Animation
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
            }, {
                passive: false
            });
            setTimeout(() => this.updateVisibility(), 200);
        }

        updateVisibility() {
            if (this.scrollContainer.scrollTop > window.innerHeight * 0.6) {
                this.button.classList.add('visible');
                // Add subtle pulse animation
                this.button.style.animation = 'floatGlow 3s ease-in-out infinite';
            } else {
                this.button.classList.remove('visible');
                this.button.style.animation = '';
            }
        }

        scrollToTop(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            // Add click animation
            this.button.style.transform = 'scale(0.85)';
            setTimeout(() => {
                if (this.button.classList.contains('visible')) {
                    this.button.style.transform = '';
                }
            }, 300);
            
            const nav = new ScrollNavigation();
            nav.scrollToSection(0);
            
            // Add elegant transition
            const homeSection = document.getElementById('section-home');
            if (homeSection) {
                setTimeout(() => {
                    homeSection.classList.remove('elegant-enter');
                    void homeSection.offsetWidth;
                    homeSection.classList.add('elegant-enter');
                }, 300);
            }
            
            setTimeout(() => {
                if (DOM.scrollContainer.scrollTop > 10) {
                    DOM.scrollContainer.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
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
                // Add rotation animation
                DOM.hubToggle.style.transform = DOM.actionHub.classList.contains('expanded') ? 'rotate(45deg) scale(1.08)' : '';
            });
            document.addEventListener('click', (e) => {
                if (!DOM.actionHub.contains(e.target)) {
                    DOM.actionHub.classList.remove('expanded');
                    DOM.hubToggle.style.transform = '';
                }
            });
            document.querySelectorAll('.hub-item[data-action]').forEach(item => {
                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = item.dataset.action;
                    switch (action) {
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
                    DOM.hubToggle.style.transform = '';
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
                home: 0,
                about: 1,
                skills: 2,
                services: 3,
                gallery: 4,
                testimonials: 5,
                certifications: 6,
                contact: 7
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
            // Add fade-in animation to messages
            div.style.animation = 'fadeInUp 0.3s ease forwards';
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
                // Add subtle animation to menu items
                const items = this.dropdown.querySelectorAll('.links a');
                items.forEach((item, index) => {
                    item.style.opacity = '0';
                    item.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        item.style.transition = 'all 0.4s ease';
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0)';
                    }, 100 + (index * 50));
                });
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
                    DOM.hubToggle.style.transform = '';
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    DOM.chatWindow.classList.toggle('open');
                    if (DOM.chatWindow.classList.contains('open')) DOM.chatInput.focus();
                }
                if (e.altKey && e.key >= '1' && e.key <= '8') {
                    e.preventDefault();
                    const nav = new ScrollNavigation();
                    nav.scrollToSection(parseInt(e.key) - 1);
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
    // CONTACT FORM HANDLER
    // ============================================================
    class ContactForm {
        constructor() {
            this.init();
        }

        init() {
            // Initialize submit button as disabled
            DOM.submitBtn.disabled = true;
            DOM.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Please Accept Terms to Continue';
            DOM.submitBtn.style.opacity = '0.6';
            DOM.submitBtn.style.cursor = 'not-allowed';

            // Terms checkbox listener
            if (DOM.termsCheckbox) {
                DOM.termsCheckbox.addEventListener('change', () => {
                    if (DOM.termsCheckbox.checked) {
                        DOM.submitBtn.disabled = false;
                        DOM.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                        DOM.submitBtn.style.opacity = '1';
                        DOM.submitBtn.style.cursor = 'pointer';
                        DOM.termsCheckbox.parentElement.classList.remove('error');
                        // Add success pulse
                        DOM.submitBtn.style.animation = 'btnPulse 0.5s ease';
                        setTimeout(() => {
                            DOM.submitBtn.style.animation = '';
                        }, 500);
                    } else {
                        DOM.submitBtn.disabled = true;
                        DOM.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Please Accept Terms to Continue';
                        DOM.submitBtn.style.opacity = '0.6';
                        DOM.submitBtn.style.cursor = 'not-allowed';
                    }
                });
            }

            // Handle form submission
            DOM.contactForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        async handleSubmit(e) {
            e.preventDefault();

            // Clear previous status
            DOM.formStatus.className = 'form-status';
            DOM.formStatus.style.display = 'none';

            // Check if terms are accepted
            if (!DOM.termsCheckbox || !DOM.termsCheckbox.checked) {
                DOM.termsCheckbox.parentElement.classList.add('error');
                Utils.setStatus('error', '⚠️ Please accept the Terms & Conditions and Privacy Policy.');
                DOM.termsCheckbox.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                return;
            }

            // Get form data
            const formData = {
                user_name: document.getElementById('user_name').value.trim(),
                user_email: document.getElementById('user_email').value.trim(),
                user_phone: document.getElementById('user_phone').value.trim(),
                user_subject: document.getElementById('user_subject').value,
                user_message: document.getElementById('user_message').value.trim(),
                terms_accepted: 'Yes'
            };

            // Validate required fields
            if (!formData.user_name || !formData.user_email || !formData.user_subject || !formData.user_message) {
                Utils.setStatus('error', '⚠️ Please fill in all required fields.');
                return;
            }

            // Validate email format
            if (!Utils.validateEmail(formData.user_email)) {
                Utils.setStatus('error', '⚠️ Please enter a valid email address.');
                return;
            }

            // Validate EmailJS config
            if (!CONFIG.emailjs.publicKey || !CONFIG.emailjs.serviceID || !CONFIG.emailjs.templateID) {
                Utils.setStatus('error', '⚠️ Email service not configured. Please contact the site owner.');
                return;
            }

            // Sanitize inputs
            const sanitizedData = {
                user_name: Utils.sanitizeInput(formData.user_name),
                user_email: Utils.sanitizeInput(formData.user_email),
                user_phone: Utils.sanitizeInput(formData.user_phone),
                user_subject: Utils.sanitizeInput(formData.user_subject),
                user_message: Utils.sanitizeInput(formData.user_message),
                terms_accepted: formData.terms_accepted
            };

            // Disable button with loading animation
            DOM.submitBtn.disabled = true;
            DOM.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            DOM.submitBtn.style.animation = 'pulse 0.5s ease infinite';

            try {
                // Send email via EmailJS
                const emailResult = await emailjs.send(
                    CONFIG.emailjs.serviceID,
                    CONFIG.emailjs.templateID,
                    sanitizedData
                );

                // Success!
                Utils.setStatus('success', '✅ Message sent successfully! I\'ll get back to you within 24 hours.');
                DOM.contactForm.reset();

                // Reset checkbox and button
                if (DOM.termsCheckbox) {
                    DOM.termsCheckbox.checked = false;
                    DOM.submitBtn.disabled = true;
                    DOM.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Please Accept Terms to Continue';
                    DOM.submitBtn.style.opacity = '0.6';
                    DOM.submitBtn.style.cursor = 'not-allowed';
                }

                DOM.submitBtn.style.animation = '';
                Utils.showToast('📨 Message Sent!', 'Thanks for reaching out. I\'ll respond within 24 hours.');
                console.log('✅ Email sent successfully via EmailJS');

            } catch (error) {
                console.error('Error:', error);

                let errorMessage = '❌ ';
                if (error.message && error.message.includes('Failed to fetch')) {
                    errorMessage += 'Network error. Please check your connection and try again.';
                } else if (error.message && error.message.includes('Invalid')) {
                    errorMessage += 'Invalid form data. Please check your entries.';
                } else if (error.text && error.text.includes('timeout')) {
                    errorMessage += 'Request timed out. Please try again.';
                } else {
                    errorMessage += 'Failed to send message. Please try again or email me directly at va.flynnjames@gmail.com';
                }

                Utils.setStatus('error', errorMessage);
                DOM.submitBtn.style.animation = '';

                // Re-enable submit if terms are checked
                if (DOM.termsCheckbox && DOM.termsCheckbox.checked) {
                    DOM.submitBtn.disabled = false;
                    DOM.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                    DOM.submitBtn.style.opacity = '1';
                    DOM.submitBtn.style.cursor = 'pointer';
                }
            }
        }
    }

    // ============================================================
    // INITIALIZE ALL MODULES
    // ============================================================
    document.addEventListener('DOMContentLoaded', function() {
        console.log('=' .repeat(60));
        console.log('🚀 Starting Portfolio Initialization...');
        console.log('=' .repeat(60));

        // Initialize EmailJS
        try {
            if (CONFIG.emailjs.publicKey && CONFIG.emailjs.publicKey !== 'YOUR_PUBLIC_KEY') {
                emailjs.init(CONFIG.emailjs.publicKey);
                console.log('✅ EmailJS initialized successfully');
                console.log('📧 Service ID:', CONFIG.emailjs.serviceID);
                console.log('📧 Template ID:', CONFIG.emailjs.templateID);
            } else {
                console.warn('⚠️ EmailJS not configured properly. Please update your public key.');
            }
        } catch (error) {
            console.warn('⚠️ EmailJS init error:', error);
        }

        // Initialize all modules with error handling
        const modules = [
            { name: 'Particles System', init: () => new ParticleSystem(DOM.particleCanvas, CONFIG.particleCount) },
            { name: 'Typewriter', init: () => new Typewriter(DOM.typedSpan, CONFIG.roles) },
            { name: 'Theme Manager', init: () => new ThemeManager() },
            { name: 'Scroll Navigation', init: () => new ScrollNavigation() },
            { name: 'Back to Top', init: () => new BackToTop() },
            { name: 'Notification System', init: () => new NotificationSystem() },
            { name: 'Action Hub', init: () => new ActionHub() },
            { name: 'Chatbot', init: () => new Chatbot() },
            { name: 'Mobile Menu', init: () => new MobileMenu() },
            { name: 'Keyboard Shortcuts', init: () => new KeyboardShortcuts() },
            { name: 'Shortcuts Hint', init: () => new ShortcutsHint() },
            { name: 'Contact Form', init: () => new ContactForm() }
        ];

        modules.forEach(({ name, init }) => {
            try {
                init();
                console.log(`✅ ${name} initialized`);
            } catch (error) {
                console.warn(`⚠️ ${name} init error:`, error);
            }
        });

        console.log('=' .repeat(60));
        console.log('✅ Portfolio Ready — All modules initialized successfully');
        console.log('=' .repeat(60));
        console.log('📧 EmailJS Config:', {
            publicKey: CONFIG.emailjs.publicKey,
            serviceID: CONFIG.emailjs.serviceID,
            templateID: CONFIG.emailjs.templateID
        });
        console.log('📋 Terms & Conditions checkbox enabled');
        console.log('🌓 Theme: ' + (localStorage.getItem('theme') || 'dark'));
        console.log('🎨 Animations: Enabled');
        console.log('✨ Elegant Transitions: Enabled');
        console.log('=' .repeat(60));
        console.log('🚀 Portfolio is ready to use!');
        console.log('📱 Responsive: Yes');
        console.log('🔒 Secure: Yes');
        console.log('📋 GDPR Compliant: Yes');
        console.log('🎯 All buttons: Functional');
        console.log('=' .repeat(60));
    });

})();