const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Configure upload directory
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'));
        }
    }
});

// List all media
router.get('/', requireAuth, (req, res) => {
    try {
        const db = getDb();
        const media = db.prepare(`
            SELECT m.*, u.email as uploaded_by_email
            FROM media m
            LEFT JOIN users u ON m.uploaded_by = u.id
            ORDER BY m.uploaded_at DESC
        `).all();

        res.json(media);
    } catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({ error: 'Failed to fetch media' });
    }
});

// Upload media
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { altText } = req.body;
        if (!altText || altText.trim().length === 0) {
            return res.status(400).json({ error: 'Alt text is required' });
        }

        // Generate unique filename
        const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
        const filepath = path.join(uploadDir, filename);

        // Process image with Sharp
        let processedImage = sharp(req.file.buffer);

        // Resize if too large (max 2000px width)
        const metadata = await processedImage.metadata();
        if (metadata.width > 2000) {
            processedImage = processedImage.resize(2000, null, {
                withoutEnlargement: true
            });
        }

        // Compress and save
        if (req.file.mimetype === 'image/jpeg') {
            await processedImage.jpeg({ quality: 85 }).toFile(filepath);
        } else if (req.file.mimetype === 'image/png') {
            await processedImage.png({ quality: 85 }).toFile(filepath);
        } else if (req.file.mimetype === 'image/webp') {
            await processedImage.webp({ quality: 85 }).toFile(filepath);
        }

        // Get file size
        const stats = fs.statSync(filepath);

        // Save to database
        const db = getDb();
        const result = db.prepare(`
            INSERT INTO media (filename, original_name, alt_text, mime_type, size, uploaded_by) 
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            filename,
            req.file.originalname,
            altText.trim(),
            req.file.mimetype,
            stats.size,
            req.session.user.id
        );

        // Log upload
        db.prepare(`
            INSERT INTO audit_log (user_id, user_email, action, field_path) 
            VALUES (?, ?, 'media_upload', ?)
        `).run(req.session.user.id, req.session.user.email, filename);

        res.json({
            success: true,
            media: {
                id: result.lastInsertRowid,
                filename,
                altText: altText.trim(),
                url: `/uploads/${filename}`
            }
        });

    } catch (error) {
        console.error('Error uploading media:', error);
        res.status(500).json({ error: 'Failed to upload media' });
    }
});

// Serve uploaded files
router.get('/file/:filename', (req, res) => {
    const { filename } = req.params;

    // Prevent path traversal
    const safeFilename = path.basename(filename);
    const filepath = path.join(uploadDir, safeFilename);

    if (!fs.existsSync(filepath)) {
        return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filepath);
});

// Update alt text
router.put('/:id/alt', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const { altText } = req.body;

        if (!altText || altText.trim().length === 0) {
            return res.status(400).json({ error: 'Alt text is required' });
        }

        const db = getDb();
        const media = db.prepare('SELECT * FROM media WHERE id = ?').get(parseInt(id));

        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }

        db.prepare('UPDATE media SET alt_text = ? WHERE id = ?')
            .run(altText.trim(), parseInt(id));

        // Log update
        db.prepare(`
            INSERT INTO audit_log (user_id, user_email, action, field_path, old_value, new_value) 
            VALUES (?, ?, 'media_alt_update', ?, ?, ?)
        `).run(
            req.session.user.id,
            req.session.user.email,
            media.filename,
            media.alt_text,
            altText.trim()
        );

        res.json({ success: true });

    } catch (error) {
        console.error('Error updating alt text:', error);
        res.status(500).json({ error: 'Failed to update alt text' });
    }
});

// Delete media (only if not in use)
router.delete('/:id', requireAuth, (req, res) => {
    try {
        const { id } = req.params;
        const db = getDb();

        const media = db.prepare('SELECT * FROM media WHERE id = ?').get(parseInt(id));

        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }

        // Check if in use
        const usage = JSON.parse(media.usage || '[]');
        if (usage.length > 0) {
            return res.status(400).json({
                error: 'Cannot delete media that is in use',
                usage
            });
        }

        // Delete file
        const filepath = path.join(uploadDir, media.filename);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        // Delete from database
        db.prepare('DELETE FROM media WHERE id = ?').run(parseInt(id));

        // Log deletion
        db.prepare(`
            INSERT INTO audit_log (user_id, user_email, action, field_path) 
            VALUES (?, ?, 'media_delete', ?)
        `).run(req.session.user.id, req.session.user.email, media.filename);

        res.json({ success: true });

    } catch (error) {
        console.error('Error deleting media:', error);
        res.status(500).json({ error: 'Failed to delete media' });
    }
});

module.exports = router;
