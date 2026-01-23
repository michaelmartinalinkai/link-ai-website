// ========================================
// QUIZ POPUP - 2 QUESTIONS + CONTACT
// ========================================

(function () {
    // Direct webhook to n8n workflow
    const WEBHOOK_URL = 'https://linkai020.app.n8n.cloud/webhook/lead-quiz';

    // Quiz answers storage
    const answers = {
        ai_interest: '',
        urgency: '',
        name: '',
        email: '',
        phone: ''
    };

    let currentStep = 1;

    // Build popup HTML - 3 steps only
    const html = `
    <div class="quiz-overlay" id="quizOverlay">
        <div class="quiz-modal">
            <button class="quiz-close" onclick="closeQuiz()">&times;</button>
            
            <!-- Progress -->
            <div class="quiz-progress" id="quizProgress">
                <div class="quiz-dot active" data-step="1"></div>
                <div class="quiz-dot" data-step="2"></div>
                <div class="quiz-dot" data-step="3"></div>
            </div>
            
            <!-- Step 1: AI Interest -->
            <div class="quiz-step active" data-step="1">
                <h2 class="quiz-question">What AI solution interests you most?</h2>
                <div class="quiz-options">
                    <div class="quiz-option" onclick="answer(1, 'ai_interest', 'chatbot')">
                        <span class="quiz-option-letter">A</span>
                        <span>AI Chatbot or Voice Agent</span>
                    </div>
                    <div class="quiz-option" onclick="answer(1, 'ai_interest', 'automation')">
                        <span class="quiz-option-letter">B</span>
                        <span>Workflow Automation</span>
                    </div>
                    <div class="quiz-option" onclick="answer(1, 'ai_interest', 'full_system')">
                        <span class="quiz-option-letter">C</span>
                        <span>Complete AI System</span>
                    </div>
                </div>
            </div>
            
            <!-- Step 2: Urgency -->
            <div class="quiz-step" data-step="2">
                <h2 class="quiz-question">When do you want to get started?</h2>
                <div class="quiz-options">
                    <div class="quiz-option" onclick="answer(2, 'urgency', 'asap')">
                        <span class="quiz-option-letter">A</span>
                        <span>ASAP - this is urgent</span>
                    </div>
                    <div class="quiz-option" onclick="answer(2, 'urgency', 'soon')">
                        <span class="quiz-option-letter">B</span>
                        <span>Within 1-3 months</span>
                    </div>
                    <div class="quiz-option" onclick="answer(2, 'urgency', 'exploring')">
                        <span class="quiz-option-letter">C</span>
                        <span>Just exploring options</span>
                    </div>
                </div>
            </div>
            
            <!-- Step 3: Contact -->
            <div class="quiz-step" data-step="3">
                <h2 class="quiz-question">Where can we reach you?</h2>
                <form class="quiz-form" id="quizForm" onsubmit="submitQuiz(event)">
                    <div class="quiz-input">
                        <label>Name *</label>
                        <input type="text" id="qName" placeholder="Your name" required>
                    </div>
                    <div class="quiz-input">
                        <label>Email *</label>
                        <input type="email" id="qEmail" placeholder="you@company.com" required>
                    </div>
                    <div class="quiz-input">
                        <label>Phone</label>
                        <input type="tel" id="qPhone" placeholder="+31 6 12345678">
                    </div>
                    <button type="submit" class="quiz-submit" id="quizSubmit">
                        Get Free Consultation →
                    </button>
                </form>
            </div>
            
            <!-- Success -->
            <div class="quiz-step" data-step="success">
                <div class="quiz-success">
                    <div class="quiz-success-icon">✓</div>
                    <h2>Thank you!</h2>
                    <p>We'll be in touch within 24 hours.</p>
                </div>
            </div>
        </div>
    </div>
    `;

    // Inject
    document.body.insertAdjacentHTML('beforeend', html);

    // Open quiz
    window.openQuiz = function () {
        document.getElementById('quizOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // Close quiz
    window.closeQuiz = function () {
        document.getElementById('quizOverlay').classList.remove('active');
        document.body.style.overflow = '';
        sessionStorage.setItem('quizShown', 'true');
    };

    // Answer selection
    window.answer = function (step, key, value) {
        answers[key] = value;

        // Visual feedback
        const stepEl = document.querySelector(`.quiz-step[data-step="${step}"]`);
        stepEl.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
        event.currentTarget.classList.add('selected');

        // Next step after delay
        setTimeout(() => goToStep(step + 1), 300);
    };

    // Go to step
    function goToStep(step) {
        currentStep = step;

        // Hide all
        document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));

        // Show target
        const target = document.querySelector(`.quiz-step[data-step="${step}"]`) ||
            document.querySelector('.quiz-step[data-step="success"]');
        if (target) target.classList.add('active');

        // Update dots
        document.querySelectorAll('.quiz-dot').forEach(d => {
            const ds = parseInt(d.dataset.step);
            d.classList.remove('active', 'done');
            if (ds === step) d.classList.add('active');
            if (ds < step) d.classList.add('done');
        });
    }

    // Submit
    window.submitQuiz = async function (e) {
        e.preventDefault();

        const btn = document.getElementById('quizSubmit');
        btn.disabled = true;
        btn.textContent = 'Sending...';

        answers.name = document.getElementById('qName').value;
        answers.email = document.getElementById('qEmail').value;
        answers.phone = document.getElementById('qPhone').value || '';

        const payload = {
            fullName: answers.name,
            emailAddress: answers.email,
            phoneNumber: answers.phone,
            companyName: '',
            helpWith: `Interest: ${answers.ai_interest}, Timeline: ${answers.urgency}`,
            ai_interest: answers.ai_interest,
            urgency: answers.urgency,
            source: 'website_quiz',
            completed_at: new Date().toISOString()
        };

        try {
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.log('Quiz submit:', err);
        }

        // Always show success
        goToStep('success');

        // Close after 3s
        setTimeout(() => {
            closeQuiz();
            document.getElementById('quizForm').reset();
            document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
            goToStep(1);
            btn.disabled = false;
            btn.textContent = 'Get Free Consultation →';
        }, 3000);
    };

    // ESC to close
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeQuiz();
    });

    // Click overlay to close
    document.getElementById('quizOverlay').addEventListener('click', e => {
        if (e.target.id === 'quizOverlay') closeQuiz();
    });

    // Auto-open after 10 seconds (once per session)
    setTimeout(() => {
        if (!sessionStorage.getItem('quizShown')) {
            openQuiz();
        }
    }, 10000);

})();
