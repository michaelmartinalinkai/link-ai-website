document.addEventListener('DOMContentLoaded', () => {

    // Smooth Reveal Animation
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Select elements to animate
    const animatedElements = document.querySelectorAll('.hero-title, .hero-sub, .hero-buttons, .section h2, .glass-card, .process-step, .cta-section .btn');

    animatedElements.forEach((el, index) => {
        el.classList.add('fade-in-up');
        // Add random slight delays for natural feel
        el.style.transitionDelay = `${index % 3 * 0.1}s`;
        observer.observe(el);
    });


    // Services Grid Interactions
    (function () {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) return;

        // Add overlays for chatbots and voice agents if they don't exist
        document.querySelectorAll(".svc-card.is-chatbots .svc-media").forEach((m) => {
            if (m.querySelector(".svc-typing")) return;
            const t = document.createElement("div");
            t.className = "svc-typing";
            t.innerHTML = "<span></span><span></span><span></span>";
            m.appendChild(t);
        });

        document.querySelectorAll(".svc-card.is-voice .svc-media").forEach((m) => {
            if (m.querySelector(".svc-eq")) return;
            const eq = document.createElement("div");
            eq.className = "svc-eq";
            eq.innerHTML =
                "<span></span><span></span><span></span><span></span>" +
                "<span></span><span></span><span></span><span></span>";
            m.appendChild(eq);
        });

        // 3D Tilt Effect
        document.querySelectorAll(".svc-card").forEach((card) => {
            const media = card.querySelector(".svc-media");
            if (!media) return;

            card.addEventListener("mousemove", (e) => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;

                media.style.transform =
                    "translateZ(0) rotateX(" + (-y * 3) + "deg) rotateY(" + (x * 4) + "deg)";
            });

            card.addEventListener("mouseleave", () => {
                media.style.transform = "translateZ(0)";
            });
        });
    })();

});
 
(function(){
    const steps = Array.from(
      document.querySelectorAll('.proc-step')
    );
    const bar = document.querySelector('.proc-railProgress');
    if(!steps.length || !bar) return;

    const setActive = (idx) => {
      steps.forEach((b, i) => {
        const active = i === idx;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      // 4 steps => widths: 0%, 33%, 66%, 100%
      const w = (idx / (steps.length - 1)) * 100;
      bar.style.width = w + '%';
    };

    steps.forEach((btn, i) => {
      btn.addEventListener('mouseenter', () => setActive(i));
      btn.addEventListener('focus', () => setActive(i));
      btn.addEventListener('click', () => setActive(i));
    });

    setActive(0);
  })();
 
(function(){
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce) return;

    const el = document.querySelector('.final-wrap');
    if(!el) return;

    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';

    const io = new IntersectionObserver((entries)=>{
      entries.forEach((e)=>{
        if(!e.isIntersecting) return;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0px)';
        io.disconnect();
      });
    }, { threshold: 0.25 });

    io.observe(el);
  })();
