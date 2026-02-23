/* KPI Animations JS */

document.addEventListener('DOMContentLoaded', () => {
    const kpiSection = document.getElementById('costSection'); // We'll trigger when Cost Section is visible

    // Elements
    const revenueEl = document.getElementById('kpiRevenue');
    const leadsPercentEl = document.getElementById('kpiLeadsPercent');
    const salesPercentEl = document.getElementById('kpiSalesPercent');
    const outsidePercentEl = document.getElementById('kpiOutsidePercent');

    const leadsBar = document.getElementById('kpiLeadsBar');
    const salesBar = document.getElementById('kpiSalesBar');
    const outsideBar = document.getElementById('kpiOutsideBar');

    // Goals
    const TARGET_REVENUE = 7853;
    const TARGET_LEADS = 82;
    const TARGET_SALES = 91;
    const TARGET_OUTSIDE = 92;

    let hasPlayed = false;

    // Formatter
    const formatCurrency = (num) => {
        return num.toLocaleString('nl-NL'); // 7.853 formaat
    };

    // Animation Functions
    const animateValue = (obj, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Ease-out expo styling for smoother feel
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            const current = Math.floor(easeProgress * (end - start) + start);
            obj.innerHTML = formatCurrency(current);

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = formatCurrency(end);
            }
        };
        window.requestAnimationFrame(step);
    };

    const animatePercentage = (obj, end, duration, delay = 0) => {
        setTimeout(() => {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                // Ease-out
                const easeProgress = 1 - Math.pow(1 - progress, 3);

                const current = Math.floor(easeProgress * end);
                obj.innerText = current + '%';

                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        }, delay);
    };

    const animateBar = (bar, width, delay = 0) => {
        setTimeout(() => {
            bar.style.width = width + '%';
        }, delay);
    };

    // Continuous Loss Effect
    const startContinuousEffect = () => {
        // Increment revenue every 6 seconds
        let currentRev = TARGET_REVENUE;

        setInterval(() => {
            currentRev += 50;
            // Pulse Effect
            const card = document.querySelector('.kpi-main-card');
            const revText = document.querySelector('.kpi-revenue-value');

            revText.classList.add('kpi-pulse-red');
            setTimeout(() => {
                revText.classList.remove('kpi-pulse-red');
            }, 1500);

            // Animate number up cleanly
            animateValue(revenueEl, currentRev - 50, currentRev, 1000);

        }, 6000);

        // Pulse bars continuously
        setTimeout(() => {
            [leadsBar, salesBar, outsideBar].forEach(bar => {
                bar.classList.add('bar-pulse');
            });
        }, 4000); // Start after initial load
    };

    // Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasPlayed) {
                hasPlayed = true;

                // 1. Animate Revenue (3s)
                animateValue(revenueEl, 0, TARGET_REVENUE, 3000);

                // Add initial Pulse to revenue during count
                const revText = document.querySelector('.kpi-revenue-value');
                const pulseInterval = setInterval(() => {
                    revText.classList.add('kpi-pulse-red');
                    setTimeout(() => revText.classList.remove('kpi-pulse-red'), 1000);
                }, 1500);
                // Stop initial pulse logic after 3s
                setTimeout(() => clearInterval(pulseInterval), 3100);

                // 2. Animate percentages & Bars (Staggered)
                // Leads: 0 delay
                animatePercentage(leadsPercentEl, TARGET_LEADS, 2500, 400);
                animateBar(leadsBar, TARGET_LEADS, 400);

                // Sales: 0.4s delay + 0.4s stagger = 0.8s
                animatePercentage(salesPercentEl, TARGET_SALES, 2500, 800);
                animateBar(salesBar, TARGET_SALES, 800);

                // Outside: 0.8s delay + 0.4s stagger = 1.2s
                animatePercentage(outsidePercentEl, TARGET_OUTSIDE, 2500, 1200);
                animateBar(outsideBar, TARGET_OUTSIDE, 1200);

                // 3. Start Continuous Effect after initial animations done (~4s)
                setTimeout(startContinuousEffect, 4000);

                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    observer.observe(kpiSection);
});
