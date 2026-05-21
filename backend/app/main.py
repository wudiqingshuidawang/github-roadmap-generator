from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, roadmap
from app.core.config import settings

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(roadmap.router, prefix="/api/roadmap", tags=["roadmap"])
