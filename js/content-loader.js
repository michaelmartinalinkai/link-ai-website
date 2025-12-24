/**
 * CMS Content Loader - Production Version
 * Uses embedded content OR localStorage (for preview mode)
 */
(function () {
    'use strict';

    // Check if we're in preview mode
    const urlParams = new URLSearchParams(window.location.search);
    const isPreview = urlParams.get('preview') === 'true';

    // EMBEDDED CONTENT - This gets replaced during export
    // START_CMS_CONTENT
    const EMBEDDED_CONTENT = null;
    // END_CMS_CONTENT

    // Determine which content to use
    let content;

    if (isPreview) {
        // Preview mode: use draft from localStorage
        const savedDraft = localStorage.getItem('cms_draft');
        if (savedDraft) {
            content = JSON.parse(savedDraft);
            showPreviewBanner();
        } else {
            console.log('CMS: No draft found for preview');
            return;
        }
    } else if (EMBEDDED_CONTENT) {
        // Production: use embedded content
        content = EMBEDDED_CONTENT;
    } else {
        // Fallback: try published localStorage
        const savedPublished = localStorage.getItem('cms_published');
        if (savedPublished) {
            content = JSON.parse(savedPublished);
        } else {
            console.log('CMS: No content found, using defaults');
            return;
        }
    }

    console.log('CMS: Loading content', isPreview ? '(preview mode)' : '(live)');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => applyContent(content));
    } else {
        applyContent(content);
    }

    function applyContent(content) {
        // ==========================================
        // HOME PAGE - HERO SECTION
        // ==========================================
        if (content.home?.hero) {
            const hero = content.home.hero;

            // Eyebrow text (LINK AI AGENCY)
            const eyebrow = document.querySelector('.hero-label');
            if (eyebrow && hero.eyebrowText) {
                eyebrow.textContent = hero.eyebrowText;
            }

            // Main headline
            const titleSpans = document.querySelectorAll('.hero-title span');
            if (titleSpans.length >= 2 && hero.headline) {
                // Split headline into two lines if it contains a period
                const parts = hero.headline.split('. ');
                if (parts.length >= 2) {
                    titleSpans[0].textContent = parts[0] + '.';
                    titleSpans[1].textContent = parts[1];
                } else {
                    titleSpans[0].textContent = hero.headline;
                    titleSpans[1].textContent = '';
                }
            }

            // Subheadline
            const subtitle = document.querySelector('.hero-subtitle');
            if (subtitle && hero.subheadline) {
                subtitle.textContent = hero.subheadline;
            }

            // Primary button
            const primaryBtn = document.querySelector('.hero-actions .hero-btn:first-child');
            if (primaryBtn && hero.primaryButtonLabel) {
                primaryBtn.textContent = hero.primaryButtonLabel;
            }

            // Secondary button
            const secondaryBtn = document.querySelector('.hero-actions .hero-btn:last-child');
            if (secondaryBtn && hero.secondaryButtonLabel) {
                secondaryBtn.textContent = hero.secondaryButtonLabel;
            }

            // Hero background media
            if (hero.mediaMode === 'image' && hero.backgroundImage) {
                const video = document.getElementById('hero-video-bg');
                if (video) {
                    video.style.display = 'none';
                }
                // Create/update background image
                let bgImg = document.querySelector('.hero-bg-image');
                if (!bgImg) {
                    bgImg = document.createElement('img');
                    bgImg.className = 'hero-bg-image';
                    bgImg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:-1;';
                    const heroSection = document.querySelector('.hero-section');
                    if (heroSection) heroSection.insertBefore(bgImg, heroSection.firstChild);
                }
                bgImg.src = hero.backgroundImage;
            }
        }

        // ==========================================
        // NAVIGATION LABELS
        // ==========================================
        if (content.home?.nav) {
            const nav = content.home.nav;
            const navLinks = document.querySelectorAll('.nav-links .nav-btn');

            if (navLinks[0] && nav.servicesLabel) {
                navLinks[0].textContent = nav.servicesLabel;
            }
            if (navLinks[1] && nav.processLabel) {
                navLinks[1].textContent = nav.processLabel;
            }
            if (navLinks[2] && nav.contactLabel) {
                navLinks[2].textContent = nav.contactLabel;
            }
        }

        // ==========================================
        // SERVICES SECTION
        // ==========================================
        if (content.services?.cards) {
            const serviceCards = document.querySelectorAll('.svc-card');
            content.services.cards.forEach((card, index) => {
                if (serviceCards[index]) {
                    const cardEl = serviceCards[index];

                    // Title
                    const title = cardEl.querySelector('.svc-text h3');
                    if (title && card.title) {
                        title.textContent = card.title;
                    }

                    // Subtitle/description
                    const subtitle = cardEl.querySelector('.svc-text p');
                    if (subtitle && card.subtitle) {
                        subtitle.textContent = card.subtitle;
                    }

                    // Image (only update if it's a data URL or different)
                    const img = cardEl.querySelector('.svc-media img');
                    if (img && card.image && card.image.startsWith('data:')) {
                        img.src = card.image;
                        if (card.imageAlt) img.alt = card.imageAlt;
                    }
                }
            });
        }

        // ==========================================
        // PROCESS SECTION
        // ==========================================
        if (content.process?.steps) {
            const processSteps = document.querySelectorAll('.proc-step');
            content.process.steps.forEach((step, index) => {
                if (processSteps[index]) {
                    const stepEl = processSteps[index];

                    const title = stepEl.querySelector('.proc-name');
                    if (title && step.title) {
                        title.textContent = step.title;
                    }

                    const desc = stepEl.querySelector('.proc-desc');
                    if (desc && step.description) {
                        desc.textContent = step.description;
                    }
                }
            });
        }

        // ==========================================
        // CONTACT/CTA SECTION
        // ==========================================
        if (content.contact) {
            const contact = content.contact;

            // Title
            const ctaTitle = document.querySelector('.final-titleFill');
            if (ctaTitle && contact.title) {
                ctaTitle.textContent = contact.title;
                // Also update the glow version
                const ctaTitleGlow = document.querySelector('.final-titleGlow');
                if (ctaTitleGlow) ctaTitleGlow.textContent = contact.title;
            }

            // Subtitle
            const ctaSub = document.querySelector('.final-sub');
            if (ctaSub && contact.subtitle) {
                ctaSub.textContent = contact.subtitle;
            }

            // CTA button label
            const ctaBtn = document.querySelector('.final-btnLabel');
            if (ctaBtn && contact.ctaLabel) {
                ctaBtn.textContent = contact.ctaLabel;
            }
        }

        console.log('CMS: Content applied successfully');
    }

    function showPreviewBanner() {
        const banner = document.createElement('div');
        banner.id = 'cms-preview-banner';
        banner.innerHTML = `
            <span>🔍 PREVIEW MODE - Changes not yet published</span>
            <a href="${window.location.pathname}" style="color:white;margin-left:20px;text-decoration:underline;">Exit Preview</a>
        `;
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(90deg, #7c3aed, #5b21b6);
            color: white;
            text-align: center;
            padding: 10px;
            z-index: 99999;
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            font-weight: 600;
        `;
        document.body.insertBefore(banner, document.body.firstChild);
        document.body.style.paddingTop = '40px';
    }
})();
