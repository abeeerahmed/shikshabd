import sqlite3
DB = 'C:/Users/User/bd-edu-site/backend/bd_education.db'
conn = sqlite3.connect(DB)
cur = conn.cursor()

# Create auth/review tables
cur.execute('''CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar TEXT,
    google_id TEXT UNIQUE,
    facebook_id TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)''')

cur.execute('''CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institute_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    rating_overall REAL NOT NULL,
    rating_teaching REAL,
    rating_facilities REAL,
    rating_treatment REAL,
    rating_environment REAL,
    rating_value REAL,
    title TEXT,
    body TEXT NOT NULL,
    is_anonymous INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institute_id) REFERENCES all_institutes_clean(eiin_or_code),
    FOREIGN KEY (user_id) REFERENCES users(id)
)''')

cur.execute('''CREATE TABLE IF NOT EXISTS review_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    vote INTEGER NOT NULL,
    UNIQUE(review_id, user_id)
)''')

cur.execute('''CREATE TABLE IF NOT EXISTS school_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institute_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(institute_id, user_id)
)''')

cur.execute('''CREATE TABLE IF NOT EXISTS school_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institute_id TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    caption TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)''')

# Add new columns to institutes for images and details
for col, typ in [('image_url','TEXT'),('website','TEXT'),('description','TEXT'),('established_year','INTEGER'),('total_students','INTEGER')]:
    try:
        cur.execute(f'ALTER TABLE all_institutes_clean ADD COLUMN {col} {typ}')
    except Exception:
        pass

conn.commit()
print('Tables and columns created!')
print('Tables:', [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()])
conn.close()