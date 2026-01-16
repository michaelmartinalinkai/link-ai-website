/* App.js - Core Logic */

document.addEventListener('DOMContentLoaded', () => {
    initScrollObserver();
    initCounters();
    // initHeroChat(); // Removed - using hero-chat.js instead
    initScrollProgress();

    // Sticky CTA Visibility
    const stickyCta = document.getElementById('stickyCta');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            stickyCta.classList.add('visible');
        } else {
            stickyCta.classList.remove('visible');
        }
    });
});

/* --- Scroll Observer --- */
function initScrollObserver() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;

                // Handle delay if present
                const delay = el.dataset.delay || 0;

                setTimeout(() => {
                    el.classList.add('in-view');
                    // Special logic: if it's a counter container, start counting
                    if (el.querySelector('[data-count]')) {
                        startCountersIn(el);
                    }
                }, delay);

                observer.unobserve(el);
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-scroll]').forEach(el => observer.observe(el));
}

/* --- Counters --- */
function initCounters() {
    // Logic moved solely to trigger via intersection observer to save resources
}

function startCountersIn(container) {
    const counters = container.querySelectorAll('[data-count]');
    counters.forEach(counter => {
        const target = parseFloat(counter.getAttribute('data-count'));
        const start = parseFloat(counter.innerText) || 0;
        const duration = 1500; // ms
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            const currentVal = start + (target - start) * ease;

            // Format logic
            if (target % 1 === 0) {
                counter.innerText = Math.floor(currentVal);
            } else {
                counter.innerText = currentVal.toFixed(1);
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                counter.innerText = target; // Ensure exact end
            }
        }

        requestAnimationFrame(update);
    });
}

/* --- Hero Chat Loop --- */
// Logic moved to hero-chat.js


/* --- Scroll Progress --- */
function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        bar.style.width = scrolled + '%';
    });
}
