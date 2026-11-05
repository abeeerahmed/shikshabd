from fastapi import APIRouter
from database import get_conn
from cache import cached

router = APIRouter()

@router.get("/overview")
@cached(ttl=300)
def overview():
    conn = get_conn()
    cur = conn.cursor()
    total = cur.execute("SELECT COUNT(*) FROM all_institutes_clean").fetchone()[0]
    primary = cur.execute("SELECT COUNT(*) FROM all_institutes_clean WHERE level='Primary'").fetchone()[0]
    post = cur.execute("SELECT COUNT(*) FROM all_institutes_clean WHERE level='Post-Primary'").fetchone()[0]
    teachers = cur.execute("SELECT COUNT(*) FROM teachers").fetchone()[0]
    schools_with_teachers = cur.execute("SELECT COUNT(DISTINCT eiin) FROM teachers").fetchone()[0]
    primary_teachers = cur.execute("SELECT COALESCE(SUM(total_teacher),0) FROM primary_schools").fetchone()[0]
    primary_students = cur.execute("SELECT COALESCE(SUM(total_student),0) FROM primary_schools").fetchone()[0]
    conn.close()
    return {
        "total_institutes": total,
        "primary": primary,
        "post_primary": post,
        "teachers_scraped": teachers,
        "schools_with_teacher_data": schools_with_teachers,
        "primary_teachers_total": primary_teachers,
        "primary_students_total": primary_students,
    }

@router.get("/by-type")
@cached(ttl=300)
def by_type():
    conn = get_conn()
    rows = conn.execute("SELECT institute_type, COUNT(*) as count FROM all_institutes_clean GROUP BY institute_type ORDER BY count DESC").fetchall()
    conn.close()
    return [{"type": r["institute_type"], "count": r["count"]} for r in rows]

@router.get("/by-division")
@cached(ttl=300)
def by_division():
    conn = get_conn()
    rows = conn.execute("SELECT division, COUNT(*) as count FROM all_institutes_clean WHERE division IS NOT NULL GROUP BY division ORDER BY count DESC").fetchall()
    conn.close()
    return [{"division": r["division"], "count": r["count"]} for r in rows]

@router.get("/by-level")
@cached(ttl=300)
def by_level():
    conn = get_conn()
    rows = conn.execute("SELECT level, COUNT(*) as count FROM all_institutes_clean GROUP BY level").fetchall()
    conn.close()
    return [{"level": r["level"], "count": r["count"]} for r in rows]

@router.get("/top-districts")
@cached(ttl=300)
def top_districts(limit: int = 10):
    conn = get_conn()
    rows = conn.execute(
        "SELECT district, COUNT(*) as count FROM all_institutes_clean WHERE district IS NOT NULL GROUP BY district ORDER BY count DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/districts")
@cached(ttl=300)
def districts_stats():
    conn = get_conn()
    rows = conn.execute(
        "SELECT district, COUNT(*) as institutes, COALESCE(SUM(teacher_count),0) as teachers FROM all_institutes_clean WHERE district IS NOT NULL GROUP BY district ORDER BY institutes DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/teacher-designations")
@cached(ttl=300)
def teacher_designations(limit: int = 10):
    conn = get_conn()
    rows = conn.execute(
        "SELECT designation, COUNT(*) as count FROM teachers WHERE designation IS NOT NULL GROUP BY designation ORDER BY count DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
    conn = get_conn()
    rows = conn.execute("SELECT level, COUNT(*) as count FROM all_institutes_clean GROUP BY level").fetchall()
    conn.close()
    return [{"level": r["level"], "count": r["count"]} for r in rows]