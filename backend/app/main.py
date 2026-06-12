from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import auth, users, interviews, resume, analytics

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title="Smart Interview Preparation Platform",
    description="AI-powered interview coaching with voice analysis, resume review and adaptive question generation.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(interviews.router, prefix="/api/interviews", tags=["Interviews"])
app.include_router(resume.router, prefix="/api/resume", tags=["Resume"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}