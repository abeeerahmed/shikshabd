from fastapi import APIRouter, Query
from database import get_conn
from cache import cached

router = APIRouter()

_CANONICAL_DISTRICTS = [
    'Barguna','Barishal','Bhola','Jhalokati','Patuakhali','Pirojpur',
    'Bandarban','Brahmanbaria','Chandpur','Chattogram',"Cox's Bazar",'Comilla','Feni','Khagrachhari','Lakshmipur','Noakhali','Rangamati',
    'Dhaka','Faridpur','Gazipur','Gopalganj','Kishoreganj','Madaripur','Manikganj','Munshiganj','Narayanganj','Narsingdi','Rajbari','Shariatpur','Tangail',
    'Bagerhat','Chuadanga','Jessore','Jhenaidah','Khulna','Kushtia','Magura','Meherpur','Narail','Satkhira',
    'Jamalpur','Mymensingh','Netrokona','Sherpur',
    'Bogura','Chapainawabganj','Joypurhat','Naogaon','Natore','Pabna','Rajshahi','Sirajganj',
    'Dinajpur','Gaibandha','Kurigram','Lalmonirhat','Nilphamari','Panchagarh','Rangpur','Thakurgaon',
    'Habiganj','Moulvibazar','Sunamganj','Sylhet',
]

_DISTRICT_ALIASES = {
    'chittagong': 'Chattogram', 'cumilla': 'Comilla', 'comilla': 'Comilla',
    'jashore': 'Jessore', 'bogra': 'Bogura', 'barisal': 'Barishal',
    'coxs bazar': "Cox's Bazar", "cox's bazar": "Cox's Bazar",
    'sirajgonj': 'Sirajganj', 'netrakona': 'Netrokona', 'hobigonj': 'Habiganj',
    'sunamgonj': 'Sunamganj', 'gopalgonj': 'Gopalganj', 'luxmipur': 'Lakshmipur',
    'chapai nawabgonj': 'Chapainawabganj', 'manikgonj': 'Manikganj', 'munshigonj': 'Munshiganj',
    'jhalokathi': 'Jhalokati', 'narayangonj': 'Narayanganj', 'brahamanbaria': 'Brahmanbaria',
    'brahmonbaria': 'Brahmanbaria', 'moulavibazar': 'Moulvibazar', 'mymensing': 'Mymensingh',
    'kishorgonj': 'Kishoreganj', 'nawabganj': 'Chapainawabganj', 'jaipurhat': 'Joypurhat',
    'nawgaon': 'Naogaon', 'nator': 'Natore', 'thalugaon': 'Thakurgaon',
}

_DISTRICT_LOOKUP = {}
for c in _CANONICAL_DISTRICTS:
    _DISTRICT_LOOKUP[c.lower()] = c
for k, v in _DISTRICT_ALIASES.items():
    _DISTRICT_LOOKUP[k.lower()] = v

def normalize_district(name):
    if not name:
        return name
    key = name.strip().lower()
    if key in _DISTRICT_LOOKUP:
        return _DISTRICT_LOOKUP[key]
    return name.strip().title()

@router.get("")
def list_institutes(
    level: str = Query(None),
    division: str = Query(None),
    district: str = Query(None),
    type: str = Query(None),
    management: str = Query(None),
    mpo: str = Query(None),
    q: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    conn = get_conn()
    cur = conn.cursor()
    where = []
    params = []
    if level:
        where.append("level = ?"); params.append(level)
    if division:
        where.append("division = ?"); params.append(division)
    if district:
        where.append("district = ?"); params.append(district)
    if type:
        where.append("institute_type = ?"); params.append(type)
    if management:
        where.append("management = ?"); params.append(management)
    if mpo:
        where.append("is_mpo = ?"); params.append(mpo)
    if q:
        where.append("(institute_name LIKE ? OR eiin_or_code LIKE ?)")
        params += [f"%{q}%", f"%{q}%"]
    clause = " WHERE " + " AND ".join(where) if where else ""
    total = cur.execute(f"SELECT COUNT(*) FROM all_institutes_clean{clause}", params).fetchone()[0]
    offset = (page - 1) * page_size
    rows = cur.execute(
        f"SELECT * FROM all_institutes_clean{clause} ORDER BY institute_name LIMIT ? OFFSET ?",
        params + [page_size, offset],
    ).fetchall()
    conn.close()
    return {"total": total, "page": page, "page_size": page_size, "data": [dict(r) for r in rows]}

@router.get("/detail/{eiin}")
def institute_detail(eiin: str):
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("SELECT * FROM all_institutes_clean WHERE eiin_or_code = ?", (eiin,)).fetchone()
    if not row:
        conn.close()
        return {"error": "Not found"}
    # teachers if available
    teachers = cur.execute(
        "SELECT teacher_name, designation, date_of_birth, first_joining_date FROM teachers WHERE eiin = ?",
        (eiin,),
    ).fetchall()
    # teacher count by designation
    by_designation = cur.execute(
        "SELECT designation, COUNT(*) as count FROM teachers WHERE eiin = ? GROUP BY designation ORDER BY count DESC",
        (eiin,),
    ).fetchall()
    conn.close()
    return {
        "institute": dict(row),
        "teachers": [dict(t) for t in teachers],
        "by_designation": [dict(d) for d in by_designation],
    }

@router.get("/divisions")
@cached(ttl=3600)
def divisions():
    conn = get_conn()
    rows = conn.execute("SELECT DISTINCT division FROM all_institutes_clean WHERE division IS NOT NULL").fetchall()
    conn.close()
    # Normalize to canonical title case
    seen = set()
    result = []
    for r in rows:
        v = r[0].strip().title()
        if v not in seen:
            seen.add(v)
            result.append(v)
    result.sort()
    return result

@router.get("/districts")
@cached(ttl=3600)
def districts(division: str = Query(None)):
    conn = get_conn()
    if division:
        rows = conn.execute("SELECT DISTINCT district FROM all_institutes_clean WHERE division = ? AND district IS NOT NULL", (division,)).fetchall()
    else:
        rows = conn.execute("SELECT DISTINCT district FROM all_institutes_clean WHERE district IS NOT NULL").fetchall()
    conn.close()
    seen = set()
    result = []
    for r in rows:
        v = normalize_district(r[0])
        if v not in seen:
            seen.add(v)
            result.append(v)
    result.sort()
    return result

@router.get("/map-data")
def map_data(
    level: str = Query(None),
    division: str = Query(None),
    district: str = Query(None),
    type: str = Query(None),
    management: str = Query(None),
    mpo: str = Query(None),
    q: str = Query(None),
    limit: int = Query(5000, ge=1, le=20000),
):
    conn = get_conn()
    cur = conn.cursor()
    where = []
    params = []
    if level:
        where.append("level = ?"); params.append(level)
    if division:
        where.append("division = ?"); params.append(division)
    if district:
        where.append("district = ?"); params.append(district)
    if type:
        where.append("institute_type = ?"); params.append(type)
    if management:
        where.append("management = ?"); params.append(management)
    if mpo:
        where.append("is_mpo = ?"); params.append(mpo)
    if q:
        where.append("(institute_name LIKE ? OR eiin_or_code LIKE ?)")
        params += [f"%{q}%", f"%{q}%"]
    clause = " WHERE " + " AND ".join(where) if where else ""
    total = cur.execute(f"SELECT COUNT(*) FROM all_institutes_clean{clause}", params).fetchone()[0]
    rows = cur.execute(
        f"SELECT eiin_or_code, institute_name, district, division, institute_type FROM all_institutes_clean{clause} ORDER BY institute_name LIMIT ?",
        params + [limit],
    ).fetchall()
    conn.close()
    data = []
    for r in rows:
        d = dict(r)
        d["district"] = normalize_district(d["district"])
        data.append(d)
    return {"total": total, "limit": limit, "data": data}


@router.get("/by-district")
def by_district(
    level: str = Query(None),
    division: str = Query(None),
    type: str = Query(None),
    management: str = Query(None),
    mpo: str = Query(None),
    q: str = Query(None),
):
    conn = get_conn()
    cur = conn.cursor()
    where = []
    params = []
    if level:
        where.append("level = ?"); params.append(level)
    if division:
        where.append("division = ?"); params.append(division)
    if type:
        where.append("institute_type = ?"); params.append(type)
    if management:
        where.append("management = ?"); params.append(management)
    if mpo:
        where.append("is_mpo = ?"); params.append(mpo)
    if q:
        where.append("(institute_name LIKE ? OR eiin_or_code LIKE ?)")
        params += [f"%{q}%", f"%{q}%"]
    clause = " WHERE " + " AND ".join(where) if where else ""
    rows = cur.execute(
        f"SELECT district, division, COUNT(*) as count FROM all_institutes_clean{clause} GROUP BY district, division",
        params,
    ).fetchall()
    conn.close()
    # Normalize district names and re-aggregate by district only
    agg = {}
    for r in rows:
        nd = normalize_district(r["district"])
        if nd not in agg:
            agg[nd] = {"district": nd, "division": r["division"], "count": 0}
        agg[nd]["count"] += r["count"]
    result = list(agg.values())
    result.sort(key=lambda x: x["count"], reverse=True)
    return result


@router.get("/random")
def random_institute():
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("SELECT * FROM all_institutes_clean ORDER BY RANDOM() LIMIT 1").fetchone()
    conn.close()
    return dict(row) if row else {}

@router.get("/types")
@cached(ttl=3600)
def types():
    conn = get_conn()
    rows = conn.execute("SELECT DISTINCT institute_type FROM all_institutes_clean WHERE institute_type IS NOT NULL ORDER BY institute_type").fetchall()
    conn.close()
    return [r[0] for r in rows]