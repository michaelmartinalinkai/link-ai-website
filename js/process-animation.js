/**
 * PROCESS SECTION - PREMIUM TECHNICAL ANIMATION
 * 1. Canvas Background: "System Blueprint" (Nodes, Lines, Circuits)
 * 2. Progress Line Interaction: Hover cards -> Fill line to node
 */

(function () {
    // --- 1. CANVAS BACKGROUND (Blueprint) ---
    const canvas = document.getElementById('proc-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width, height;

    function resize() {
        width = canvas.width = canvas.parentElement.offsetWidth;
        height = canvas.height = canvas.parentElement.offsetHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Technical Particles (Nodes in a system)
    class TechNode {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.3; // Slow technical movement
            this.vy = (Math.random() - 0.5) * 0.3;
            this.size = Math.random() * 2 + 1;
            this.maxConnectDist = 150;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce check
            if (this.x < 0 || this.x > width) this.vx *= -1;
            if (this.y < 0 || this.y > height) this.vy *= -1;
        }

        draw() {
            ctx.fillStyle = 'rgba(167, 139, 250, 0.3)'; // Soft purple
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const nodes = Array.from({ length: 40 }, () => new TechNode());

    // Grid / Circuit Pattern Overlay (Static or very slow fade)
    function drawGrid() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        const gridSize = 100;

        ctx.beginPath();
        for (let x = 0; x <= width; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        // Draw Technical Grid
        drawGrid();

        // Update & Draw Nodes + Connections
        nodes.forEach((node, i) => {
            node.update();
            node.draw();

            // Connect nearby nodes
            for (let j = i + 1; j < nodes.length; j++) {
                const other = nodes[j];
                const dx = node.x - other.x;
                const dy = node.y - other.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < node.maxConnectDist) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 * (1 - dist / node.maxConnectDist)})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(node.x, node.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.stroke();
                }
            }
        });

        requestAnimationFrame(animate);
    }
    animate();


    // --- 2. PROGRESS LINE INTERACTION ---
    const steps = document.querySelectorAll('.proc-step');
    const nodesEl = document.querySelectorAll('.proc-node');
    const fillLine = document.getElementById('proc-line-fill');

    if (!steps.length || !nodesEl.length || !fillLine) return;

    // Reset state
    function resetProgress() {
        fillLine.style.width = '0%';
        nodesEl.forEach(n => n.classList.remove('active'));
    }

    steps.forEach(step => {
        step.addEventListener('mouseenter', () => {
            const stepNum = parseInt(step.getAttribute('data-step'));

            // Calculate width percentage based on step number (1=0%, 4=100% roughly or exact segments)
            // Visual logic: 4 steps. 
            // Step 1 node position ~0% (or left align). 
            // Let's assume nodes are distributed 0, 33%, 66%, 100% physically? 
            // CSS just says "space-between", so 0%, 33%, 66%, 100% is correct for 4 items.

            let percent = 0;
            if (stepNum === 1) percent = 10; // Light up first bit
            if (stepNum === 2) percent = 45;
            if (stepNum === 3) percent = 70; // rough approx for visual centering
            if (stepNum === 4) percent = 100;

            fillLine.style.width = `${percent}%`;

            // Activate nodes up to this step
            nodesEl.forEach((n, idx) => {
                const nodeStep = idx + 1;
                if (nodeStep <= stepNum) {
                    n.classList.add('active');
                } else {
                    n.classList.remove('active');
                }
            });
        });

        step.addEventListener('mouseleave', () => {
            // Optional: keep last active or reset?
            // "On hover... fill lines". Usually implies reset on leave or stay.
            resetProgress();
        });
    });

})();
