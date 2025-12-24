/**
 * TRUST HOMEPAGE ANIMATIONS
 * Calm, slow, subtle motion only.
 */

// Canvas Background - Slow Particles
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

const config = {
    particleCount: 30, // Very low count for clean look
    speed: 0.15, // Extremely slow
    color: '176, 45, 253' // Brand purple
};

// Resize
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * config.speed;
        this.vy = (Math.random() - 0.5) * config.speed;
        this.size = Math.random() * 2;
        this.alpha = Math.random() * 0.3; // Very subtle
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${config.color}, ${this.alpha})`;
        ctx.fill();
    }
}

// Init
for (let i = 0; i < config.particleCount; i++) {
    particles.push(new Particle());
}

// Loop
function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw particles
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw subtle connections if close
    particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 150) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.strokeStyle = `rgba(${config.color}, ${(1 - dist / 150) * 0.1})`; // Max 0.1 alpha
                ctx.stroke();
            }
        });
    });

    requestAnimationFrame(animate);
}
animate();

// Intersection Observer for Fade-ins
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

// Target elements that should animate in
// (We need to set initial styles in CSS or JS for this to work elegantly)
document.querySelectorAll('.service-card, .process-step, .hero-headline, .hero-subline').forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    observer.observe(el);
});
