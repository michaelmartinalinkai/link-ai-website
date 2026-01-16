/**
 * Cost Section Animation - LOOPING RINGS + LIVE FEED
 * Rings loop: up → full (100%) → pause → down → pause → up
 */

// DOM Elements
const costSection = document.getElementById('costSection');
const sliderKnob = document.getElementById('sliderKnob');
const feedList = document.getElementById('liveFeed');
const feedTotalEl = document.getElementById('feedTotal');

// State
let isActive = false;
let totalLoss = 216;

// Ring Configuration with staggered timing
const rings = [
    { selector: '.ring-top', maxVal: 99, minVal: 78, upDuration: 2200, downDuration: 1800, pauseUp: 500, pauseDown: 400 },
    { selector: '.ring-left', maxVal: 99, minVal: 72, upDuration: 2500, downDuration: 2000, pauseUp: 600, pauseDown: 350 },
    { selector: '.ring-right', maxVal: 99, minVal: 82, upDuration: 2000, downDuration: 1600, pauseUp: 450, pauseDown: 500 }
];

// Initialize on scroll into view
function initObserver() {
    if (!costSection) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isActive) {
                isActive = true;
                startAnimations();
            }
        });
    }, { threshold: 0.2 });

    observer.observe(costSection);
}

function startAnimations() {
    // Start each ring with staggered delays
    rings.forEach((ring, i) => {
        setTimeout(() => startRingLoop(ring), i * 300);
    });

    animateSlider();
    startClock();
    startLiveFeed();
}

// ─────────────────────────────────────────────
// RING LOOPING ANIMATION (UP → FULL → DOWN → REPEAT)
// ─────────────────────────────────────────────
function startRingLoop(ring) {
    const progressEl = document.querySelector(ring.selector + ' .ring-progress');
    const valueEl = document.querySelector(ring.selector + ' .ring-value');

    if (!progressEl || !valueEl) return;

    // Circle circumference = 2 * PI * r = 2 * 3.14159 * 42 ≈ 264
    const circumference = 264;
    let currentVal = 0;

    // Set initial state
    updateRing(0);

    function updateRing(val) {
        // At 99-100, show FULL circle (no gap)
        let visualVal = val;
        if (val >= 99) visualVal = 100; // Force full circle at 99+

        const dashLength = (visualVal / 100) * circumference;
        progressEl.setAttribute('stroke-dasharray', `${dashLength} ${circumference}`);
        valueEl.textContent = Math.round(val) + '%';
    }

    function animateUp(onComplete) {
        const startVal = currentVal;
        const targetVal = ring.maxVal;
        const duration = ring.upDuration;
        const startTime = performance.now();

        function frame(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // EaseOutCubic for smooth approach to top
            const ease = 1 - Math.pow(1 - progress, 3);

            currentVal = startVal + (targetVal - startVal) * ease;
            updateRing(currentVal);

            if (progress < 1) {
                requestAnimationFrame(frame);
            } else {
                currentVal = targetVal;
                updateRing(currentVal);
                if (onComplete) onComplete();
            }
        }
        requestAnimationFrame(frame);
    }

    function animateDown(onComplete) {
        const startVal = currentVal;
        const targetVal = ring.minVal;
        const duration = ring.downDuration;
        const startTime = performance.now();

        function frame(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // EaseInOutQuad for organic movement
            const ease = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            currentVal = startVal + (targetVal - startVal) * ease;
            updateRing(currentVal);

            if (progress < 1) {
                requestAnimationFrame(frame);
            } else {
                currentVal = targetVal;
                updateRing(currentVal);
                if (onComplete) onComplete();
            }
        }
        requestAnimationFrame(frame);
    }

    function loop() {
        // Phase 1: Animate UP to max
        animateUp(() => {
            // Phase 2: Pause at top
            setTimeout(() => {
                // Phase 3: Animate DOWN to min
                animateDown(() => {
                    // Phase 4: Pause at bottom
                    setTimeout(() => {
                        // Repeat the loop
                        loop();
                    }, ring.pauseDown);
                });
            }, ring.pauseUp);
        });
    }

    // Start the infinite loop
    loop();
}

// ─────────────────────────────────────────────
// SLIDER ANIMATION
// ─────────────────────────────────────────────
function animateSlider() {
    if (!sliderKnob) return;

    // Subtle drift animation (oscillate left-right slowly)
    let position = 50;
    let direction = 1;
    const speed = 0.02;
    const minPos = 40;
    const maxPos = 60;

    function drift() {
        position += direction * speed;

        if (position >= maxPos) direction = -1;
        if (position <= minPos) direction = 1;

        sliderKnob.style.left = position + '%';
        requestAnimationFrame(drift);
    }

    drift();
    initSliderDrag();
}

function initSliderDrag() {
    if (!sliderKnob) return;

    let isDragging = false;
    const track = sliderKnob.parentElement;

    sliderKnob.addEventListener('mousedown', (e) => {
        isDragging = true;
        sliderKnob.style.cursor = 'grabbing';
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging || !track) return;

        const rect = track.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));

        const pct = (x / rect.width) * 100;
        sliderKnob.style.left = pct + '%';
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
        if (sliderKnob) sliderKnob.style.cursor = 'grab';
    });
}

// ─────────────────────────────────────────────
// LIVE FEED (CALM UPDATES)
// ─────────────────────────────────────────────
function startLiveFeed() {
    // Subtle value updates on existing rows
    setInterval(() => {
        if (document.hidden) return;

        const lossElements = feedList?.querySelectorAll('.feed-row-loss');
        if (!lossElements || lossElements.length === 0) return;

        // Pick random row to update
        const idx = Math.floor(Math.random() * lossElements.length);
        const el = lossElements[idx];

        // Subtle fade and value change
        el.style.transition = 'opacity 0.3s';
        el.style.opacity = '0.5';

        setTimeout(() => {
            // Small value bump
            const current = parseInt(el.textContent.replace('€', '')) || 200;
            const bump = Math.floor(Math.random() * 30) - 10; // -10 to +20
            const newVal = Math.max(150, current + bump);
            el.textContent = '€' + newVal;
            el.style.opacity = '1';

            // Update total
            totalLoss += bump;
            if (feedTotalEl) feedTotalEl.textContent = totalLoss;
        }, 300);

    }, 3500);
}

// ─────────────────────────────────────────────
// CLOCK
// ─────────────────────────────────────────────
function startClock() {
    const clockEl = document.getElementById('feedClock');
    if (!clockEl) return;

    function update() {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    }

    update();
    setInterval(update, 1000);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initObserver);
