import os, jwt, requests, time
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from database import get_conn
from datetime import datetime, timedelta

router = APIRouter()

JWT_SECRET = os.environ.get("JWT_SECRET", "shikshabd-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 72

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")

FACEBOOK_APP_ID = os.environ.get("FACEBOOK_APP_ID", "")
FACEBOOK_APP_SECRET = os.environ.get("FACEBOOK_APP_SECRET", "")
FACEBOOK_REDIRECT_URI = os.environ.get("FACEBOOK_REDIRECT_URI", "http://localhost:8000/api/auth/facebook/callback")

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

def create_jwt(user_id: int, email: str, name: str, avatar: str = None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "avatar": avatar,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_or_create_user(email: str, name: str, avatar: str = None, google_id: str = None, facebook_id: str = None) -> int:
    conn = get_conn()
    cur = conn.cursor()
    # Check if user exists
    if google_id:
        row = cur.execute("SELECT id FROM users WHERE google_id = ?", (google_id,)).fetchone()
    elif facebook_id:
        row = cur.execute("SELECT id FROM users WHERE facebook_id = ?", (facebook_id,)).fetchone()
    else:
        row = cur.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    
    if row:
        user_id = row["id"]
        # Update info
        cur.execute("UPDATE users SET name = ?, avatar = ? WHERE id = ?", (name, avatar, user_id))
        conn.commit()
    else:
        cur.execute(
            "INSERT INTO users (email, name, avatar, google_id, facebook_id) VALUES (?, ?, ?, ?, ?)",
            (email, name, avatar, google_id, facebook_id),
        )
        conn.commit()
        user_id = cur.lastrowid
    conn.close()
    return user_id

# ============ Google OAuth ============
@router.get("/google")
def google_login():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.")
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        "&access_type=offline"
    )
    return RedirectResponse(url=auth_url)

@router.get("/google/callback")
def google_callback(code: str = None, error: str = None):
    if error or not code:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error={error or 'no_code'}")
    
    # Exchange code for token
    token_resp = requests.post("https://oauth2.googleapis.com/token", data={
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    })
    if token_resp.status_code != 200:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=token_exchange_failed")
    
    token_data = token_resp.json()
    access_token = token_data.get("access_token")
    
    # Get user info
    user_resp = requests.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={
        "Authorization": f"Bearer {access_token}"
    })
    if user_resp.status_code != 200:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=user_info_failed")
    
    user_info = user_resp.json()
    email = user_info.get("email")
    name = user_info.get("name", email.split("@")[0])
    avatar = user_info.get("picture")
    google_id = user_info.get("id")
    
    user_id = get_or_create_user(email, name, avatar, google_id=google_id)
    token = create_jwt(user_id, email, name, avatar)
    
    return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={token}")

# ============ Facebook OAuth ============
@router.get("/facebook")
def facebook_login():
    if not FACEBOOK_APP_ID:
        raise HTTPException(status_code=500, detail="Facebook OAuth not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.")
    auth_url = (
        "https://www.facebook.com/v18.0/dialog/oauth"
        f"?client_id={FACEBOOK_APP_ID}"
        f"&redirect_uri={FACEBOOK_REDIRECT_URI}"
        "&scope=email,public_profile"
    )
    return RedirectResponse(url=auth_url)

@router.get("/facebook/callback")
def facebook_callback(code: str = None, error: str = None):
    if error or not code:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error={error or 'no_code'}")
    
    # Exchange code for token
    token_resp = requests.get("https://graph.facebook.com/v18.0/oauth/access_token", params={
        "code": code,
        "client_id": FACEBOOK_APP_ID,
        "client_secret": FACEBOOK_APP_SECRET,
        "redirect_uri": FACEBOOK_REDIRECT_URI,
    })
    if token_resp.status_code != 200:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=token_exchange_failed")
    
    token_data = token_resp.json()
    access_token = token_data.get("access_token")
    
    # Get user info
    user_resp = requests.get("https://graph.facebook.com/v18.0/me", params={
        "fields": "id,name,email,picture.type(large)",
        "access_token": access_token,
    })
    if user_resp.status_code != 200:
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=user_info_failed")
    
    user_info = user_resp.json()
    email = user_info.get("email", f"{user_info.get('id')}@facebook.com")
    name = user_info.get("name", "Facebook User")
    avatar = user_info.get("picture", {}).get("data", {}).get("url")
    facebook_id = user_info.get("id")
    
    user_id = get_or_create_user(email, name, avatar, facebook_id=facebook_id)
    token = create_jwt(user_id, email, name, avatar)
    
    return RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={token}")

# ============ Token Verification ============
@router.get("/me")
def get_current_user(token: str = None):
    from fastapi import Header
    # Token from query param or Authorization header
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    payload = verify_jwt(token)
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("SELECT id, email, name, avatar, role, created_at FROM users WHERE id = ?", (payload["user_id"],)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)

@router.get("/config")
def auth_config():
    return {
        "google_enabled": bool(GOOGLE_CLIENT_ID),
        "facebook_enabled": bool(FACEBOOK_APP_ID),
    }