from fastapi import APIRouter, Query
from database import get_conn

router = APIRouter()

@router.get("")
def global_search(q: str = Query(..., min_length=2), limit: int = Query(20, ge=1, le=50)):
    conn = get_conn()
    cur = conn.cursor()
    like = f"%{q}%"
    # Use FTS5 for institute name search (faster + ranked)
    fts_q = q.replace('"', '""')
    try:
        institutes = cur.execute(
            """SELECT a.eiin_or_code, a.institute_name, a.division, a.district, a.institute_type, a.level
               FROM institutes_fts f
               JOIN all_institutes_clean a ON a.rowid = f.rowid
               WHERE institutes_fts MATCH ? LIMIT ?""",
            (fts_q + "*", limit),
        ).fetchall()
    except Exception:
        institutes = cur.execute(
            "SELECT eiin_or_code, institute_name, division, district, institute_type, level FROM all_institutes_clean WHERE institute_name LIKE ? OR eiin_or_code LIKE ? LIMIT ?",
            (like, like, limit),
        ).fetchall()
    # Also include EIIN prefix matches not caught by FTS
    if len(institutes) < limit:
        extra = cur.execute(
            "SELECT eiin_or_code, institute_name, division, district, institute_type, level FROM all_institutes_clean WHERE eiin_or_code LIKE ? LIMIT ?",
            (q + "%", limit),
        ).fetchall()
        seen = {r["eiin_or_code"] for r in institutes}
        merged = list(institutes)
        for r in extra:
            if r["eiin_or_code"] not in seen:
                merged.append(r)
                seen.add(r["eiin_or_code"])
                if len(merged) >= limit:
                    break
        institutes = merged[:limit]
    try:
        teachers = cur.execute(
            """SELECT t.teacher_name, t.designation, t.institute_name, t.eiin, t.district
               FROM teachers_fts f
               JOIN teachers t ON t.rowid = f.rowid
               WHERE teachers_fts MATCH ? LIMIT ?""",
            (fts_q + "*", limit),
        ).fetchall()
    except Exception:
        teachers = cur.execute(
            "SELECT teacher_name, designation, institute_name, eiin, district FROM teachers WHERE teacher_name LIKE ? LIMIT ?",
            (like, limit),
        ).fetchall()
    conn.close()
    return {
        "institutes": [dict(r) for r in institutes],
        "teachers": [dict(r) for r in teachers],
    }

@router.get("/suggest")
def suggest(q: str = Query(..., min_length=2), limit: int = Query(8, ge=1, le=20)):
    conn = get_conn()
    cur = conn.cursor()
    try:
        institutes = cur.execute(
            """SELECT a.eiin_or_code, a.institute_name, a.division, a.district
               FROM institutes_fts f
               JOIN all_institutes_clean a ON a.rowid = f.rowid
               WHERE institutes_fts MATCH ? LIMIT ?""",
            (q + "*", limit),
        ).fetchall()
    except Exception:
        like = f"%{q}%"
        institutes = cur.execute(
            "SELECT eiin_or_code, institute_name, division, district FROM all_institutes_clean WHERE institute_name LIKE ? LIMIT ?",
            (like, limit),
        ).fetchall()
    conn.close()
    return [dict(r) for r in institutes]

@router.get("/similar/{eiin}")
def similar(eiin: str, limit: int = Query(5, ge=1, le=10)):
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("SELECT division, district, institute_type, level FROM all_institutes_clean WHERE eiin_or_code = ?", (eiin,)).fetchone()
    if not row:
        conn.close()
        return []
    results = cur.execute(
        """SELECT eiin_or_code, institute_name, division, district, institute_type, level, teacher_count
           FROM all_institutes_clean
           WHERE division = ? AND district = ? AND institute_type = ? AND eiin_or_code != ?
           ORDER BY teacher_count DESC LIMIT ?""",
        (row['division'], row['district'], row['institute_type'], eiin, limit),
    ).fetchall()
    if len(results) < limit:
        more = cur.execute(
            """SELECT eiin_or_code, institute_name, division, district, institute_type, level, teacher_count
               FROM all_institutes_clean
               WHERE division = ? AND institute_type = ? AND eiin_or_code != ?
               ORDER BY teacher_count DESC LIMIT ?""",
            (row['division'], row['institute_type'], eiin, limit - len(results)),
        ).fetchall()
        results = list(results) + list(more)
    conn.close()
    return [dict(r) for r in results]