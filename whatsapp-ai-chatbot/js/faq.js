/**
 * FAQ Section Interactions: Accordion Logic + Viewport Animation
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Accordion Logic
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        item.addEventListener('click', () => {
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    const answer = otherItem.querySelector('.faq-full-answer');
                    if (answer) answer.style.maxHeight = null;
                }
            });

            // Toggle clicked item
            item.classList.toggle('active');

            // Animate height
            const answer = item.querySelector('.faq-full-answer');
            if (item.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + "px";
            } else {
                answer.style.maxHeight = null;
            }
        });
    });

    // 2. Viewport Animation (Intersection Observer)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Animate once
            }
        });
    }, observerOptions);

    // Observe container elements
    const elementsToAnimate = document.querySelectorAll('.faq-container, .faq-item, .faq-cta');
    elementsToAnimate.forEach((el, index) => {
        el.classList.add('faq-animate-in');
        // Add staggered delay via inline style if needed, or handle in CSS with :nth-child
        el.style.transitionDelay = `${index * 50}ms`;
        observer.observe(el);
    });
});
