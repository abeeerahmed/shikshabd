import os
from fastapi import APIRouter, HTTPException, Query
from database import get_conn
from routers.auth import verify_jwt

router = APIRouter()

def get_user_from_token(token: str) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    return verify_jwt(token)

@router.get("/{eiin}")
def get_reviews(eiin: str, token: str = Query(None)):
    conn = get_conn()
    cur = conn.cursor()
    reviews = cur.execute(
        """SELECT r.*, u.name as user_name, u.avatar as user_avatar 
           FROM reviews r LEFT JOIN users u ON r.user_id = u.id 
           WHERE r.institute_id = ? AND r.status = 'approved' 
           ORDER BY r.created_at DESC""",
        (eiin,),
    ).fetchall()
    
    # Rating summary
    summary = cur.execute(
        """SELECT 
            COUNT(*) as total_reviews,
            AVG(rating_overall) as avg_overall,
            AVG(rating_teaching) as avg_teaching,
            AVG(rating_facilities) as avg_facilities,
            AVG(rating_treatment) as avg_treatment,
            AVG(rating_environment) as avg_environment,
            AVG(rating_value) as avg_value
           FROM reviews WHERE institute_id = ? AND status = 'approved'""",
        (eiin,),
    ).fetchone()
    
    # Check if current user liked this school
    user_liked = False
    if token:
        try:
            payload = verify_jwt(token)
            like = cur.execute(
                "SELECT 1 FROM school_likes WHERE institute_id = ? AND user_id = ?",
                (eiin, payload["user_id"]),
            ).fetchone()
            user_liked = bool(like)
            # Check if user already reviewed
            user_review = cur.execute(
                "SELECT id FROM reviews WHERE institute_id = ? AND user_id = ?",
                (eiin, payload["user_id"]),
            ).fetchone()
        except:
            user_review = None
    else:
        user_review = None
    
    conn.close()
    return {
        "reviews": [dict(r) for r in reviews],
        "summary": dict(summary) if summary else {},
        "user_liked": user_liked,
        "user_reviewed": bool(user_review),
        "user_review_id": user_review["id"] if user_review else None,
    }

@router.post("/{eiin}")
def create_review(eiin: str, data: dict, token: str = Query(...)):
    payload = get_user_from_token(token)
    user_id = payload["user_id"]
    
    conn = get_conn()
    cur = conn.cursor()
    
    # Check if already reviewed
    existing = cur.execute(
        "SELECT id FROM reviews WHERE institute_id = ? AND user_id = ?",
        (eiin, user_id),
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this institute")
    
    # Validate rating
    rating = data.get("rating_overall")
    if not rating or rating < 1 or rating > 5:
        raise HTTPException(status_code=400, detail="Overall rating must be between 1 and 5")
    
    cur.execute(
        """INSERT INTO reviews (institute_id, user_id, rating_overall, rating_teaching, rating_facilities, 
           rating_treatment, rating_environment, rating_value, title, body, is_anonymous) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            eiin, user_id,
            data.get("rating_overall"),
            data.get("rating_teaching"),
            data.get("rating_facilities"),
            data.get("rating_treatment"),
            data.get("rating_environment"),
            data.get("rating_value"),
            data.get("title", ""),
            data.get("body", ""),
            1 if data.get("is_anonymous") else 0,
        ),
    )
    conn.commit()
    review_id = cur.lastrowid
    conn.close()
    return {"id": review_id, "message": "Review submitted successfully"}

@router.put("/{eiin}/{review_id}")
def update_review(eiin: str, review_id: int, data: dict, token: str = Query(...)):
    payload = get_user_from_token(token)
    user_id = payload["user_id"]
    
    conn = get_conn()
    cur = conn.cursor()
    review = cur.execute(
        "SELECT user_id FROM reviews WHERE id = ? AND institute_id = ?",
        (review_id, eiin),
    ).fetchone()
    if not review or review["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    cur.execute(
        """UPDATE reviews SET rating_overall = ?, rating_teaching = ?, rating_facilities = ?,
           rating_treatment = ?, rating_environment = ?, rating_value = ?, title = ?, body = ?,
           is_anonymous = ?, status = 'pending' WHERE id = ?""",
        (
            data.get("rating_overall"),
            data.get("rating_teaching"),
            data.get("rating_facilities"),
            data.get("rating_treatment"),
            data.get("rating_environment"),
            data.get("rating_value"),
            data.get("title", ""),
            data.get("body", ""),
            1 if data.get("is_anonymous") else 0,
            review_id,
        ),
    )
    conn.commit()
    conn.close()
    return {"message": "Review updated"}

@router.delete("/{eiin}/{review_id}")
def delete_review(eiin: str, review_id: int, token: str = Query(...)):
    payload = get_user_from_token(token)
    user_id = payload["user_id"]
    
    conn = get_conn()
    cur = conn.cursor()
    review = cur.execute(
        "SELECT user_id FROM reviews WHERE id = ? AND institute_id = ?",
        (review_id, eiin),
    ).fetchone()
    if not review or review["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    cur.execute("DELETE FROM reviews WHERE id = ?", (review_id,))
    cur.execute("DELETE FROM review_votes WHERE review_id = ?", (review_id,))
    conn.commit()
    conn.close()
    return {"message": "Review deleted"}

@router.post("/{eiin}/{review_id}/vote")
def vote_review(eiin: str, review_id: int, data: dict, token: str = Query(...)):
    payload = get_user_from_token(token)
    user_id = payload["user_id"]
    vote = data.get("vote", 1)  # 1 or -1
    
    conn = get_conn()
    cur = conn.cursor()
    
    # Check if already voted
    existing = cur.execute(
        "SELECT vote FROM review_votes WHERE review_id = ? AND user_id = ?",
        (review_id, user_id),
    ).fetchone()
    
    if existing:
        if existing["vote"] == vote:
            # Remove vote
            cur.execute("DELETE FROM review_votes WHERE review_id = ? AND user_id = ?", (review_id, user_id))
            if vote == 1:
                cur.execute("UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = ?", (review_id,))
            else:
                cur.execute("UPDATE reviews SET not_helpful_count = not_helpful_count - 1 WHERE id = ?", (review_id,))
        else:
            # Change vote
            cur.execute("UPDATE review_votes SET vote = ? WHERE review_id = ? AND user_id = ?", (vote, review_id, user_id))
            if vote == 1:
                cur.execute("UPDATE reviews SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1 WHERE id = ?", (review_id,))
            else:
                cur.execute("UPDATE reviews SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1 WHERE id = ?", (review_id,))
    else:
        cur.execute("INSERT INTO review_votes (review_id, user_id, vote) VALUES (?, ?, ?)", (review_id, user_id, vote))
        if vote == 1:
            cur.execute("UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?", (review_id,))
        else:
            cur.execute("UPDATE reviews SET not_helpful_count = not_helpful_count + 1 WHERE id = ?", (review_id,))
    
    conn.commit()
    conn.close()
    return {"message": "Vote recorded"}

@router.post("/{eiin}/like")
def toggle_like(eiin: str, token: str = Query(...)):
    payload = get_user_from_token(token)
    user_id = payload["user_id"]
    
    conn = get_conn()
    cur = conn.cursor()
    existing = cur.execute(
        "SELECT id FROM school_likes WHERE institute_id = ? AND user_id = ?",
        (eiin, user_id),
    ).fetchone()
    
    if existing:
        cur.execute("DELETE FROM school_likes WHERE institute_id = ? AND user_id = ?", (eiin, user_id))
        liked = False
    else:
        cur.execute("INSERT INTO school_likes (institute_id, user_id) VALUES (?, ?)", (eiin, user_id))
        liked = True
    
    count = cur.execute("SELECT COUNT(*) as c FROM school_likes WHERE institute_id = ?", (eiin,)).fetchone()["c"]
    conn.commit()
    conn.close()
    return {"liked": liked, "like_count": count}

@router.get("/rankings/top")
def top_rated(limit: int = 20, division: str = None, institute_type: str = None):
    conn = get_conn()
    cur = conn.cursor()
    where = ["r.status = 'approved'"]
    params = []
    if division:
        where.append("a.division = ?")
        params.append(division)
    if institute_type:
        where.append("a.institute_type = ?")
        params.append(institute_type)
    
    clause = " AND ".join(where)
    rows = cur.execute(
        f"""SELECT a.eiin_or_code, a.institute_name, a.division, a.district, a.institute_type,
            AVG(r.rating_overall) as avg_rating, COUNT(r.id) as review_count,
            SUM(CASE WHEN r.is_verified THEN 1 ELSE 0 END) as verified_count
            FROM all_institutes_clean a
            JOIN reviews r ON r.institute_id = a.eiin_or_code
            WHERE {clause}
            GROUP BY a.eiin_or_code
            HAVING review_count >= 1
            ORDER BY avg_rating DESC, review_count DESC
            LIMIT ?""",
        params + [limit],
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]