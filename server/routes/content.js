const express = require('express');
const validator = require('validator');
const { getDb, getDefaultContent } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Content schema - defines what can be edited
const contentSchema = {
    home: {
        nav: {
            servicesLabel: { type: 'text', maxLength: 20 },
            processLabel: { type: 'text', maxLength: 20 },
            contactLabel: { type: 'text', maxLength: 20 }
        },
        hero: {
            eyebrowText: { type: 'text', maxLength: 50 },
            headline: { type: 'text', maxLength: 100 },
            subheadline: { type: 'text', maxLength: 200 },
            primaryButtonLabel: { type: 'text', maxLength: 20 },
            primaryButtonLink: { type: 'text', maxLength: 100 },
            secondaryButtonLabel: { type: 'text', maxLength: 20 },
            secondaryButtonLink: { type: 'text', maxLength: 100 },
            backgroundImage: { type: 'image' }
        },
        logos: {
            items: { type: 'array', maxItems: 10 }
        }
    },
    services: {
        title: { type: 'text', maxLength: 50 },
        subtitle: { type: 'text', maxLength: 200 }
    },
    process: {
        title: { type: 'text', maxLength: 50 },
        subtitle: { type: 'text', maxLength: 200 }
    },
    contact: {
        title: { type: 'text', maxLength: 50 },
        subtitle: { type: 'text', maxLength: 200 },
        email: { type: 'email', maxLength: 100 }
    }
};

// Validate content against schema
function validateContent(content, schema = contentSchema, path = '') {
    const errors = [];

    for (const key in content) {
        const fieldPath = path ? `${path}.${key}` : key;
        const schemaField = getNestedValue(schema, fieldPath);

        if (!schemaField) {
            errors.push(`Unknown field: ${fieldPath}`);
            continue;
        }

        const value = content[key];

        if (schemaField.type === 'text' && typeof value === 'string') {
            if (schemaField.maxLength && value.length > schemaField.maxLength) {
                errors.push(`${fieldPath} exceeds max length of ${schemaField.maxLength}`);
            }
            // Sanitize - strip HTML tags
            content[key] = validator.escape(validator.stripLow(value));
        }

        if (schemaField.type === 'email' && typeof value === 'string') {
            if (!validator.isEmail(value)) {
                errors.push(`${fieldPath} is not a valid email`);
            }
        }

        if (schemaField.type === 'array' && Array.isArray(value)) {
            if (schemaField.maxItems && value.length > schemaField.maxItems) {
                errors.push(`${fieldPath} exceeds max items of ${schemaField.maxItems}`);
            }
        }
    }

    return errors;
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) =>
        current && current[key] !== undefined ? current[key] : null, obj);
}

function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
        if (!current[key]) current[key] = {};
        return current[key];
    }, obj);
    target[lastKey] = value;
}

// Get published content (public API)
router.get('/published', (req, res) => {
    try {
        const db = getDb();
        const content = db.prepare(`
            SELECT content FROM content_versions 
            WHERE state = 'published' 
            ORDER BY version DESC LIMIT 1
        `).get();

        if (content) {
            res.json(JSON.parse(content.content));
        } else {
            res.json(getDefaultContent());
        }
    } catch (error) {
        console.error('Error fetching published content:', error);
        res.json(getDefaultContent()); // Fallback
    }
});

// Get draft content (requires auth)
router.get('/draft', requireAuth, (req, res) => {
    try {
        const db = getDb();
        const content = db.prepare(`
            SELECT content FROM content_versions 
            WHERE state = 'draft' 
            ORDER BY version DESC LIMIT 1
        `).get();

        if (content) {
            res.json(JSON.parse(content.content));
        } else {
            res.json(getDefaultContent());
        }
    } catch (error) {
        console.error('Error fetching draft content:', error);
        res.status(500).json({ error: 'Failed to fetch draft' });
    }
});

// Update draft content
router.put('/draft', requireAuth, (req, res) => {
    try {
        const updates = req.body;
        const db = getDb();

        // Get current draft
        const currentDraft = db.prepare(`
            SELECT id, content, version FROM content_versions 
            WHERE state = 'draft' 
            ORDER BY version DESC LIMIT 1
        `).get();

        let content = currentDraft ? JSON.parse(currentDraft.content) : getDefaultContent();

        // Apply updates and validate
        for (const fieldPath in updates) {
            const value = updates[fieldPath];

            // Validate field exists in schema
            const schemaField = getNestedValue(contentSchema, fieldPath);
            if (!schemaField) {
                return res.status(400).json({ error: `Invalid field: ${fieldPath}` });
            }

            // Validate and sanitize value
            if (schemaField.type === 'text') {
                if (typeof value !== 'string') {
                    return res.status(400).json({ error: `${fieldPath} must be a string` });
                }
                if (schemaField.maxLength && value.length > schemaField.maxLength) {
                    return res.status(400).json({
                        error: `${fieldPath} exceeds max length of ${schemaField.maxLength}`
                    });
                }
            }

            // Log the change
            const oldValue = getNestedValue(content, fieldPath);
            db.prepare(`
                INSERT INTO audit_log (user_id, user_email, action, field_path, old_value, new_value) 
                VALUES (?, ?, 'edit', ?, ?, ?)
            `).run(
                req.session.user.id,
                req.session.user.email,
                fieldPath,
                JSON.stringify(oldValue),
                JSON.stringify(value)
            );

            setNestedValue(content, fieldPath, value);
        }

        const newVersion = (currentDraft?.version || 0) + 1;

        // Save new draft
        db.prepare(`
            INSERT INTO content_versions (content, state, version, created_by) 
            VALUES (?, 'draft', ?, ?)
        `).run(JSON.stringify(content), newVersion, req.session.user.id);

        res.json({ success: true, version: newVersion });

    } catch (error) {
        console.error('Error updating draft:', error);
        res.status(500).json({ error: 'Failed to update draft' });
    }
});

// Publish draft
router.post('/publish', requireAuth, (req, res) => {
    try {
        const db = getDb();

        // Get current draft
        const draft = db.prepare(`
            SELECT content, version FROM content_versions 
            WHERE state = 'draft' 
            ORDER BY version DESC LIMIT 1
        `).get();

        if (!draft) {
            return res.status(400).json({ error: 'No draft to publish' });
        }

        // Get current published version
        const published = db.prepare(`
            SELECT version FROM content_versions 
            WHERE state = 'published' 
            ORDER BY version DESC LIMIT 1
        `).get();

        const newVersion = (published?.version || 0) + 1;

        // Create new published version
        db.prepare(`
            INSERT INTO content_versions (content, state, version, created_by) 
            VALUES (?, 'published', ?, ?)
        `).run(draft.content, newVersion, req.session.user.id);

        // Log publish action
        db.prepare(`
            INSERT INTO audit_log (user_id, user_email, action, field_path) 
            VALUES (?, ?, 'publish', ?)
        `).run(req.session.user.id, req.session.user.email, `version_${newVersion}`);

        res.json({ success: true, version: newVersion });

    } catch (error) {
        console.error('Error publishing:', error);
        res.status(500).json({ error: 'Failed to publish' });
    }
});

// Get version history
router.get('/versions', requireAuth, (req, res) => {
    try {
        const db = getDb();
        const versions = db.prepare(`
            SELECT cv.id, cv.version, cv.state, cv.created_at, u.email as created_by
            FROM content_versions cv
            LEFT JOIN users u ON cv.created_by = u.id
            WHERE cv.state = 'published'
            ORDER BY cv.version DESC
            LIMIT 20
        `).all();

        res.json(versions);

    } catch (error) {
        console.error('Error fetching versions:', error);
        res.status(500).json({ error: 'Failed to fetch versions' });
    }
});

// Rollback to a previous version
router.post('/rollback/:version', requireAuth, (req, res) => {
    try {
        const { version } = req.params;
        const db = getDb();

        const oldVersion = db.prepare(`
            SELECT content FROM content_versions 
            WHERE state = 'published' AND version = ?
        `).get(parseInt(version));

        if (!oldVersion) {
            return res.status(404).json({ error: 'Version not found' });
        }

        // Get current published version number
        const current = db.prepare(`
            SELECT version FROM content_versions 
            WHERE state = 'published' 
            ORDER BY version DESC LIMIT 1
        `).get();

        const newVersion = (current?.version || 0) + 1;

        // Create new version with old content
        db.prepare(`
            INSERT INTO content_versions (content, state, version, created_by) 
            VALUES (?, 'published', ?, ?)
        `).run(oldVersion.content, newVersion, req.session.user.id);

        // Also update draft
        db.prepare(`
            INSERT INTO content_versions (content, state, version, created_by) 
            VALUES (?, 'draft', ?, ?)
        `).run(oldVersion.content, newVersion, req.session.user.id);

        // Log rollback
        db.prepare(`
            INSERT INTO audit_log (user_id, user_email, action, field_path) 
            VALUES (?, ?, 'rollback', ?)
        `).run(req.session.user.id, req.session.user.email, `from_v${version}_to_v${newVersion}`);

        res.json({ success: true, version: newVersion });

    } catch (error) {
        console.error('Error rolling back:', error);
        res.status(500).json({ error: 'Failed to rollback' });
    }
});

// Get audit log
router.get('/audit-log', requireAuth, (req, res) => {
    try {
        const db = getDb();
        const logs = db.prepare(`
            SELECT * FROM audit_log 
            ORDER BY timestamp DESC 
            LIMIT 100
        `).all();

        res.json(logs);

    } catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
});

module.exports = router;
