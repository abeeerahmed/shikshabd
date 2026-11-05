# Deployment Guide — ShikshaBD

## Backend (FastAPI + SQLite) → Render / Railway

### Prerequisites
- The DB file `bd_education.db` (~42MB) must be in `backend/`. For free tiers, commit it to the repo (or use Git LFS).
- A Render/Railway account.

### Option A: Render (Docker)
1. Push the repo to GitHub.
2. In Render dashboard → **New → Web Service** → connect the repo.
3. Render auto-detects `render.yaml` at the repo root. Click **Apply**.
4. Wait for build (~2-3 min). The service URL will be like `https://shikshabd-api.onrender.com`.
5. Verify: `curl https://shikshabd-api.onrender.com/health` → `{"status":"ok"}`.

### Option B: Railway
1. Push the repo to GitHub.
2. In Railway → **New Project → Deploy from GitHub repo**.
3. Set root directory to `backend/`. Railway auto-detects the `Procfile`.
4. Add env var `PORT=8000` (Railway sets this automatically).
5. Deploy. URL like `https://shikshabd-api.up.railway.app`.

### Option C: VPS (manual)
```bash
cd backend
pip install -r requirements.txt
export DB_PATH=/path/to/bd_education.db
uvicorn main:app --host 0.0.0.0 --port 8000
# Use nginx + systemd for production
```

## Frontend (React/Vite) → Vercel / Netlify / Cloudflare Pages

### 1. Set the backend URL
Edit `frontend/.env.production`:
```
VITE_API_BASE_URL=https://shikshabd-api.onrender.com/api
```

### 2. Deploy
- **Vercel**: `cd frontend && npx vercel` (or connect GitHub repo, set root to `frontend/`, build command `npm run build`, output `dist`)
- **Netlify**: same, publish dir `dist`
- **Cloudflare Pages**: same

### 3. Rebuild mobile app with the new backend URL
```bash
cd frontend
npm run build
npx cap sync
npx cap open android   # rebuild in Android Studio
```

## Mobile App (Android)
### Prerequisites
- Android Studio installed (https://developer.android.com/studio)
- Android SDK + emulator configured

### Build
```bash
cd frontend
npm run build
npx cap sync
npx cap open android
```
In Android Studio: **Build → Generate Signed Bundle/APK** → create a keystore → build AAB for Play Store.

### iOS (requires Mac + Xcode)
```bash
cd frontend
npx cap add ios
npm run build && npx cap sync
npx cap open ios
```

## Environment Variables Summary
| Variable | Where | Value |
|----------|-------|-------|
| `DB_PATH` | Backend | Path to `bd_education.db` |
| `PORT` | Backend | Port to listen on (default 8000) |
| `VITE_API_BASE_URL` | Frontend | Backend API base URL |