const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const mediaRoutes = require('./routes/media');

// Import database setup
const { initDatabase } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDatabase();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            scriptSrc: ["'self'", "'unsafe-inline'"]
        }
    }
}));

app.use(cors({
    origin: true,
    credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'link-ai-cms-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 30 * 60 * 1000, // 30 minutes
        sameSite: 'strict'
    }
}));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: { error: 'Too many login attempts. Please try again later.' }
});

// Static files - serve the website
app.use(express.static(path.join(__dirname, '..')));

// Admin panel static files
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/media', mediaRoutes);

// Login page route
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/admin');
    }
    res.sendFile(path.join(__dirname, '../admin/login.html'));
});

// Admin dashboard route (protected)
app.get('/admin', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Preview mode route
app.get('/preview', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    // Set preview mode cookie and redirect to homepage
    res.cookie('preview_mode', 'true', { maxAge: 5 * 60 * 1000, httpOnly: true });
    res.redirect('/?preview=true');
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`CMS Server running at http://localhost:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
    console.log(`Login: http://localhost:${PORT}/login`);
});
