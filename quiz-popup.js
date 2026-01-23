// ========================================
// LINKEDIN QUIZ POPUP - 5 STEP FLOW
// ========================================

(function () {
    // Direct webhook to n8n workflow (NOT the form trigger)
    const WEBHOOK_URL = 'https://linkai020.app.n8n.cloud/webhook/lead-quiz';

    // Quiz answers storage
    const answers = {
        linkedin_status: '',
        ai_maturity_level: '',
        primary_goal: '',
        urgency_level: '',
        name: '',
        email: '',
        company: '',
        phone: ''
    };

    let currentStep = 1;
    const totalSteps = 5;

    // Build popup HTML
    const html = `
    <div class="quiz-overlay" id="quizOverlay">
        <div class="quiz-modal">
            <button class="quiz-close" onclick="closeQuiz()">&times;</button>
            
            <!-- Progress -->
            <div class="quiz-progress" id="quizProgress">
                <div class="quiz-dot active" data-step="1"></div>
                <div class="quiz-dot" data-step="2"></div>
                <div class="quiz-dot" data-step="3"></div>
                <div class="quiz-dot" data-step="4"></div>
                <div class="quiz-dot" data-step="5"></div>
            </div>
            
            <!-- Step 1: LinkedIn Status -->
            <div class="quiz-step active" data-step="1">
                <h2 class="quiz-question">What best describes your current LinkedIn situation?</h2>
                <div class="quiz-options">
                    <div class="quiz-option" onclick="answer(1, 'linkedin_status', 'views_no_leads')">
                        <span class="quiz-option-letter">A</span>
                        <span>We get views, but no real leads</span>
                    </div>
                    <div class="quiz-option" onclick="answer(1, 'linkedin_status', 'posts_no_conversion')">
                        <span class="quiz-option-letter">B</span>
                        <span>We post, but it doesn't convert</span>
                    </div>
                    <div class="quiz-option" onclick="answer(1, 'linkedin_status', 'not_using')">
                        <span class="quiz-option-letter">C</span>
                        <span>We don't really use LinkedIn yet</span>
                    </div>
                    <div class="quiz-option" onclick="answer(1, 'linkedin_status', 'working_well')">
                        <span class="quiz-option-letter">D</span>
                        <span>LinkedIn already works well for us</span>
                    </div>
                </div>
            </div>
            
            <!-- Step 2: AI Maturity -->
            <div class="quiz-step" data-step="2">
                <h2 class="quiz-question">How are you currently using AI in your sales or marketing?</h2>
                <div class="quiz-options">
                    <div class="quiz-option" onclick="answer(2, 'ai_maturity_level', 'not_using')">
                        <span class="quiz-option-letter">A</span>
                        <span>Not using AI at all</span>
                    </div>
                    <div class="quiz-option" onclick="answer(2, 'ai_maturity_level', 'manual_chatgpt')">
                        <span class="quiz-option-letter">B</span>
                        <span>Using tools like ChatGPT manually</span>
                    </div>
                    <div class="quiz-option" onclick="answer(2, 'ai_maturity_level', 'some_automation')">
                        <span class="quiz-option-letter">C</span>
                        <span>Some automation, but not connected</span>
                    </div>
                    <div class="quiz-option" onclick="answer(2, 'ai_maturity_level', 'fully_automated')">
                        <span class="quiz-option-letter">D</span>
                        <span>Fully automated flows</span>
                    </div>
                </div>
            </div>
            
            <!-- Step 3: Primary Goal -->
            <div class="quiz-step" data-step="3">
                <h2 class="quiz-question">What would help you most right now?</h2>
                <div class="quiz-options">
                    <div class="quiz-option" onclick="answer(3, 'primary_goal', 'more_leads')">
                        <span class="quiz-option-letter">A</span>
                        <span>More qualified leads automatically</span>
                    </div>
                    <div class="quiz-option" onclick="answer(3, 'primary_goal', 'less_manual_work')">
                        <span class="quiz-option-letter">B</span>
                        <span>Less manual follow-up work</span>
                    </div>
                    <div class="quiz-option" onclick="answer(3, 'primary_goal', 'better_conversion')">
                        <span class="quiz-option-letter">C</span>
                        <span>Better conversion from LinkedIn</span>
                    </div>
                    <div class="quiz-option" onclick="answer(3, 'primary_goal', 'understand_ai')">
                        <span class="quiz-option-letter">D</span>
                        <span>Understanding how AI could help us</span>
                    </div>
                </div>
            </div>
            
            <!-- Step 4: Urgency -->
            <div class="quiz-step" data-step="4">
                <h2 class="quiz-question">If this worked, when would you want results?</h2>
                <div class="quiz-options">
                    <div class="quiz-option" onclick="answer(4, 'urgency_level', 'asap')">
                        <span class="quiz-option-letter">A</span>
                        <span>ASAP — this is urgent</span>
                    </div>
                    <div class="quiz-option" onclick="answer(4, 'urgency_level', '1_3_months')">
                        <span class="quiz-option-letter">B</span>
                        <span>Within 1–3 months</span>
                    </div>
                    <div class="quiz-option" onclick="answer(4, 'urgency_level', 'exploring')">
                        <span class="quiz-option-letter">C</span>
                        <span>Just exploring options</span>
                    </div>
                    <div class="quiz-option" onclick="answer(4, 'urgency_level', 'no_timeline')">
                        <span class="quiz-option-letter">D</span>
                        <span>No clear timeline yet</span>
                    </div>
                </div>
            </div>
            
            <!-- Step 5: Contact -->
            <div class="quiz-step" data-step="5">
                <h2 class="quiz-question">Almost done! Where can we reach you?</h2>
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
                        <label>Company</label>
                        <input type="text" id="qCompany" placeholder="Company name">
                    </div>
                    <div class="quiz-input">
                        <label>Phone</label>
                        <input type="tel" id="qPhone" placeholder="+31 6 12345678">
                    </div>
                    <button type="submit" class="quiz-submit" id="quizSubmit">
                        See what AI can do for us →
                    </button>
                </form>
            </div>
            
            <!-- Success -->
            <div class="quiz-step" data-step="success">
                <div class="quiz-success">
                    <div class="quiz-success-icon">🎉</div>
                    <h2>Thank you!</h2>
                    <p>We'll reach out within 24 hours with personalized insights.</p>
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
        setTimeout(() => goToStep(step + 1), 350);
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
        answers.company = document.getElementById('qCompany').value || '';
        answers.phone = document.getElementById('qPhone').value || '';

        const payload = {
            // Map to existing n8n form fields
            fullName: answers.name,
            emailAddress: answers.email,
            companyName: answers.company,
            phoneNumber: answers.phone,
            companySize: '',
            helpWith: `LinkedIn: ${answers.linkedin_status}, AI: ${answers.ai_maturity_level}, Goal: ${answers.primary_goal}, Timeline: ${answers.urgency_level}`,
            // Quiz-specific fields
            linkedin_status: answers.linkedin_status,
            ai_maturity_level: answers.ai_maturity_level,
            primary_goal: answers.primary_goal,
            urgency_level: answers.urgency_level,
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
            // Reset
            document.getElementById('quizForm').reset();
            document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
            goToStep(1);
            btn.disabled = false;
            btn.textContent = 'See what AI can do for us →';
        }, 3500);
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
