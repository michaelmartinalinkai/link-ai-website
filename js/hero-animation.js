/**
 * REFERENCE LOOK HERO ANIMATION
 * 1. Background: Deep Purple Flowing Waves (Cinematic, Particle-like noise)
 * 2. Interaction: Subtle abstract connection (Reference Style)
 */

const canvas = document.getElementById('hero-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let time = 0;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- 1. DEEP PURPLE FLOWING WAVES (Reference Style) ---
// The reference image has smooth, deep purple waves that look almost like silk or energy fields.

const waves = [
    // Layer 1 (Deepest)
    { y: 0.5, amp: 120, len: 0.0008, speed: 0.0002, color: 'rgba(76, 29, 149, 0.4)' }, // Violet 900
    // Layer 2 (Mid)
    { y: 0.6, amp: 100, len: 0.0012, speed: 0.0004, color: 'rgba(109, 40, 217, 0.3)' }, // Violet 700
    // Layer 3 (Highlight) - The bright wave in the ref
    { y: 0.7, amp: 80, len: 0.0018, speed: 0.0006, color: 'rgba(139, 92, 246, 0.15)' }  // Violet 500
];

// Noise Particles to add texture/premium feel
const particles = Array.from({ length: 40 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2,
    alpha: Math.random() * 0.5,
    speed: Math.random() * 0.2
}));

function drawWaves() {
    // Fill background gradient first (Deep space purple)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0f0720'); // Almost black purple
    bgGrad.addColorStop(1, '#2e1065'); // Deep violet
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw Waves
    waves.forEach(w => {
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 15) {
            const dy = Math.sin(x * w.len + time * w.speed) * w.amp;
            const dy2 = Math.cos(x * w.len * 0.5 - time * w.speed * 0.5) * (w.amp * 0.5); // Add complexity
            ctx.lineTo(x, height * w.y + dy + dy2);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.fillStyle = w.color;
        ctx.fill();

        // Add subtle glow line on top of wave
        ctx.lineWidth = 2;
        ctx.strokeStyle = `rgba(167, 139, 250, 0.1)`;
        ctx.stroke();
    });
}

function drawParticles() {
    ctx.fillStyle = '#fff';
    particles.forEach(p => {
        p.y -= p.speed;
        if (p.y < 0) p.y = height;

        ctx.globalAlpha = p.alpha * 0.3; // Very subtle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    time += 1;

    drawWaves();
    drawParticles();

    // SVG Connector Logic (Keep existing simple logic if needed, or clear it if abstract)
    // The reference request said "Subtle chain-like... only visible through light".
    // I'll keep the functional connector if it exists in HTML, which it does.
    updateConnector();

    requestAnimationFrame(animate);
}
animate();


// --- 2. CONNECTOR LOGIC (Keep Functional but Minimal) ---
const connectorSvg = document.getElementById('chain-overlay');
const headline = document.querySelector('.hero-title-3d-ref'); // Updated selector
const btns = document.querySelectorAll('.nav-pill-glass'); // Updated select

let activeTarget = null;
let animOffset = 0;

if (btns.length) {
    btns.forEach(btn => {
        btn.addEventListener('mouseenter', () => startConnect(btn));
        btn.addEventListener('mouseleave', () => endConnect());
    });
}

function startConnect(target) {
    activeTarget = target;
    connectorSvg.innerHTML = '';

    // Create subtle light beam connection
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    grad.setAttribute("id", "beamGrad");
    grad.innerHTML = `
        <stop offset="0%" stop-color="#fff" stop-opacity="0" />
        <stop offset="50%" stop-color="#fff" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#fff" stop-opacity="0" />
    `;
    defs.appendChild(grad);
    connectorSvg.appendChild(defs);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke", "url(#beamGrad)");
    path.setAttribute("stroke-width", "1"); // Very thin beam
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");

    connectorSvg.appendChild(path);
}

function endConnect() {
    activeTarget = null;
    connectorSvg.innerHTML = '';
}

function updateConnector() {
    if (!activeTarget || !headline) return; // headline might be missing if selector wrong

    const svgRect = connectorSvg.getBoundingClientRect();
    const hRect = headline.getBoundingClientRect();
    const bRect = activeTarget.getBoundingClientRect();

    const x1 = (hRect.left + hRect.width / 2) - svgRect.left;
    const y1 = hRect.bottom - svgRect.top - 20;

    const x2 = (bRect.left + bRect.width / 2) - svgRect.left;
    const y2 = bRect.top - svgRect.top;

    // Abstract curve
    const p = connectorSvg.querySelector('path');
    if (p) {
        const cp1x = x1;
        const cp1y = y1 + (y2 - y1) * 0.6;
        const cp2x = x2;
        const cp2y = y2 - (y2 - y1) * 0.4;

        const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
        p.setAttribute('d', d);
    }
}
