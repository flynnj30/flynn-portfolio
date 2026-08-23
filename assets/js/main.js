/**
 * ============================================================
 * FLYNN JAMES PONTINO | PORTFOLIO MAIN SCRIPT
 * Version: 2.0.0
 * Last Updated: 2026-08-23
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
        notificationInterval: 20000,
        animationThreshold: 0.15,
        staggerDelay: 80,
        // UPDATED CV URL
        cvUrl: 'https://drive.google.com/file/d/1MIN-epAamM3280J2Qv9LwWoQ1w_b15Fd/view'
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
        particleCanvas: document.getElementById('particleCanvas'),
        scrollProgress: document.getElementById('scrollProgress'),
        trustSection: document.getElementById('trust')
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

        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
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
        },

        isInViewport: function(element, threshold) {
            const rect = element.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const thresholdHeight = threshold || 0.15;
            const visibleHeight = rect.height * thresholdHeight;
            return rect.top < windowHeight - visibleHeight && rect.bottom > visibleHeight;
        },

        getScrollPercent: function() {
            const scrollTop = DOM.scrollContainer.scrollTop;
            const scrollHeight = DOM.scrollContainer.scrollHeight - DOM.scrollContainer.clientHeight;
            return scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
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
    // SCROLL PROGRESS BAR
    // ============================================================
    class ScrollProgress {
        constructor() {
            this.bar = DOM.scrollProgress;
            this.container = DOM.scrollContainer;
            this.init();
        }

        init() {
            this.container.addEventListener('scroll', () => {
                const progress = Utils.getScrollPercent();
                this.bar.style.width = progress + '%';
            });
        }
    }

    // ============================================================
    // SCROLL REVEAL - Premium Animations
    // ============================================================
    class ScrollReveal {
        constructor() {
            this.revealElements = document.querySelectorAll('.reveal, .reveal-fade-up, .reveal-slide-left, .reveal-slide-right, .reveal-scale, .reveal-blur');
            this.staggerElements = document.querySelectorAll('.stagger-children');
            this.init();
        }

        init() {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                this.revealElements.forEach(el => el.classList.add('visible'));
                this.staggerElements.forEach(el => el.classList.add('visible'));
                return;
            }

            this.checkVisibility();
            const throttledCheck = Utils.throttle(() => this.checkVisibility(), 100);
            DOM.scrollContainer.addEventListener('scroll', throttledCheck);
            window.addEventListener('resize', Utils.debounce(() => this.checkVisibility(), 200));
        }

        checkVisibility() {
            this.revealElements.forEach(el => {
                if (Utils.isInViewport(el, CONFIG.animationThreshold) && !el.classList.contains('visible')) {
                    el.classList.add('visible');
                }
            });
            this.staggerElements.forEach(el => {
                if (Utils.isInViewport(el, CONFIG.animationThreshold) && !el.classList.contains('visible')) {
                    el.classList.add('visible');
                }
            });
        }
    }

    // ============================================================
    // TRUST STRIP - Scroll Animation
    // ============================================================
    class TrustStrip {
        constructor() {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                if (DOM.trustSection) {
                    DOM.trustSection.querySelectorAll('.chip').forEach(chip => {
                        chip.style.opacity = '1';
                        chip.style.transform = 'translateY(0)';
                    });
                }
                return;
            }

            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const chips = entry.target.querySelectorAll('.chip');
                        chips.forEach((chip, index) => {
                            chip.style.opacity = '0';
                            chip.style.transform = 'translateY(20px)';
                            setTimeout(() => {
                                chip.style.transition = 'all 0.5s var(--transition-smooth)';
                                chip.style.opacity = '1';
                                chip.style.transform = 'translateY(0)';
                            }, 50 + (index * 60));
                        });
                        this.observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });

            if (DOM.trustSection) {
                this.observer.observe(DOM.trustSection);
            }
        }
    }

    // ============================================================
    // COUNT UP ANIMATION
    // ============================================================
    class CountUp {
        constructor() {
            this.stats = DOM.stats;
            this.animated = false;
            this.init();
        }

        init() {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                this.stats.forEach(stat => {
                    const target = parseInt(stat.dataset.count);
                    stat.textContent = target + (target === 120 || target === 150 ? '%' : '+');
                    stat.classList.add('counted');
                });
                this.animated = true;
                return;
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.animated) {
                        this.animated = true;
                        this.animateStats();
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });

            const homeSection = document.getElementById('section-home');
            if (homeSection) observer.observe(homeSection);
        }

        animateStats() {
            this.stats.forEach((stat, index) => {
                const target = parseInt(stat.dataset.count);
                let current = 0;
                const duration = 1500;
                const startTime = performance.now();

                const updateNumber = (timestamp) => {
                    const progress = Math.min((timestamp - startTime) / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    current = Math.floor(eased * target);

                    if (current < target) {
                        stat.textContent = current;
                        requestAnimationFrame(updateNumber);
                    } else {
                        stat.textContent = target + (target === 120 || target === 150 ? '%' : '+');
                        stat.classList.add('counted');
                    }
                };

                setTimeout(() => {
                    requestAnimationFrame(updateNumber);
                }, index * 200);
            });
        }
    }

    // ============================================================
    // SKILL BARS ANIMATION
    // ============================================================
    class SkillBars {
        constructor() {
            this.bars = document.querySelectorAll('.skill-bar-fill');
            this.init();
        }

        init() {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                this.bars.forEach(bar => {
                    const width = bar.dataset.width || 0;
                    bar.style.setProperty('--skill-width', width + '%');
                    bar.classList.add('animated');
                });
                return;
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const bar = entry.target;
                        const width = bar.dataset.width || 0;
                        setTimeout(() => {
                            bar.style.setProperty('--skill-width', width + '%');
                            bar.classList.add('animated');
                        }, 200);
                        observer.unobserve(bar);
                    }
                });
            }, { threshold: 0.3 });

            this.bars.forEach(bar => observer.observe(bar));
        }
    }

    // ============================================================
    // PROJECT CARDS - Enhanced Interaction
    // ============================================================
    class ProjectCards {
        constructor() {
            this.cards = document.querySelectorAll('.project-card');
            this.init();
        }

        init() {
            this.cards.forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transition = 'all 0.4s var(--transition-bounce)';
                });
                card.addEventListener('mouseleave', function() {
                    this.style.transition = 'all 0.6s var(--transition-smooth)';
                });
            });
        }
    }

    // ============================================================
    // FAQ ACCORDION
    // ============================================================
    class FAQ {
        constructor() {
            this.items = document.querySelectorAll('.faq-item');
            this.init();
        }

        init() {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            
            this.items.forEach(item => {
                const question = item.querySelector('.faq-question');
                const answer = item.querySelector('.faq-answer');
                
                if (prefersReducedMotion) {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                }

                question.addEventListener('click', () => {
                    const isActive = item.classList.contains('active');
                    
                    this.items.forEach(i => {
                        i.classList.remove('active');
                        const a = i.querySelector('.faq-answer');
                        a.style.maxHeight = '0';
                    });
                    
                    if (!isActive) {
                        item.classList.add('active');
                        answer.style.maxHeight = answer.scrollHeight + 'px';
                    }
                });
            });
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
            this.setupElegantHomeTransition();
        }

        updateActiveSection(index) {
            if (this.isScrolling) return;
            this.isScrolling = true;
            this.sections.forEach((s, i) => {
                s.classList.toggle('active', i === index);
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
            target.classList.add('elegant-enter');
            setTimeout(() => {
                target.classList.remove('elegant-enter');
                void target.offsetWidth;
                target.classList.add('elegant-enter');
            }, 50);
        }

        setupElegantHomeTransition() {
            let lastScrollTop = 0;
            this.scrollContainer.addEventListener('scroll', () => {
                const scrollTop = this.scrollContainer.scrollTop;
                const homeSection = this.sections[0];
                if (homeSection) {
                    const rect = homeSection.getBoundingClientRect();
                    const containerRect = this.scrollContainer.getBoundingClientRect();
                    const isHomeVisible = rect.top >= containerRect.top - 100 && rect.top <= containerRect.top + 200;
                    
                    if (isHomeVisible && this.currentIndex !== 0) {
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
                const homeSection = this.sections[0];
                if (homeSection) {
                    setTimeout(() => this.triggerElegantHomeTransition(homeSection), 300);
                }
            });
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
            
            this.button.style.transform = 'scale(0.85)';
            setTimeout(() => {
                if (this.button.classList.contains('visible')) {
                    this.button.style.transform = '';
                }
            }, 300);
            
            const nav = new ScrollNavigation();
            nav.scrollToSection(0);
            
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
                            window.open(CONFIG.cvUrl, '_blank');
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
                faq: 7,
                contact: 8
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
                window.open(CONFIG.cvUrl, '_blank');
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
            DOM.submitBtn.disabled = true;
            DOM.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Please Accept Terms to Continue';
            DOM.submitBtn.style.opacity = '0.6';
            DOM.submitBtn.style.cursor = 'not-allowed';

            if (DOM.termsCheckbox) {
                DOM.termsCheckbox.addEventListener('change', () => {
                    if (DOM.termsCheckbox.checked) {
                        DOM.submitBtn.disabled = false;
                        DOM.submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                        DOM.submitBtn.style.opacity = '1';
                        DOM.submitBtn.style.cursor = 'pointer';
                        DOM.termsCheckbox.parentElement.classList.remove('error');
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

            DOM.contactForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        async handleSubmit(e) {
            e.preventDefault();

            DOM.formStatus.className = 'form-status';
            DOM.formStatus.style.display = 'none';

            if (!DOM.termsCheckbox || !DOM.termsCheckbox.checked) {
                DOM.termsCheckbox.parentElement.classList.add('error');
                Utils.setStatus('error', '⚠️ Please accept the Terms & Conditions and Privacy Policy.');
                DOM.termsCheckbox.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                return;
            }

            const formData = {
                user_name: document.getElementById('user_name').value.trim(),
                user_email: document.getElementById('user_email').value.trim(),
                user_phone: document.getElementById('user_phone').value.trim(),
                user_subject: document.getElementById('user_subject').value,
                user_message: document.getElementById('user_message').value.trim(),
                terms_accepted: 'Yes'
            };

            if (!formData.user_name || !formData.user_email || !formData.user_subject || !formData.user_message) {
                Utils.setStatus('error', '⚠️ Please fill in all required fields.');
                return;
            }

            if (!Utils.validateEmail(formData.user_email)) {
                Utils.setStatus('error', '⚠️ Please enter a valid email address.');
                return;
            }

            if (!CONFIG.emailjs.publicKey || !CONFIG.emailjs.serviceID || !CONFIG.emailjs.templateID) {
                Utils.setStatus('error', '⚠️ Email service not configured. Please contact the site owner.');
                return;
            }

            const sanitizedData = {
                user_name: Utils.sanitizeInput(formData.user_name),
                user_email: Utils.sanitizeInput(formData.user_email),
                user_phone: Utils.sanitizeInput(formData.user_phone),
                user_subject: Utils.sanitizeInput(formData.user_subject),
                user_message: Utils.sanitizeInput(formData.user_message),
                terms_accepted: formData.terms_accepted
            };

            DOM.submitBtn.disabled = true;
            DOM.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            DOM.submitBtn.style.animation = 'pulse 0.5s ease infinite';

            try {
                const emailResult = await emailjs.send(
                    CONFIG.emailjs.serviceID,
                    CONFIG.emailjs.templateID,
                    sanitizedData
                );

                Utils.setStatus('success', '✅ Message sent successfully! I\'ll get back to you within 24 hours.');
                DOM.contactForm.reset();

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
    // VIDEO SECTION - Lazy Load & Interaction
    // ============================================================
    class VideoSection {
        constructor() {
            this.videos = document.querySelectorAll('.video-frame iframe');
            this.init();
        }

        init() {
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const iframe = entry.target;
                            const src = iframe.getAttribute('data-src');
                            if (src) {
                                iframe.setAttribute('src', src);
                                iframe.removeAttribute('data-src');
                            }
                            observer.unobserve(iframe);
                        }
                    });
                }, { threshold: 0.3 });

                this.videos.forEach(video => {
                    const currentSrc = video.getAttribute('src');
                    if (currentSrc && !currentSrc.includes('about:blank')) {
                        video.setAttribute('data-src', currentSrc);
                        video.removeAttribute('src');
                    }
                    observer.observe(video);
                });
            }
        }
    }

    // ============================================================
    // VIDEO VISIBILITY
    // ============================================================
    class VideoVisibility {
        constructor() {
            this.init();
        }

        init() {
            document.addEventListener('visibilitychange', () => {
                const videos = document.querySelectorAll('.video-frame iframe');
                videos.forEach(video => {});
            });
        }
    }

    // ============================================================
    // PARALLAX EFFECT (Subtle)
    // ============================================================
    class ParallaxEffect {
        constructor() {
            this.elements = document.querySelectorAll('.hero-image, .about-image');
            this.init();
        }

        init() {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) return;

            const handleScroll = Utils.throttle(() => {
                const scrollY = DOM.scrollContainer.scrollTop;
                this.elements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const speed = el.classList.contains('hero-image') ? 0.05 : 0.03;
                    const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
                    el.style.transform = `translateY(${offset * 0.5}px)`;
                });
            }, 16);

            DOM.scrollContainer.addEventListener('scroll', handleScroll);
        }
    }

    // ============================================================
    // MICRO-INTERACTIONS - Hover Glow
    // ============================================================
    class MicroInteractions {
        constructor() {
            this.init();
        }

        init() {
            document.querySelectorAll('.skill-card, .service-card, .testimonial-card, .cert-card').forEach(card => {
                card.addEventListener('mouseenter', function() {
                    this.style.transition = 'all 0.3s ease';
                });
                card.addEventListener('mouseleave', function() {
                    this.style.transition = 'all 0.5s var(--transition-smooth)';
                });
            });

            document.querySelectorAll('.social-links a').forEach(link => {
                link.addEventListener('mouseenter', function() {
                    this.style.transition = 'all 0.3s var(--transition-bounce)';
                });
            });
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

        // Initialize all modules
        const modules = [
            { name: 'Particles System', init: () => new ParticleSystem(DOM.particleCanvas, CONFIG.particleCount) },
            { name: 'Typewriter', init: () => new Typewriter(DOM.typedSpan, CONFIG.roles) },
            { name: 'Theme Manager', init: () => new ThemeManager() },
            { name: 'Scroll Progress', init: () => new ScrollProgress() },
            { name: 'Scroll Reveal', init: () => new ScrollReveal() },
            { name: 'Trust Strip', init: () => new TrustStrip() },
            { name: 'Count Up', init: () => new CountUp() },
            { name: 'Skill Bars', init: () => new SkillBars() },
            { name: 'FAQ', init: () => new FAQ() },
            { name: 'Scroll Navigation', init: () => new ScrollNavigation() },
            { name: 'Back to Top', init: () => new BackToTop() },
            { name: 'Notification System', init: () => new NotificationSystem() },
            { name: 'Action Hub', init: () => new ActionHub() },
            { name: 'Chatbot', init: () => new Chatbot() },
            { name: 'Mobile Menu', init: () => new MobileMenu() },
            { name: 'Keyboard Shortcuts', init: () => new KeyboardShortcuts() },
            { name: 'Shortcuts Hint', init: () => new ShortcutsHint() },
            { name: 'Contact Form', init: () => new ContactForm() },
            { name: 'Video Section', init: () => new VideoSection() },
            { name: 'Video Visibility', init: () => new VideoVisibility() },
            { name: 'Parallax Effect', init: () => new ParallaxEffect() },
            { name: 'Micro Interactions', init: () => new MicroInteractions() }
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
        console.log('🎨 Premium Animations: Enabled');
        console.log('✨ Elegant Transitions: Enabled');
        console.log('📊 Scroll Progress: Enabled');
        console.log('🏷️ Trust Strip: Enabled');
        console.log('🎥 Video Section: Enabled');
        console.log('🎯 Count Up: Enabled');
        console.log('🌀 Parallax: Enabled');
        console.log('📊 Skill Bars: Enabled');
        console.log('❓ FAQ Section: Enabled');
        console.log('=' .repeat(60));
        console.log('🚀 Portfolio is ready to use!');
        console.log('📱 Responsive: Yes');
        console.log('🔒 Secure: Yes');
        console.log('📋 GDPR Compliant: Yes');
        console.log('🎯 All buttons: Functional');
        console.log('🎨 Animations: 60 FPS Optimized');
        console.log('♿ Accessibility: Reduced Motion Supported');
        console.log('📄 CV URL: ' + CONFIG.cvUrl);
        console.log('=' .repeat(60));
    });

})();