"""FastAPI application — entry point."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import analyze, auth, bigcheck, health, user

# Documentation updated
# Cleaner API design
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

app = FastAPI(
    title="Источник API",
    version="0.4.0",
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(auth.router)
app.include_router(bigcheck.router, prefix="/bigcheck", tags=["bigcheck"])
app.include_router(health.router, tags=["health"])
app.include_router(user.router)
