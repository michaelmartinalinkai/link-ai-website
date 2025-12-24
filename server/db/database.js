const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '../../data/content.db');
let db;

function getDb() {
    if (!db) {
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
    }
    return db;
}

function initDatabase() {
    const db = getDb();

    // Users table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT CHECK(role IN ('client_admin', 'super_admin')) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )
    `);

    // Content versions table
    db.exec(`
        CREATE TABLE IF NOT EXISTS content_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            state TEXT CHECK(state IN ('draft', 'published')) NOT NULL,
            version INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER REFERENCES users(id)
        )
    `);

    // Media table
    db.exec(`
        CREATE TABLE IF NOT EXISTS media (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_name TEXT,
            alt_text TEXT NOT NULL,
            mime_type TEXT,
            size INTEGER,
            usage TEXT DEFAULT '[]',
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            uploaded_by INTEGER REFERENCES users(id)
        )
    `);

    // Audit log table
    db.exec(`
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            user_email TEXT,
            action TEXT NOT NULL,
            field_path TEXT,
            old_value TEXT,
            new_value TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Create default super admin if not exists
    const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('super_admin');
    if (!adminExists) {
        const passwordHash = bcrypt.hashSync('LinkAI_Admin_2024!', 12);
        db.prepare(`
            INSERT INTO users (email, password_hash, role) 
            VALUES (?, ?, ?)
        `).run('admin@linkai.agency', passwordHash, 'super_admin');
        console.log('Default super admin created: admin@linkai.agency');
    }

    // Create initial content if not exists
    const contentExists = db.prepare('SELECT id FROM content_versions LIMIT 1').get();
    if (!contentExists) {
        const defaultContent = JSON.stringify(getDefaultContent());

        // Create both draft and published versions
        db.prepare(`
            INSERT INTO content_versions (content, state, version, created_by) 
            VALUES (?, 'draft', 1, 1)
        `).run(defaultContent);

        db.prepare(`
            INSERT INTO content_versions (content, state, version, created_by) 
            VALUES (?, 'published', 1, 1)
        `).run(defaultContent);

        console.log('Default content created');
    }

    console.log('Database initialized successfully');
}

function getDefaultContent() {
    return {
        home: {
            nav: {
                servicesLabel: 'Services',
                processLabel: 'Process',
                contactLabel: 'Contact'
            },
            hero: {
                eyebrowText: 'LINK AI AGENCY',
                headline: 'INTELLIGENT AI SOLUTIONS',
                subheadline: 'We build AI-powered systems that automate, engage, and scale your business.',
                primaryButtonLabel: 'Services',
                primaryButtonLink: '#services',
                secondaryButtonLabel: 'Process',
                secondaryButtonLink: '#process',
                backgroundImage: null
            },
            logos: {
                items: []
            }
        },
        services: {
            title: 'Our Services',
            subtitle: 'AI solutions tailored to your business needs'
        },
        process: {
            title: 'Our Process',
            subtitle: 'How we build your AI systems'
        },
        contact: {
            title: 'Get in Touch',
            subtitle: 'Ready to transform your business with AI?',
            email: 'hello@linkai.agency'
        }
    };
}

module.exports = { getDb, initDatabase, getDefaultContent };
