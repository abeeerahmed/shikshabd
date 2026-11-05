from fastapi import APIRouter, Query
from database import get_conn

router = APIRouter()

@router.get("")
def list_teachers(
    eiin: str = Query(None),
    designation: str = Query(None),
    q: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    conn = get_conn()
    cur = conn.cursor()
    offset = (page - 1) * page_size

    # Use FTS when searching by name and no eiin filter
    if q and not eiin:
        fts_q = q.replace('"', '""') + "*"
        where_extra = ""
        params_extra = []
        if designation:
            where_extra = " AND t.designation LIKE ?"
            params_extra = [f"%{designation}%"]
        try:
            total = cur.execute(
                f"SELECT COUNT(*) FROM teachers_fts f JOIN teachers t ON t.rowid=f.rowid WHERE teachers_fts MATCH ?{where_extra}",
                [fts_q] + params_extra,
            ).fetchone()[0]
            rows = cur.execute(
                f"""SELECT t.* FROM teachers_fts f JOIN teachers t ON t.rowid=f.rowid
                    WHERE teachers_fts MATCH ?{where_extra}
                    ORDER BY t.institute_name, t.teacher_name LIMIT ? OFFSET ?""",
                [fts_q] + params_extra + [page_size, offset],
            ).fetchall()
            conn.close()
            return {"total": total, "page": page, "page_size": page_size, "data": [dict(r) for r in rows]}
        except Exception:
            pass  # fall through to LIKE

    where = []
    params = []
    if eiin:
        where.append("eiin = ?"); params.append(eiin)
    if designation:
        where.append("designation LIKE ?"); params.append(f"%{designation}%")
    if q:
        where.append("(teacher_name LIKE ? OR institute_name LIKE ?)")
        params += [f"%{q}%", f"%{q}%"]
    clause = " WHERE " + " AND ".join(where) if where else ""
    total = cur.execute(f"SELECT COUNT(*) FROM teachers{clause}", params).fetchone()[0]
    rows = cur.execute(
        f"SELECT * FROM teachers{clause} ORDER BY institute_name, teacher_name LIMIT ? OFFSET ?",
        params + [page_size, offset],
    ).fetchall()
    conn.close()
    return {"total": total, "page": page, "page_size": page_size, "data": [dict(r) for r in rows]}

@router.get("/designations")
def designations():
    conn = get_conn()
    rows = conn.execute("SELECT DISTINCT designation FROM teachers WHERE designation IS NOT NULL ORDER BY designation").fetchall()
    conn.close()
    return [r[0] for r in rows]