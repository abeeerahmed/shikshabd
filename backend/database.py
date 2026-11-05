import sqlite3, os

import os
DB_PATH = os.environ.get("DB_PATH", os.path.join(os.path.dirname(__file__), "bd_education.db"))

def get_conn():
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    # Performance tuning
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA cache_size=-65536")   # 64MB cache
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA temp_store=MEMORY")
    conn.execute("PRAGMA mmap_size=268435456")  # 256MB mmap
    return conn

def dict_row(row):
    return {k: row[k] for k in row.keys()} if row else None