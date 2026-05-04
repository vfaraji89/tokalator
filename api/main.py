"""
Tokalator Python API — FastAPI backend for econometric computation & CSV parsing.

Run:  uvicorn api.main:app --port 8000 --reload
Docs: http://localhost:8000/docs
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from api.models import HealthResponse
from api.routers import csv_upload, economics

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

app = FastAPI(
    title="Tokalator API",
    version="0.5.0",
    description="Econometric computation & CSV parsing for AI token usage.",
    docs_url="/docs",
    redoc_url=None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — allow Next.js dev server + production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://tokalator.wiki",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(csv_upload.router, prefix="/api")
app.include_router(economics.router, prefix="/api")


@app.get("/api/health", response_model=HealthResponse)
def health():
    return HealthResponse()
