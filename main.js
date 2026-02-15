const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

// --- Database Setup ---
const dbPath = path.join(app.getPath('userData'), 'bookmarks.db');
const db = new Database(dbPath, { verbose: console.log });

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

// --- Helper: Validation ---

function validateBookmark({ url, title, description, tags }) {
  // 1. URL Required & Format
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required and must be a string');
  }
  try {
    new URL(url);
  } catch (err) {
    throw new Error('Invalid URL format');
  }

  // 2. Title Required & Length
  if (!title || typeof title !== 'string') {
    throw new Error('Title is required');
  }
  if (title.length > 200) {
    throw new Error('Title cannot exceed 200 characters');
  }

  // 3. Description Optional & Length
  if (description && description.length > 500) {
    throw new Error('Description cannot exceed 500 characters');
  }

  // 4. Tags Optional & Limits
  if (tags) {
    if (!Array.isArray(tags)) throw new Error('Tags must be an array');
    if (tags.length > 5) throw new Error('Maximum 5 tags allowed');
    const uniqueTags = new Set(tags.map(t => t.toLowerCase()));
    if (uniqueTags.size !== tags.length) throw new Error('Tags must be unique');
  }
}

// --- IPC Handlers (API Endpoints) ---

// GET /bookmarks
ipcMain.handle('get-bookmarks', (event, { tag } = {}) => {
  let query = `
    SELECT b.*, GROUP_CONCAT(t.tag) as tags 
    FROM bookmarks b
    LEFT JOIN tags t ON b.id = t.bookmark_id
  `;
  
  const params = [];
  
  if (tag) {
    query += ` WHERE b.id IN (SELECT bookmark_id FROM tags WHERE tag = ?) `;
    params.push(tag.toLowerCase());
  }
  
  query += ` GROUP BY b.id ORDER BY b.created_at DESC`;
  
  const rows = db.prepare(query).all(...params);
  
  return rows.map(row => ({
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    tags: row.tags ? row.tags.split(',') : []
  }));
});

// POST /bookmarks
ipcMain.handle('create-bookmark', (event, data) => {
  // Validate Input
  validateBookmark(data);
  const { url, title, description, tags } = data;

  const insertBookmark = db.prepare('INSERT INTO bookmarks (url, title, description) VALUES (?, ?, ?)');
  const insertTag = db.prepare('INSERT INTO tags (bookmark_id, tag) VALUES (?, ?)');
  
  const transaction = db.transaction(() => {
    const info = insertBookmark.run(url, title, description || '');
    const bookmarkId = info.lastInsertRowid;
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        insertTag.run(bookmarkId, tag.toLowerCase());
      }
    }
    return bookmarkId;
  });
  
  const newId = transaction();
  
  return {
    id: newId,
    url,
    title,
    description,
    tags: tags ? tags.map(t => t.toLowerCase()) : [],
    createdAt: new Date().toISOString()
  };
});

// PUT /bookmarks/:id
ipcMain.handle('update-bookmark', (event, data) => {
  const { id, url, title, description, tags } = data;
  
  // Validate Input
  validateBookmark({ url, title, description, tags });

  const updateB = db.prepare('UPDATE bookmarks SET url = ?, title = ?, description = ? WHERE id = ?');
  const deleteTags = db.prepare('DELETE FROM tags WHERE bookmark_id = ?');
  const insertTag = db.prepare('INSERT INTO tags (bookmark_id, tag) VALUES (?, ?)');
  
  const transaction = db.transaction(() => {
    const info = updateB.run(url, title, description, id);
    
    // Simulate 404 Not Found
    if (info.changes === 0) {
      throw new Error('Bookmark not found');
    }

    deleteTags.run(id);
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        insertTag.run(id, tag.toLowerCase());
      }
    }
  });
  
  transaction();
  return { id, url, title, description, tags, createdAt: new Date().toISOString() }; // Note: createdAt isn't updated in DB, this is just for UI return
});

// DELETE /bookmarks/:id
ipcMain.handle('delete-bookmark', (event, { id }) => {
  const info = db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
  
  // Simulate 404 Not Found
  if (info.changes === 0) {
    throw new Error('Bookmark not found');
  }
  
  return true; // Simulate 204 No Content
});

// --- Window Management ---

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
  
  // Open external links in browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});