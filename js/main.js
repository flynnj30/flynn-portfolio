/**
 * Main JavaScript - Navigation, Panels, Typewriter
 */

// ===== AOS Init =====
document.addEventListener('DOMContentLoaded', function() {
    AOS.init({ duration: 800, once: true, offset: 50 });
});

// ===== TYPEWRITER =====
const roles = ["PIPELINE ARCHITECT", "SALES LEADER", "TEAM BUILDER"];
let roleIndex = 0,
    charIndex = 0;
const typedSpan = document.querySelector(".typewriter-text");
let isDeleting = false;

function typeEffect() {
    if (!typedSpan) return;
    const currentRole = roles[roleIndex];
    if (!isDeleting && charIndex <= currentRole.length) {
        typedSpan.textContent = currentRole.substring(0, charIndex);
        charIndex++;
        setTimeout(typeEffect, 100);
    } else if (isDeleting && charIndex >= 0) {
        typedSpan.textContent = currentRole.substring(0, charIndex);
        charIndex--;
        setTimeout(typeEffect, 45);
    } else if (!isDeleting && charIndex > currentRole.length) {
        isDeleting = true;
        setTimeout(typeEffect, 1500);
    } else if (isDeleting && charIndex < 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        charIndex = 0;
        setTimeout(typeEffect, 200);
    }
}
setTimeout(typeEffect, 300);

// ===== PANEL TOGGLE =====
document.addEventListener('DOMContentLoaded', function() {
    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            document.querySelectorAll('.info-panel').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            if (section === 'home') {
                document.getElementById('home-section').scrollIntoView({ behavior: 'smooth' });
                return;
            }
            const panel = document.getElementById(section + '-panel');
            if (panel) panel.classList.add('active');
            document.getElementById('mobileDropdown').style.transform = 'translateY(-120%)';
        });
    });

    // Mobile menu
    document.getElementById('hamburgerBtn').addEventListener('click', () => {
        document.getElementById('mobileDropdown').style.transform = 'translateY(0%)';
    });
    document.getElementById('cancelBtn').addEventListener('click', () => {
        document.getElementById('mobileDropdown').style.transform = 'translateY(-120%)';
    });

    // Close panels on hero click
    document.getElementById('home-section').addEventListener('click', (e) => {
        if (!e.target.closest('.info-panel')) {
            document.querySelectorAll('.info-panel').forEach(p => p.classList.remove('active'));
        }
    });
});

console.log('✅ Main JS loaded');