// Lead Form Popup Script
(function () {
    // n8n Form Webhook URL
    const WEBHOOK_URL = 'https://linkai020.app.n8n.cloud/form/693dd75a-c714-4625-9780-1dfb55f60885';

    // Create popup HTML
    const popupHTML = `
        <div class="lead-popup-overlay" id="leadPopupOverlay">
            <div class="lead-popup">
                <button class="lead-popup-close" onclick="closeLeadPopup()">&times;</button>
                <div id="leadFormContent">
                    <h2>Get a Free Consultation</h2>
                    <p class="subtitle">Fill out this form and we'll get back to you within 24 hours</p>
                    <form id="leadForm">
                        <div class="lead-form-group">
                            <label for="fullName">Full Name *</label>
                            <input type="text" id="fullName" name="fullName" placeholder="John Doe" required>
                        </div>
                        <div class="lead-form-group">
                            <label for="emailAddress">Email Address *</label>
                            <input type="email" id="emailAddress" name="emailAddress" placeholder="john@company.com" required>
                        </div>
                        <div class="lead-form-group">
                            <label for="companyName">Company Name *</label>
                            <input type="text" id="companyName" name="companyName" placeholder="Your Company" required>
                        </div>
                        <div class="lead-form-group">
                            <label for="phoneNumber">Phone Number</label>
                            <input type="tel" id="phoneNumber" name="phoneNumber" placeholder="+31 6 12345678">
                        </div>
                        <div class="lead-form-group">
                            <label for="companySize">Company Size</label>
                            <select id="companySize" name="companySize">
                                <option value="">Select...</option>
                                <option value="1-10 employees">1-10 employees</option>
                                <option value="11-50 employees">11-50 employees</option>
                                <option value="51-200 employees">51-200 employees</option>
                                <option value="201-500 employees">201-500 employees</option>
                                <option value="500+ employees">500+ employees</option>
                            </select>
                        </div>
                        <div class="lead-form-group">
                            <label for="helpWith">What are you looking for help with? *</label>
                            <textarea id="helpWith" name="helpWith" placeholder="Tell us about your project or challenge..." required></textarea>
                        </div>
                        <button type="submit" class="lead-form-submit" id="leadFormSubmit">
                            Send Request
                        </button>
                    </form>
                </div>
                <div id="leadFormSuccess" class="lead-form-success" style="display: none;">
                    <h3>✓ Thank You!</h3>
                    <p>We'll review your information and get back to you soon.</p>
                </div>
            </div>
        </div>
        
        <button class="lead-popup-trigger" onclick="openLeadPopup()">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Free Consultation
        </button>
    `;

    // Inject popup into page
    document.body.insertAdjacentHTML('beforeend', popupHTML);

    // Open popup
    window.openLeadPopup = function () {
        document.getElementById('leadPopupOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // Close popup
    window.closeLeadPopup = function () {
        document.getElementById('leadPopupOverlay').classList.remove('active');
        document.body.style.overflow = '';
    };

    // Close on overlay click
    document.getElementById('leadPopupOverlay').addEventListener('click', function (e) {
        if (e.target === this) closeLeadPopup();
    });

    // Close on ESC key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeLeadPopup();
    });

    // Form submission
    document.getElementById('leadForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = document.getElementById('leadFormSubmit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        const formData = {
            fullName: document.getElementById('fullName').value,
            emailAddress: document.getElementById('emailAddress').value,
            companyName: document.getElementById('companyName').value,
            phoneNumber: document.getElementById('phoneNumber').value,
            companySize: document.getElementById('companySize').value,
            helpWith: document.getElementById('helpWith').value,
            source: 'website_popup',
            page: window.location.href
        };

        try {
            // Submit to n8n webhook
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Show success
                document.getElementById('leadFormContent').style.display = 'none';
                document.getElementById('leadFormSuccess').style.display = 'block';

                // Close after 3 seconds
                setTimeout(function () {
                    closeLeadPopup();
                    // Reset form
                    document.getElementById('leadForm').reset();
                    document.getElementById('leadFormContent').style.display = 'block';
                    document.getElementById('leadFormSuccess').style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Send Request';
                }, 3000);
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Form error:', error);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Request';
            alert('Something went wrong. Please try again or contact us directly.');
        }
    });

    // Auto-open after 30 seconds (optional)
    // setTimeout(openLeadPopup, 30000);
})();
