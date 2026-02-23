"""FastAPI application — entry point."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import analyze, health

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

app = FastAPI(
    title="MediaVerifyBot API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(analyze.router, prefix="/analyze", tags=["analyze"])
app.include_router(health.router, tags=["health"])
