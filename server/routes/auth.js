const express = require('express');
const bcrypt = require('bcrypt');
const validator = require('validator');
const { getDb } = require('../db/database');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

        // Set session
        req.session.user = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        // Log login
        db.prepare(`
            INSERT INTO audit_log (user_id, user_email, action) 
            VALUES (?, ?, 'login')
        `).run(user.id, user.email);

        res.json({
            success: true,
            user: {
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    if (req.session.user) {
        const db = getDb();
        db.prepare(`
            INSERT INTO audit_log (user_id, user_email, action) 
            VALUES (?, ?, 'logout')
        `).run(req.session.user.id, req.session.user.email);
    }

    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

// Check auth status
router.get('/status', (req, res) => {
    if (req.session.user) {
        res.json({
            authenticated: true,
            user: {
                email: req.session.user.email,
                role: req.session.user.role
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Change password (for authenticated users)
router.post('/change-password', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate new password strength
    if (!newPassword || newPassword.length < 12) {
        return res.status(400).json({ error: 'Password must be at least 12 characters' });
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) ||
        !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
        return res.status(400).json({
            error: 'Password must contain uppercase, lowercase, numbers, and symbols'
        });
    }

    try {
        const db = getDb();
        const user = db.prepare('SELECT password_hash FROM users WHERE id = ?')
            .get(req.session.user.id);

        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const newHash = await bcrypt.hash(newPassword, 12);
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            .run(newHash, req.session.user.id);

        // Log password change
        db.prepare(`
            INSERT INTO audit_log (user_id, user_email, action) 
            VALUES (?, ?, 'password_change')
        `).run(req.session.user.id, req.session.user.email);

        res.json({ success: true });

    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
