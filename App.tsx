import React, { useState, useEffect, useMemo } from 'react';

// --- Types ---

export interface Bookmark {
    id: number | string;
    url: string;
    title: string;
    description?: string;
    tags: string[];
    createdAt: string;
}

export interface NewBookmark {
    url: string;
    title: string;
    description: string;
    tags: string[];
}

// --- Icons ---

const Icons = {
    Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>,
    Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>,
    Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>,
    Edit: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>,
    ExternalLink: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
    Moon: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
    Sun: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
    X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
};

// --- API Service ---

const API = {
    getBookmarks: async (tag?: string, page: number = 1): Promise<{ data: Bookmark[], pagination: any }> => {
        const url = new URL('http://localhost:3000/bookmarks');
        if (tag) url.searchParams.append('tag', tag);
        url.searchParams.append('page', page.toString());
        url.searchParams.append('limit', '5');

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Failed to fetch bookmarks');
        return res.json();
    },

    createBookmark: async (bookmark: NewBookmark): Promise<Bookmark> => {
        const res = await fetch('http://localhost:3000/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookmark)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to create bookmark');
        }
        return res.json();
    },

    updateBookmark: async (id: number | string, updates: Partial<NewBookmark>): Promise<Bookmark> => {
        const res = await fetch(`http://localhost:3000/bookmarks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to update bookmark');
        }
        return res.json();
    },

    deleteBookmark: async (id: number | string): Promise<void> => {
        const res = await fetch(`http://localhost:3000/bookmarks/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            if (res.status !== 404) throw new Error('Failed to delete bookmark');
        }
    }
};

// --- Styles ---


const styles = `
  :root {
    --bg-primary: #f8fafc;
    --bg-card: #ffffff;
    --text-primary: #0f172a;
    --text-secondary: #64748b;
    --accent: #6366f1;
    --accent-hover: #4f46e5;
    --border: #e2e8f0;
    --danger: #ef4444;
  }
  
  [data-theme='dark'] {
    --bg-primary: #0f172a;
    --bg-card: #1e293b;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --accent: #818cf8;
    --accent-hover: #6366f1;
    --border: #334155;
  }

  body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    transition: background-color 0.3s, color 0.3s;
    margin: 0;
    font-family: 'Inter', sans-serif;
  }

  .container { max-width: 900px; margin: 0 auto; padding: 20px; }
  
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 8px 16px; border-radius: 8px; font-weight: 500; cursor: pointer;
    border: none; transition: all 0.2s;
    font-size: 0.9rem;
  }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: var(--accent-hover); }
  .btn-ghost { background: transparent; color: var(--text-secondary); }
  .btn-ghost:hover { background: rgba(128,128,128,0.1); color: var(--text-primary); }
  .btn-danger { background: transparent; color: var(--danger); border: 1px solid var(--danger); }
  .btn-danger:hover { background: var(--danger); color: white; }
  .icon-btn { padding: 8px; border-radius: 50%; }

  .input {
    width: 100%; padding: 10px 12px; border-radius: 6px;
    border: 1px solid var(--border); background: var(--bg-card);
    color: var(--text-primary); font-size: 0.95rem;
    transition: border-color 0.2s; box-sizing: border-box;
  }
  .input:focus { outline: none; border-color: var(--accent); ring: 2px var(--accent); }

  .card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px; margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .card:hover .card-actions { opacity: 1; }

  .card-header { display: flex; justify-content: space-between; align-items: flex-start; }
  .card-content { flex: 1; }
  
  .card-title { 
    margin: 0 0 4px 0; font-size: 1.125rem; font-weight: 600; 
    color: var(--accent); display: inline-flex; align-items: center; gap: 6px; 
    text-decoration: none; transition: color 0.2s;
  }
  .card-title:hover { color: var(--accent-hover); }
  
  .card-desc { 
    margin: 4px 0 12px 0; color: var(--text-secondary); 
    font-size: 0.875rem; line-height: 1.5; 
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }

  .card-tags { display: flex; flex-wrap: wrap; gap: 8px; }
  
  .card-actions { display: flex; gap: 4px; margin-left: 16px; opacity: 0; transition: opacity 0.2s; }
  
  .card-footer {
    display: flex; align-items: center; gap: 12px; margin-top: 16px; 
    padding-top: 12px; border-top: 1px solid var(--border);
    font-size: 0.75rem; font-weight: 500; color: var(--text-secondary);
  }

  .tag {
    display: inline-flex; align-items: center;
    padding: 2px 10px; border-radius: 999px;
    font-size: 0.75rem; font-weight: 600;
    background: rgba(99, 102, 241, 0.1); color: var(--accent);
    cursor: pointer; transition: all 0.2s;
  }
  .tag:hover, .tag.active { background: var(--accent); color: white; }
  .tag .close-icon { margin-left: 4px; opacity: 0.6; }

  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
    z-index: 50; backdrop-filter: blur(2px);
  }
  .modal {
    background: var(--bg-card); width: 100%; max-width: 500px;
    border-radius: 16px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
  .header-actions { display: flex; gap: 12px; }
  
  .logo { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 12px; }
  .logo-icon {
    width: 32px; height: 32px; background: var(--accent); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; color: white;
  }

  .filters { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }
  .search-box { position: relative; flex: 1; min-width: 200px; }
  .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); }
  .search-input { padding-left: 36px; }

  .active-filter {
    display: flex; align-items: center; gap: 8px; 
    background: var(--bg-card); padding: 6px 12px; 
    border-radius: 8px; border: 1px solid var(--accent); 
    color: var(--accent); font-size: 0.9rem; font-weight: 600;
  }

  .empty-state { text-align: center; padding: 40px; color: var(--text-secondary); }
  
  .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 32px; }
`;

// --- Components ---

const BookmarkForm = ({
    initialData,
    onSubmit,
    onCancel
}: {
    initialData?: Bookmark,
    onSubmit: (data: NewBookmark) => void,
    onCancel: () => void
}) => {
    const [formData, setFormData] = useState<NewBookmark>({
        url: initialData?.url || '',
        title: initialData?.title || '',
        description: initialData?.description || '',
        tags: initialData?.tags || []
    });
    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.url) newErrors.url = 'URL is required';
        else {
            try { new URL(formData.url); } catch { newErrors.url = 'Invalid URL format'; }
        }
        if (!formData.title) newErrors.title = 'Title is required';
        if (formData.title.length > 200) newErrors.title = 'Title too long';
        if (formData.description.length > 500) newErrors.description = 'Description too long';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) onSubmit(formData);
    };

    const addTag = () => {
        const tag = tagInput.toLowerCase().trim();
        if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>{initialData ? 'Edit Bookmark' : 'New Bookmark'}</h2>
                    <button className="btn-ghost icon-btn" onClick={onCancel}><Icons.X /></button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>URL</label>
                        <input
                            className="input"
                            value={formData.url}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            placeholder="https://example.com"
                        />
                        {errors.url && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.url}</span>}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>Title</label>
                        <input
                            className="input"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="My Awesome Bookmark"
                        />
                        {errors.title && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.title}</span>}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>Description</label>
                        <textarea
                            className="input"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Optional notes..."
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500 }}>Tags (Max 5)</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <input
                                className="input"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                placeholder="Type tag and press Enter"
                                disabled={formData.tags.length >= 5}
                            />
                            <button type="button" className="btn btn-ghost" onClick={addTag} disabled={formData.tags.length >= 5}>Add</button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {formData.tags.map(tag => (
                                <span key={tag} className="tag" onClick={() => removeTag(tag)}>
                                    {tag} <span style={{ marginLeft: 4, opacity: 0.6 }}>×</span>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{initialData ? 'Save Changes' : 'Create Bookmark'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Main App ---

export const App = () => {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>(undefined);
    const [darkMode, setDarkMode] = useState(true);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Load Theme
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    // Load Data
    const loadBookmarks = async () => {
        setLoading(true);
        try {
            const res = await API.getBookmarks(filterTag || undefined, page);
            setBookmarks(res.data);
            setTotalPages(res.pagination.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookmarks();
    }, [filterTag, page]);

    // Reset page when tag changes
    useEffect(() => {
        setPage(1);
    }, [filterTag]);

    // Filter Logic
    const filteredBookmarks = useMemo(() => {
        if (!searchQuery) return bookmarks;
        const lowerQ = searchQuery.toLowerCase();
        return bookmarks.filter(b =>
            b.title.toLowerCase().includes(lowerQ) ||
            b.url.toLowerCase().includes(lowerQ)
        );
    }, [bookmarks, searchQuery]);

    // Actions
    const handleCreate = async (data: NewBookmark) => {
        await API.createBookmark(data);
        setIsModalOpen(false);
        loadBookmarks();
    };

    const handleUpdate = async (data: NewBookmark) => {
        if (editingBookmark) {
            await API.updateBookmark(editingBookmark.id, data);
            setEditingBookmark(undefined);
            loadBookmarks();
        }
    };

    const handleDelete = async (id: number | string) => {
        if (window.confirm('Are you sure you want to delete this bookmark?')) {
            await API.deleteBookmark(id);
            loadBookmarks();
        }
    };

    const handleEditClick = (b: Bookmark) => {
        setEditingBookmark(b);
    };

    return (
        <>
            <style>{styles}</style>
            <div className="container">

                {/* Header */}
                <header className="header">
                    <div className="logo">
                        <div className="logo-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                        </div>
                        Vibe Bookmarks
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-ghost icon-btn" onClick={() => setDarkMode(!darkMode)}>
                            {darkMode ? <Icons.Sun /> : <Icons.Moon />}
                        </button>
                        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                            <Icons.Plus /> Add Bookmark
                        </button>
                    </div>
                </header>

                {/* Filters & Search */}
                <div className="filters">
                    <div className="search-box">
                        <span className="search-icon"><Icons.Search /></span>
                        <input
                            className="input search-input"
                            placeholder="Search by title or URL..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {filterTag && (
                        <div className="active-filter">
                            Tag: {filterTag}
                            <span style={{ cursor: 'pointer' }} onClick={() => setFilterTag(null)}><Icons.X /></span>
                        </div>
                    )}
                </div>

                {/* List */}
                {loading ? (
                    <div className="empty-state">Loading...</div>
                ) : filteredBookmarks.length === 0 ? (
                    <div className="empty-state">
                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
                        <p>No bookmarks found.</p>
                        {filterTag && <button className="btn btn-ghost" onClick={() => setFilterTag(null)}>Clear Filters</button>}
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {filteredBookmarks.map(b => (
                                <div key={b.id} className="card">
                                    <div className="card-header">
                                        <div className="card-content">
                                            <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                                <h3 className="card-title">
                                                    {b.title}
                                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity"><Icons.ExternalLink /></span>
                                                </h3>
                                            </a>
                                            {b.description && <p className="card-desc">{b.description}</p>}
                                            <div className="card-tags">
                                                {b.tags.map(tag => (
                                                    <span
                                                        key={tag}
                                                        className={`tag ${filterTag === tag ? 'active' : ''} `}
                                                        onClick={(e) => { e.stopPropagation(); setFilterTag(filterTag === tag ? null : tag); }}
                                                    >
                                                        {tag}
                                                        {filterTag === tag && <span className="close-icon">×</span>}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="card-actions">
                                            <button className="btn btn-ghost icon-btn" onClick={() => handleEditClick(b)} title="Edit"><Icons.Edit /></button>
                                            <button className="btn btn-ghost icon-btn" onClick={() => handleDelete(b.id)} style={{ color: 'var(--danger)' }} title="Delete"><Icons.Trash /></button>
                                        </div>
                                    </div>
                                    <div className="card-footer">
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, textTransform: 'uppercase' }}>{new URL(b.url).hostname[0]}</span>
                                            {new URL(b.url).hostname}
                                        </span>
                                        <span>•</span>
                                        <span>{new Date(b.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Pagination Controls */}
                        <div className="pagination">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{ opacity: page === 1 ? 0.5 : 1 }}
                            >
                                Previous
                            </button>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Page {page} of {totalPages || 1}</span>
                            <button
                                className="btn btn-ghost"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                style={{ opacity: page >= totalPages ? 0.5 : 1 }}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}

                {/* Modals */}
                {isModalOpen && (
                    <BookmarkForm
                        onSubmit={handleCreate}
                        onCancel={() => setIsModalOpen(false)}
                    />
                )}

                {editingBookmark && (
                    <BookmarkForm
                        initialData={editingBookmark}
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingBookmark(undefined)}
                    />
                )}
            </div >
        </>
    );
};
