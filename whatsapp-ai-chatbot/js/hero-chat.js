/**
 * Hero Chat Animation
 * Automatically types out diverse conversations in chat mockups
 * Fix: Uses runId to strictly invalidate old animation loops and prevent duplication
 */

const heroMessages = [
    { type: 'user', text: 'Hoi, zijn jullie vandaag nog open?', delay: 800 },
    { type: 'typing', delay: 1500 },
    { type: 'bot', text: 'Jazeker! We zijn geopend tot 18:00.', delay: 600 },
    { type: 'typing', delay: 1200 },
    { type: 'bot', text: 'Kan ik je verder nog ergens mee helpen?', delay: 600 },
    { type: 'pause', delay: 2500 },
    { type: 'user', text: 'Kan ik een afspraak maken?', delay: 800 },
    { type: 'typing', delay: 1500 },
    { type: 'bot', text: 'Natuurlijk! Wanneer komt het jou het beste uit? 📅', delay: 600 },
    { type: 'pause', delay: 3000 },
];

const problemMessages = [
    { type: 'bot', text: 'Wanneer zou je willen komen?', delay: 800 },
    { type: 'typing', delay: 1500 },
    { type: 'bot', text: 'We hebben morgen plek om 10:00 of 14:00.', delay: 1000 },
    { type: 'pause', delay: 2500 },
    { type: 'user', text: '14:00 is perfect!', delay: 800 },
    { type: 'typing', delay: 1200 },
    { type: 'bot', text: 'Staat genoteerd! Tot morgen om 14:00. ✅', delay: 600 },
    { type: 'pause', delay: 3000 },
];

// Chat animation state for each chat body
const chatStates = {};
let delayTimer = null; // Track the delayed start timer

function initChatAnimation(chatBodyId, messageSet) {
    const chatBody = document.getElementById(chatBodyId);
    if (!chatBody) return;

    // Generate a unique ID for this specific run
    const currentRunId = Date.now() + Math.random();

    // Stop any existing animation logic by overwriting the state
    // The previous loop will check activeRunId, see mismatch, and abort
    if (chatStates[chatBodyId]) {
        clearTimeout(chatStates[chatBodyId].timerId);
    }

    chatStates[chatBodyId] = {
        element: chatBody,
        messageIndex: 0,
        messages: messageSet,
        activeRunId: currentRunId, // Only callbacks with this ID are valid
        timerId: null
    };

    // Clear content
    chatBody.innerHTML = '';

    // Start loop with correct Run ID
    processNextMessage(chatBodyId, currentRunId);
}

function processNextMessage(chatBodyId, runId) {
    const state = chatStates[chatBodyId];

    // CRITICAL CHECK: If this callback belongs to an old run, STOP immediately.
    if (!state || state.activeRunId !== runId) return;

    if (state.messageIndex >= state.messages.length) {
        // Loop: clear and restart
        state.timerId = setTimeout(() => {
            if (state.activeRunId !== runId) return; // Re-check before executing
            state.element.innerHTML = '';
            state.messageIndex = 0;
            processNextMessage(chatBodyId, runId);
        }, 2000);
        return;
    }

    const msg = state.messages[state.messageIndex];
    state.messageIndex++;

    if (msg.type === 'typing') {
        showTypingIndicator(state.element, chatBodyId);
        state.timerId = setTimeout(() => {
            if (state.activeRunId !== runId) return; // Re-check
            removeTypingIndicator(chatBodyId);
            processNextMessage(chatBodyId, runId);
        }, msg.delay);
    } else if (msg.type === 'pause') {
        state.timerId = setTimeout(() => {
            processNextMessage(chatBodyId, runId);
        }, msg.delay);
    } else {
        addChatBubble(state.element, msg.type, msg.text);
        state.timerId = setTimeout(() => {
            processNextMessage(chatBodyId, runId);
        }, msg.delay);
    }
}

function showTypingIndicator(chatBody, chatBodyId) {
    removeTypingIndicator(chatBodyId);
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.id = 'typing-' + chatBodyId;
    typing.innerHTML = '<span></span><span></span><span></span>';
    chatBody.appendChild(typing);
    scrollToBottom(chatBody);
}

function removeTypingIndicator(chatBodyId) {
    const typing = document.getElementById('typing-' + chatBodyId);
    if (typing) typing.remove();
}

function addChatBubble(chatBody, type, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${type}`;
    bubble.textContent = text;
    chatBody.appendChild(bubble);
    scrollToBottom(chatBody);
}

function scrollToBottom(chatBody) {
    if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    startAllChats();
});

// Restart on visibility change to keep fresh
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        startAllChats();
    }
});

function startAllChats() {
    // Clear global delay timer to prevent overlapping starts
    if (delayTimer) clearTimeout(delayTimer);

    // Start Hero Chat immediately
    initChatAnimation('heroChatBody', heroMessages);

    // Start Problem Chat with delay
    delayTimer = setTimeout(() => {
        initChatAnimation('problemChatBody', problemMessages);
    }, 1500);
}
