// Admin Panel JavaScript
(function () {
    'use strict';

    // State
    let content = {};
    let hasUnsavedChanges = false;
    let currentPage = 'home';

    // DOM Elements
    const navItems = document.querySelectorAll('.nav-item');
    const pageEditors = document.querySelectorAll('.page-editor');
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    const publishBtn = document.getElementById('publishBtn');
    const previewBtn = document.getElementById('previewBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userEmailSpan = document.getElementById('userEmail');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');

    // Initialize
    async function init() {
        await checkAuth();
        await loadContent();
        setupEventListeners();
        setupCharCounters();
    }

    // Check authentication
    async function checkAuth() {
        try {
            const res = await fetch('/api/auth/status');
            const data = await res.json();

            if (!data.authenticated) {
                window.location.href = '/login';
                return;
            }

            userEmailSpan.textContent = data.user.email;
        } catch (error) {
            window.location.href = '/login';
        }
    }

    // Load content
    async function loadContent() {
        try {
            const res = await fetch('/api/content/draft');
            content = await res.json();
            populateFields();
        } catch (error) {
            showNotification('Failed to load content', 'error');
        }
    }

    // Populate form fields with content
    function populateFields() {
        const fields = document.querySelectorAll('[data-field]');
        fields.forEach(field => {
            const path = field.dataset.field;
            const value = getNestedValue(content, path) || '';

            if (field.tagName === 'TEXTAREA') {
                field.value = value;
            } else {
                field.value = value;
            }

            updateCharCount(field);
        });
    }

    // Get nested value from object
    function getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) =>
            current && current[key] !== undefined ? current[key] : null, obj);
    }

    // Setup event listeners
    function setupEventListeners() {
        // Navigation
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                switchPage(page);
            });
        });

        // Field changes
        document.querySelectorAll('[data-field]').forEach(field => {
            field.addEventListener('input', () => {
                hasUnsavedChanges = true;
                updateCharCount(field);
            });
        });

        // Save draft
        saveDraftBtn.addEventListener('click', saveDraft);

        // Publish
        publishBtn.addEventListener('click', publish);

        // Preview
        previewBtn.addEventListener('click', () => {
            window.open('/preview', '_blank');
        });

        // Logout
        logoutBtn.addEventListener('click', logout);

        // Warn on unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Media library
        setupMediaLibrary();

        // History
        if (currentPage === 'history') {
            loadHistory();
        }
    }

    // Switch page
    function switchPage(page) {
        currentPage = page;

        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        pageEditors.forEach(editor => {
            editor.classList.toggle('hidden', editor.id !== `page-${page}`);
        });

        if (page === 'media') {
            loadMedia();
        } else if (page === 'history') {
            loadHistory();
        }
    }

    // Setup character counters
    function setupCharCounters() {
        document.querySelectorAll('[data-field]').forEach(field => {
            updateCharCount(field);
        });
    }

    // Update character count
    function updateCharCount(field) {
        const charCount = field.parentElement.querySelector('.char-count');
        if (charCount) {
            const max = field.maxLength || 999;
            charCount.textContent = `${field.value.length}/${max}`;
        }
    }

    // Save draft
    async function saveDraft() {
        const updates = {};

        document.querySelectorAll('[data-field]').forEach(field => {
            const path = field.dataset.field;
            const currentValue = getNestedValue(content, path);

            if (field.value !== currentValue) {
                updates[path] = field.value;
            }
        });

        if (Object.keys(updates).length === 0) {
            showNotification('No changes to save');
            return;
        }

        try {
            saveDraftBtn.disabled = true;
            saveDraftBtn.innerHTML = '<span>Saving...</span>';

            const res = await fetch('/api/content/draft', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                hasUnsavedChanges = false;
                showNotification('Draft saved successfully', 'success');
                await loadContent(); // Refresh content
            } else {
                showNotification(data.error || 'Failed to save', 'error');
            }
        } catch (error) {
            showNotification('Failed to save draft', 'error');
        } finally {
            saveDraftBtn.disabled = false;
            saveDraftBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Draft
            `;
        }
    }

    // Publish
    async function publish() {
        if (!confirm('Are you sure you want to publish? This will make the draft content live.')) {
            return;
        }

        // First save any pending changes
        if (hasUnsavedChanges) {
            await saveDraft();
        }

        try {
            publishBtn.disabled = true;
            publishBtn.innerHTML = '<span>Publishing...</span>';

            const res = await fetch('/api/content/publish', {
                method: 'POST'
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showNotification(`Published successfully (v${data.version})`, 'success');
            } else {
                showNotification(data.error || 'Failed to publish', 'error');
            }
        } catch (error) {
            showNotification('Failed to publish', 'error');
        } finally {
            publishBtn.disabled = false;
            publishBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Publish
            `;
        }
    }

    // Logout
    async function logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
        } catch (error) {
            showNotification('Failed to logout', 'error');
        }
    }

    // Show notification
    function showNotification(message, type = '') {
        notificationText.textContent = message;
        notification.className = 'notification';
        if (type) notification.classList.add(type);
        notification.classList.remove('hidden');

        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    // Media Library
    function setupMediaLibrary() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const altTextGroup = document.getElementById('altTextGroup');
        const uploadBtn = document.getElementById('uploadBtn');

        if (!uploadArea) return;

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#7c3aed';
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#ccc';
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ccc';
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                handleFileSelect();
            }
        });

        fileInput.addEventListener('change', handleFileSelect);

        function handleFileSelect() {
            if (fileInput.files.length) {
                altTextGroup.style.display = 'block';
            }
        }

        uploadBtn.addEventListener('click', async () => {
            const file = fileInput.files[0];
            const altText = document.getElementById('newAltText').value;

            if (!file) {
                showNotification('Please select a file', 'error');
                return;
            }

            if (!altText.trim()) {
                showNotification('Alt text is required', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('altText', altText);

            try {
                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Uploading...';

                const res = await fetch('/api/media/upload', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    showNotification('Image uploaded successfully', 'success');
                    fileInput.value = '';
                    document.getElementById('newAltText').value = '';
                    altTextGroup.style.display = 'none';
                    loadMedia();
                } else {
                    showNotification(data.error || 'Upload failed', 'error');
                }
            } catch (error) {
                showNotification('Upload failed', 'error');
            } finally {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload Image';
            }
        });
    }

    // Load media
    async function loadMedia() {
        const mediaGrid = document.getElementById('mediaGrid');
        if (!mediaGrid) return;

        try {
            const res = await fetch('/api/media');
            const media = await res.json();

            mediaGrid.innerHTML = media.map(item => `
                <div class="media-item">
                    <img src="/api/media/file/${item.filename}" alt="${item.alt_text}">
                    <div class="media-item-info">
                        <small>${item.original_name}</small>
                        <div class="alt-text">${item.alt_text}</div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            mediaGrid.innerHTML = '<p>Failed to load media</p>';
        }
    }

    // Load history
    async function loadHistory() {
        const historyTable = document.getElementById('historyTable');
        if (!historyTable) return;

        try {
            const res = await fetch('/api/content/versions');
            const versions = await res.json();

            historyTable.innerHTML = versions.map(v => `
                <tr>
                    <td>v${v.version}</td>
                    <td>${new Date(v.created_at).toLocaleString()}</td>
                    <td>${v.created_by || 'System'}</td>
                    <td>
                        <button class="btn btn-secondary" onclick="rollback(${v.version})">
                            Rollback
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            historyTable.innerHTML = '<tr><td colspan="4">Failed to load history</td></tr>';
        }
    }

    // Rollback (global function for onclick)
    window.rollback = async function (version) {
        if (!confirm(`Are you sure you want to rollback to version ${version}?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/content/rollback/${version}`, {
                method: 'POST'
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showNotification(`Rolled back to v${version}`, 'success');
                await loadContent();
                loadHistory();
            } else {
                showNotification(data.error || 'Rollback failed', 'error');
            }
        } catch (error) {
            showNotification('Rollback failed', 'error');
        }
    };

    // Start
    init();
})();
