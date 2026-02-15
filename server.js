import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Database Setup
const db = new Database('bookmarks.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

// Init Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bookmark_id INTEGER,
    tag TEXT,
    FOREIGN KEY(bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
  );
`);

// Validation Helper
function validateBookmark(data) {
    const { url, title, description, tags } = data;
    if (!url || typeof url !== 'string') throw new Error('URL is required');
    try { new URL(url); } catch { throw new Error('Invalid URL format'); }

    if (!title || typeof title !== 'string') throw new Error('Title is required');
    if (title.length > 200) throw new Error('Title cannot exceed 200 characters');

    if (description && description.length > 500) throw new Error('Description cannot exceed 500 characters');

    if (tags) {
        if (!Array.isArray(tags)) throw new Error('Tags must be an array');
        if (tags.length > 5) throw new Error('Maximum 5 tags allowed');
        const uniqueTags = new Set(tags.map(t => t.toLowerCase()));
        if (uniqueTags.size !== tags.length) throw new Error('Tags must be unique');
    }
}

// Seed Data
const seedData = [];

const rowCount = db.prepare('SELECT count(*) as count FROM bookmarks').get().count;

if (rowCount === 0) {
    const insertBookmark = db.prepare('INSERT INTO bookmarks (url, title, description) VALUES (?, ?, ?)');
    const insertTag = db.prepare('INSERT INTO tags (bookmark_id, tag) VALUES (?, ?)');

    const seedTransaction = db.transaction((bookmarks) => {
        for (const b of bookmarks) {
            const info = insertBookmark.run(b.url, b.title, b.description || '');
            const bookmarkId = info.lastInsertRowid;
            if (b.tags) {
                for (const tag of b.tags) insertTag.run(bookmarkId, tag.toLowerCase());
            }
        }
    });

    seedTransaction(seedData);
    console.log('Seeded database with initial bookmarks.');
}

// Routes

// GET /bookmarks

// GET /bookmarks
app.get('/bookmarks', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { tag } = req.query;

    let whereClause = '';
    const params = [];

    if (tag) {
        whereClause = ` WHERE b.id IN (SELECT bookmark_id FROM tags WHERE tag = ?) `;
        params.push(tag.toLowerCase());
    }

    // Get total count for pagination
    const countQuery = `SELECT count(*) as count FROM bookmarks b ${whereClause}`;
    const total = db.prepare(countQuery).get(...params).count;

    // Get paginated data
    let query = `
    SELECT b.id, b.url, b.title, b.description, b.created_at as createdAt, GROUP_CONCAT(t.tag) as tags 
    FROM bookmarks b
    LEFT JOIN tags t ON b.id = t.bookmark_id
    ${whereClause}
    GROUP BY b.id 
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `;

    const rows = db.prepare(query).all(...params, limit, offset);

    const bookmarks = rows.map(row => ({
        ...row,
        tags: row.tags ? row.tags.split(',') : []
    }));

    res.json({
        data: bookmarks,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
});

// POST /bookmarks
app.post('/bookmarks', (req, res) => {
    try {
        validateBookmark(req.body);
        const { url, title, description, tags } = req.body;

        const insertBookmark = db.prepare('INSERT INTO bookmarks (url, title, description) VALUES (?, ?, ?)');
        const insertTag = db.prepare('INSERT INTO tags (bookmark_id, tag) VALUES (?, ?)');

        const transaction = db.transaction(() => {
            const info = insertBookmark.run(url, title, description || '');
            const bookmarkId = info.lastInsertRowid;
            if (tags && Array.isArray(tags)) {
                for (const tag of tags) insertTag.run(bookmarkId, tag.toLowerCase());
            }
            return bookmarkId;
        });

        const newId = transaction();

        // Fetch the created bookmark to return it fully populated
        const newBookmark = {
            id: newId,
            url,
            title,
            description,
            tags: tags ? tags.map(t => t.toLowerCase()) : [],
            createdAt: new Date().toISOString() // Approximate, DB has the real one
        };

        res.status(201).json(newBookmark);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /bookmarks/:id
app.put('/bookmarks/:id', (req, res) => {
    try {
        const { id } = req.params;
        validateBookmark(req.body);
        const { url, title, description, tags } = req.body;

        const updateB = db.prepare('UPDATE bookmarks SET url = ?, title = ?, description = ? WHERE id = ?');
        const deleteTags = db.prepare('DELETE FROM tags WHERE bookmark_id = ?');
        const insertTag = db.prepare('INSERT INTO tags (bookmark_id, tag) VALUES (?, ?)');

        const transaction = db.transaction(() => {
            const info = updateB.run(url, title, description, id);
            if (info.changes === 0) throw new Error('Bookmark not found');

            deleteTags.run(id);
            if (tags && Array.isArray(tags)) {
                for (const tag of tags) insertTag.run(id, tag.toLowerCase());
            }
        });

        try {
            transaction();
            res.json({ id, url, title, description, tags, createdAt: new Date().toISOString() });
        } catch (e) {
            if (e.message === 'Bookmark not found') return res.status(404).json({ error: 'Bookmark not found' });
            throw e;
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /bookmarks/:id
app.delete('/bookmarks/:id', (req, res) => {
    const { id } = req.params;
    const info = db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);

    if (info.changes === 0) {
        return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.status(204).send();
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
