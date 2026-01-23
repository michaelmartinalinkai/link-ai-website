// ========================================
// QUIZ POPUP - MULTI-STEP LEAD QUALIFIER
// ========================================

(function () {
    // n8n Form Webhook
    const WEBHOOK_URL = 'https://linkai020.app.n8n.cloud/form/693dd75a-c714-4625-9780-1dfb55f60885';

    // Quiz data storage
    let quizData = {
        interest: '',
        timeline: '',
        name: '',
        email: '',
        phone: ''
    };

    // Create popup HTML
    const quizHTML = `
        <div class="quiz-overlay" id="quizOverlay">
            <button class="quiz-close" onclick="closeQuiz()">&times;</button>
            
            <div class="quiz-container">
                <!-- Progress Dots -->
                <div class="quiz-progress">
                    <div class="quiz-progress-dot active" data-step="1"></div>
                    <div class="quiz-progress-dot" data-step="2"></div>
                    <div class="quiz-progress-dot" data-step="3"></div>
                </div>
                
                <!-- Step 1: Interest -->
                <div class="quiz-step active" data-step="1">
                    <h2 class="quiz-question">Waar kunnen we je mee helpen?</h2>
                    <p class="quiz-subtitle">Kies wat het beste bij je past</p>
                    
                    <div class="quiz-options">
                        <div class="quiz-option" onclick="selectOption(1, 'AI Chatbot / Voice Agent', this)">
                            <span class="quiz-option-icon">🤖</span>
                            <span>AI Chatbot of Voice Agent</span>
                        </div>
                        <div class="quiz-option" onclick="selectOption(1, 'Workflow Automation', this)">
                            <span class="quiz-option-icon">⚡</span>
                            <span>Workflow Automatisering</span>
                        </div>
                        <div class="quiz-option" onclick="selectOption(1, 'AI Content / Visuals', this)">
                            <span class="quiz-option-icon">🎨</span>
                            <span>AI Content & Visuals</span>
                        </div>
                        <div class="quiz-option" onclick="selectOption(1, 'Full AI System', this)">
                            <span class="quiz-option-icon">🚀</span>
                            <span>Compleet AI Systeem</span>
                        </div>
                    </div>
                </div>
                
                <!-- Step 2: Timeline -->
                <div class="quiz-step" data-step="2">
                    <h2 class="quiz-question">Wanneer wil je starten?</h2>
                    <p class="quiz-subtitle">Dit helpt ons om je beter te helpen</p>
                    
                    <div class="quiz-options">
                        <div class="quiz-option" onclick="selectOption(2, 'Zo snel mogelijk', this)">
                            <span class="quiz-option-icon">🔥</span>
                            <span>Zo snel mogelijk</span>
                        </div>
                        <div class="quiz-option" onclick="selectOption(2, 'Binnen 1 maand', this)">
                            <span class="quiz-option-icon">📅</span>
                            <span>Binnen 1 maand</span>
                        </div>
                        <div class="quiz-option" onclick="selectOption(2, 'Binnen 3 maanden', this)">
                            <span class="quiz-option-icon">🗓️</span>
                            <span>Binnen 3 maanden</span>
                        </div>
                        <div class="quiz-option" onclick="selectOption(2, 'Alleen oriënteren', this)">
                            <span class="quiz-option-icon">🔍</span>
                            <span>Ik oriënteer me nog</span>
                        </div>
                    </div>
                </div>
                
                <!-- Step 3: Contact Info -->
                <div class="quiz-step" data-step="3">
                    <h2 class="quiz-question">Bijna klaar!</h2>
                    <p class="quiz-subtitle">Vul je gegevens in voor een gratis adviesgesprek</p>
                    
                    <form class="quiz-form" id="quizForm" onsubmit="submitQuiz(event)">
                        <div class="quiz-input-group">
                            <label>Naam *</label>
                            <input type="text" id="quizName" placeholder="Je naam" required>
                        </div>
                        <div class="quiz-input-group">
                            <label>Email *</label>
                            <input type="email" id="quizEmail" placeholder="email@bedrijf.nl" required>
                        </div>
                        <div class="quiz-input-group">
                            <label>Telefoon</label>
                            <input type="tel" id="quizPhone" placeholder="+31 6 12345678">
                        </div>
                        <button type="submit" class="quiz-submit" id="quizSubmit">
                            Vraag Gratis Advies Aan →
                        </button>
                    </form>
                </div>
                
                <!-- Success -->
                <div class="quiz-step" data-step="success">
                    <div class="quiz-success">
                        <div class="quiz-success-icon">✅</div>
                        <h2>Bedankt!</h2>
                        <p>We nemen binnen 24 uur contact met je op.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Inject into page
    document.body.insertAdjacentHTML('beforeend', quizHTML);

    let currentStep = 1;

    // Open quiz
    window.openQuiz = function () {
        document.getElementById('quizOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // Close quiz
    window.closeQuiz = function () {
        document.getElementById('quizOverlay').classList.remove('active');
        document.body.style.overflow = '';
        // Save to localStorage so it doesn't show again this session
        sessionStorage.setItem('quizClosed', 'true');
    };

    // Select option and go to next step
    window.selectOption = function (step, value, element) {
        // Store value
        if (step === 1) quizData.interest = value;
        if (step === 2) quizData.timeline = value;

        // Visual feedback
        const options = element.parentElement.querySelectorAll('.quiz-option');
        options.forEach(opt => opt.classList.remove('selected'));
        element.classList.add('selected');

        // Go to next step after short delay
        setTimeout(() => goToStep(step + 1), 300);
    };

    // Go to specific step
    function goToStep(step) {
        currentStep = step;

        // Hide all steps
        document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));

        // Show current step
        const targetStep = document.querySelector(`.quiz-step[data-step="${step}"]`) ||
            document.querySelector(`.quiz-step[data-step="success"]`);
        if (targetStep) targetStep.classList.add('active');

        // Update progress dots
        document.querySelectorAll('.quiz-progress-dot').forEach(dot => {
            const dotStep = parseInt(dot.dataset.step);
            dot.classList.remove('active', 'completed');
            if (dotStep === step) dot.classList.add('active');
            if (dotStep < step) dot.classList.add('completed');
        });
    }

    // Submit quiz
    window.submitQuiz = async function (e) {
        e.preventDefault();

        const submitBtn = document.getElementById('quizSubmit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verzenden...';

        quizData.name = document.getElementById('quizName').value;
        quizData.email = document.getElementById('quizEmail').value;
        quizData.phone = document.getElementById('quizPhone').value;

        // Prepare payload for n8n
        const payload = {
            fullName: quizData.name,
            emailAddress: quizData.email,
            phoneNumber: quizData.phone,
            companyName: 'Via Quiz',
            companySize: '',
            helpWith: `Interesse: ${quizData.interest}. Timeline: ${quizData.timeline}`,
            source: 'website_quiz',
            quiz_interest: quizData.interest,
            quiz_timeline: quizData.timeline,
            page: window.location.href
        };

        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Show success regardless (to give good UX)
            goToStep('success');

            // Close after 3 seconds
            setTimeout(() => {
                closeQuiz();
                // Reset form
                document.getElementById('quizForm').reset();
                goToStep(1);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Vraag Gratis Advies Aan →';
            }, 3000);

        } catch (error) {
            console.error('Quiz error:', error);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Vraag Gratis Advies Aan →';
            alert('Er ging iets mis. Probeer het opnieuw.');
        }
    };

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeQuiz();
    });

    // Close on overlay click
    document.getElementById('quizOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'quizOverlay') closeQuiz();
    });

    // Auto-open after 5 seconds (only once per session)
    setTimeout(() => {
        if (!sessionStorage.getItem('quizClosed')) {
            openQuiz();
        }
    }, 5000);

})();
