from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import institutes, teachers, stats, search, auth, reviews

app = FastAPI(
    title="Bangladesh Educational Institutes API",
    description="API for browsing 101,797+ educational institutes in Bangladesh",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(institutes.router, prefix="/api/institutes", tags=["institutes"])
app.include_router(teachers.router, prefix="/api/teachers", tags=["teachers"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])

@app.get("/")
def root():
    return {"message": "Bangladesh Educational Institutes API", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "fastapi"}