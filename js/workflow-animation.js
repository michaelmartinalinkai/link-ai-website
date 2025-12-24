/**
 * WORKFLOW ENGINE - CUSTOM ANIMATED VISUALIZATION
 * Abstract node network with data flow pulses
 * Living system that breathes and reconfigures
 */

(function () {
    'use strict';

    const canvas = document.getElementById('wf-engine-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;
    let nodes = [];
    let connections = [];
    let pulses = [];
    let particles = [];
    let time = 0;
    let mouseX = 0, mouseY = 0;

    // ---- CONFIGURATION ----
    const CONFIG = {
        nodeCount: 12,
        connectionDistance: 220,
        pulseSpeed: 0.008,
        driftSpeed: 0.15,
        reconfigureSpeed: 0.0003,
        particleCount: 40,
        parallaxStrength: 0.02,
        colors: {
            nodeFill: 'rgba(139, 92, 246, 0.12)',
            nodeStroke: 'rgba(139, 92, 246, 0.35)',
            nodeGlow: 'rgba(139, 92, 246, 0.25)',
            nodeActive: 'rgba(139, 92, 246, 0.5)',
            line: 'rgba(139, 92, 246, 0.12)',
            lineGlow: 'rgba(139, 92, 246, 0.3)',
            pulse: 'rgba(139, 92, 246, 0.8)',
            pulseGlow: 'rgba(139, 92, 246, 0.4)',
            particle: 'rgba(139, 92, 246, 0.15)'
        }
    };

    // ---- RESIZE ----
    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = canvas.offsetWidth;
        height = canvas.offsetHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        init();
    }

    // ---- NODE CLASS ----
    class Node {
        constructor(x, y, depth) {
            this.x = x;
            this.y = y;
            this.targetX = x;
            this.targetY = y;
            this.baseX = x;
            this.baseY = y;
            this.depth = depth; // 0 = far, 1 = close
            this.radius = 8 + depth * 10 + Math.random() * 6;
            this.phase = Math.random() * Math.PI * 2;
            this.driftPhaseX = Math.random() * Math.PI * 2;
            this.driftPhaseY = Math.random() * Math.PI * 2;
            this.glowIntensity = 0;
            this.type = Math.floor(Math.random() * 4); // visual type
            this.reconfigureTimer = Math.random() * 1000;
        }

        update(t) {
            // Slow drift motion
            const driftX = Math.sin(t * 0.0004 + this.driftPhaseX) * 20 * this.depth;
            const driftY = Math.cos(t * 0.0003 + this.driftPhaseY) * 15 * this.depth;

            // Parallax based on depth
            const parallaxX = (mouseX - width / 2) * CONFIG.parallaxStrength * this.depth;
            const parallaxY = (mouseY - height / 2) * CONFIG.parallaxStrength * this.depth;

            this.targetX = this.baseX + driftX + parallaxX;
            this.targetY = this.baseY + driftY + parallaxY;

            // Smooth movement
            this.x += (this.targetX - this.x) * 0.02;
            this.y += (this.targetY - this.y) * 0.02;

            // Occasional reconfigure
            this.reconfigureTimer -= 1;
            if (this.reconfigureTimer <= 0) {
                this.baseX += (Math.random() - 0.5) * 60;
                this.baseY += (Math.random() - 0.5) * 40;
                // Keep in bounds
                this.baseX = Math.max(50, Math.min(width - 50, this.baseX));
                this.baseY = Math.max(50, Math.min(height - 50, this.baseY));
                this.reconfigureTimer = 800 + Math.random() * 1200;
            }

            // Natural glow pulsing
            this.glowIntensity = 0.3 + Math.sin(t * 0.002 + this.phase) * 0.2;
        }

        draw(ctx) {
            const x = this.x;
            const y = this.y;
            const r = this.radius;

            ctx.save();

            // Outer glow
            if (this.glowIntensity > 0.2) {
                const glowGrad = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 3);
                glowGrad.addColorStop(0, `rgba(139, 92, 246, ${this.glowIntensity * 0.15})`);
                glowGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
                ctx.beginPath();
                ctx.arc(x, y, r * 3, 0, Math.PI * 2);
                ctx.fillStyle = glowGrad;
                ctx.fill();
            }

            // Main node circle
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);

            // Gradient fill
            const fillGrad = ctx.createRadialGradient(x - r / 3, y - r / 3, 0, x, y, r);
            fillGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            fillGrad.addColorStop(0.5, CONFIG.colors.nodeFill);
            fillGrad.addColorStop(1, 'rgba(139, 92, 246, 0.08)');
            ctx.fillStyle = fillGrad;
            ctx.fill();

            // Border
            ctx.strokeStyle = CONFIG.colors.nodeStroke;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Inner detail based on type
            ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)';
            ctx.lineWidth = 1;

            switch (this.type) {
                case 0: // Center dot
                    ctx.beginPath();
                    ctx.arc(x, y, r * 0.25, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 1: // Ring
                    ctx.beginPath();
                    ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
                case 2: // Cross
                    ctx.beginPath();
                    ctx.moveTo(x - r * 0.35, y);
                    ctx.lineTo(x + r * 0.35, y);
                    ctx.moveTo(x, y - r * 0.35);
                    ctx.lineTo(x, y + r * 0.35);
                    ctx.stroke();
                    break;
                case 3: // Triangle
                    ctx.beginPath();
                    const tr = r * 0.35;
                    ctx.moveTo(x, y - tr);
                    ctx.lineTo(x + tr * 0.866, y + tr * 0.5);
                    ctx.lineTo(x - tr * 0.866, y + tr * 0.5);
                    ctx.closePath();
                    ctx.stroke();
                    break;
            }

            ctx.restore();
        }
    }

    // ---- PULSE CLASS ----
    class Pulse {
        constructor(nodeA, nodeB) {
            this.nodeA = nodeA;
            this.nodeB = nodeB;
            this.progress = 0;
            this.speed = CONFIG.pulseSpeed * (0.7 + Math.random() * 0.6);
            this.size = 4 + Math.random() * 3;
            this.delay = Math.random() * 2;
            this.active = false;
        }

        update() {
            if (this.delay > 0) {
                this.delay -= 0.016;
                return;
            }
            this.active = true;
            this.progress += this.speed;
            if (this.progress > 1) {
                this.progress = 0;
                this.delay = 1 + Math.random() * 3;
                this.active = false;
                // Trigger glow on destination node
                this.nodeB.glowIntensity = 0.8;
            }
        }

        draw(ctx) {
            if (!this.active) return;

            const x = this.nodeA.x + (this.nodeB.x - this.nodeA.x) * this.progress;
            const y = this.nodeA.y + (this.nodeB.y - this.nodeA.y) * this.progress;

            ctx.save();

            // Glow
            const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, this.size * 4);
            glowGrad.addColorStop(0, CONFIG.colors.pulseGlow);
            glowGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
            ctx.beginPath();
            ctx.arc(x, y, this.size * 4, 0, Math.PI * 2);
            ctx.fillStyle = glowGrad;
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(x, y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = CONFIG.colors.pulse;
            ctx.fill();

            ctx.restore();
        }
    }

    // ---- PARTICLE CLASS ----
    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = 1 + Math.random() * 2;
            this.speedX = (Math.random() - 0.5) * 0.3;
            this.speedY = (Math.random() - 0.5) * 0.2;
            this.opacity = 0.1 + Math.random() * 0.2;
            this.phase = Math.random() * Math.PI * 2;
        }

        update(t) {
            this.x += this.speedX;
            this.y += this.speedY + Math.sin(t * 0.001 + this.phase) * 0.1;

            if (this.x < -20 || this.x > width + 20 ||
                this.y < -20 || this.y > height + 20) {
                this.reset();
            }
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(139, 92, 246, ${this.opacity})`;
            ctx.fill();
        }
    }

    // ---- INITIALIZATION ----
    function init() {
        // Create nodes with varied depths
        nodes = [];
        for (let i = 0; i < CONFIG.nodeCount; i++) {
            const depth = 0.3 + Math.random() * 0.7;
            const x = 100 + Math.random() * (width - 200);
            const y = 100 + Math.random() * (height - 200);
            nodes.push(new Node(x, y, depth));
        }

        // Sort by depth (far nodes rendered first)
        nodes.sort((a, b) => a.depth - b.depth);

        // Create connections between nearby nodes
        connections = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONFIG.connectionDistance) {
                    connections.push([nodes[i], nodes[j]]);
                }
            }
        }

        // Create pulses for connections
        pulses = [];
        connections.forEach(([a, b]) => {
            pulses.push(new Pulse(a, b));
            if (Math.random() > 0.5) {
                pulses.push(new Pulse(b, a)); // Bidirectional for some
            }
        });

        // Create background particles
        particles = [];
        for (let i = 0; i < CONFIG.particleCount; i++) {
            particles.push(new Particle());
        }
    }

    // ---- DRAW CONNECTIONS ----
    function drawConnections(ctx) {
        connections.forEach(([nodeA, nodeB]) => {
            const avgDepth = (nodeA.depth + nodeB.depth) / 2;
            const opacity = 0.08 + avgDepth * 0.08;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
            ctx.lineWidth = 1 + avgDepth * 0.5;
            ctx.stroke();

            // Subtle glow for active connections
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity * 0.3})`;
            ctx.lineWidth = 3 + avgDepth;
            ctx.stroke();

            ctx.restore();
        });
    }

    // ---- ANIMATION LOOP ----
    function animate() {
        time++;

        ctx.clearRect(0, 0, width, height);

        // Draw particles (background layer)
        particles.forEach(p => {
            p.update(time);
            p.draw(ctx);
        });

        // Update connections dynamically
        connections = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONFIG.connectionDistance) {
                    connections.push([nodes[i], nodes[j]]);
                }
            }
        }

        // Draw connections
        drawConnections(ctx);

        // Update and draw pulses
        pulses.forEach(p => {
            p.update();
            p.draw(ctx);
        });

        // Update and draw nodes (sorted by depth)
        nodes.forEach(n => {
            n.update(time);
            n.draw(ctx);
        });

        requestAnimationFrame(animate);
    }

    // ---- MOUSE TRACKING ----
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // ---- CARD HOVER INTERACTION ----
    const cards = document.querySelectorAll('.wf-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            // Intensify nearby nodes
            const rect = card.getBoundingClientRect();
            const cardCenterX = rect.left + rect.width / 2;
            const cardCenterY = rect.top + rect.height / 2;

            nodes.forEach(node => {
                const dx = node.x - cardCenterX;
                const dy = node.y - cardCenterY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 250) {
                    node.glowIntensity = 0.9;
                }
            });
        });
    });

    // ---- START ----
    window.addEventListener('resize', resize);
    resize();
    animate();

})();
