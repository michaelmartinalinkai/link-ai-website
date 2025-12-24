document.addEventListener('DOMContentLoaded', () => {
    // Select all video elements on the page
    const videos = document.querySelectorAll('video');

    if (videos.length > 1) {
        // Sync videos: when one plays, ensure others are playing or sync their times
        const masterVideo = videos[0];

        // Helper to sync play
        const syncPlay = () => {
            videos.forEach(v => {
                if (v !== masterVideo && v.paused) {
                    v.currentTime = masterVideo.currentTime;
                    v.play().catch(() => { });
                }
            });
        };

        // Helper to sync pause
        const syncPause = () => {
            videos.forEach(v => {
                if (v !== masterVideo && !v.paused) {
                    v.pause();
                }
            });
        };

        masterVideo.addEventListener('play', syncPlay);
        masterVideo.addEventListener('pause', syncPause);

        // On user seek, sync time
        masterVideo.addEventListener('seeked', () => {
            videos.forEach(v => {
                if (v !== masterVideo) {
                    v.currentTime = masterVideo.currentTime;
                }
            });
        });

        // Ensure both strive to play initially
        videos.forEach(v => {
            v.muted = true; // Required for autoplay
            v.play().catch(() => { });
        });
    }

    // ===== VIDEO LIGHTBOX =====
    // Create lightbox modal
    const lightbox = document.createElement('div');
    lightbox.id = 'video-lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-overlay"></div>
        <div class="lightbox-content">
            <button class="lightbox-close">&times;</button>
            <video id="lightbox-video" controls playsinline>
                <source src="" type="video/mp4">
            </video>
        </div>
    `;
    document.body.appendChild(lightbox);

    // Add lightbox styles
    const style = document.createElement('style');
    style.textContent = `
        #video-lightbox {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            align-items: center;
            justify-content: center;
        }
        #video-lightbox.active {
            display: flex;
        }
        .lightbox-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            cursor: pointer;
        }
        .lightbox-content {
            position: relative;
            z-index: 10001;
            max-width: 90vw;
            max-height: 80vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #lightbox-video {
            max-width: 100%;
            max-height: 70vh;
            width: auto;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        .lightbox-close {
            position: absolute;
            top: -40px;
            right: -10px;
            background: none;
            border: none;
            color: white;
            font-size: 2.5rem;
            cursor: pointer;
            opacity: 0.8;
            transition: opacity 0.2s;
        }
        .lightbox-close:hover {
            opacity: 1;
        }
        .media-item video {
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    const lightboxVideo = document.getElementById('lightbox-video');
    const lightboxOverlay = lightbox.querySelector('.lightbox-overlay');
    const lightboxClose = lightbox.querySelector('.lightbox-close');

    // Open lightbox on media-item click (for video items)
    document.querySelectorAll('.media-item').forEach(item => {
        const video = item.querySelector('video');
        if (video) {
            item.addEventListener('click', (e) => {
                const source = video.querySelector('source');
                if (source) {
                    lightboxVideo.querySelector('source').src = source.src;
                    lightboxVideo.load();
                    lightboxVideo.play();
                    lightbox.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
        }
    });

    // Close lightbox
    const closeLightbox = () => {
        lightbox.classList.remove('active');
        lightboxVideo.pause();
        document.body.style.overflow = '';
    };

    lightboxOverlay.addEventListener('click', closeLightbox);
    lightboxClose.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });
});
