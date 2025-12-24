document.addEventListener('DOMContentLoaded', () => {
    // Force Video Playback
    const heroVideo = document.getElementById('hero-video-bg');
    if (heroVideo) {
        // Force play on load
        heroVideo.play().catch(err => {
            console.log('Autoplay blocked, waiting for user interaction');
            // Try again on first user interaction
            document.addEventListener('click', () => heroVideo.play(), { once: true });
            document.addEventListener('scroll', () => heroVideo.play(), { once: true });
        });

        // Restart if stuck
        let lastTime = 0;
        setInterval(() => {
            if (heroVideo.currentTime === lastTime && !heroVideo.paused) {
                heroVideo.currentTime = 0;
                heroVideo.play();
            }
            lastTime = heroVideo.currentTime;
        }, 2000);
    }

    // 3D Tilt Effect for Hero Container
    const heroRight = document.querySelector('.hero-right');
    const strips = document.querySelectorAll('.showcase-strip');

    if (heroRight && window.matchMedia("(min-width: 992px)").matches) {
        document.addEventListener('mousemove', (e) => {
            const x = (window.innerWidth / 2 - e.clientX) / 50;
            const y = (window.innerHeight / 2 - e.clientY) / 50;

            // Subtle parallax for the whole container
            heroRight.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;

            // Individual strip reaction (inverse or varied speed)
            strips.forEach((strip, index) => {
                const factor = (index + 1) * 2;
                strip.style.transform = `translateX(${x * factor * 0.5}px) translateY(${y * factor * 0.5}px)`;
            });
        });

        // Reset on leave
        document.addEventListener('mouseleave', () => {
            heroRight.style.transform = `rotateY(0deg) rotateX(0deg)`;
            strips.forEach(strip => {
                strip.style.transform = `translateX(0) translateY(0)`;
            });
        });
    }

    // Optional: Particle System Init if canvas exists
    const canvas = document.getElementById('hero-bg-canvas');
    if (canvas) {
        initParticles(canvas);
    }
});

function initParticles(canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.size = Math.random() * 2;
            this.alpha = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0) this.x = width;
            if (this.x > width) this.x = 0;
            if (this.y < 0) this.y = height;
            if (this.y > height) this.y = 0;
        }

        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animate);
    }

    animate();
}
