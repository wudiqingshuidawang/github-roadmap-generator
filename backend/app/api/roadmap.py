import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.redis import get_redis
from app.models.roadmap import Project, Roadmap
from app.schemas.roadmap import (
    RoadmapDetail,
    RoadmapGenerateRequest,
    RoadmapGenerateResponse,
)
from app.services.cache import CacheService
from app.services.github import GitHubService
from app.services.llm import LLMService

router = APIRouter()


@router.post("/generate", response_model=RoadmapGenerateResponse)
async def generate_roadmap(
    request: RoadmapGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    # Check cache first
    redis_client = await get_redis()
    cache = CacheService(redis_client)
    cached = await cache.get(request.description)
    if cached:
        return RoadmapGenerateResponse(
            id=cached["id"], share_token=cached["share_token"]
        )

    # Search GitHub for similar projects
    github = GitHubService()
    github_refs = []
    github_context = ""
    try:
        projects = await github.search_projects(request.description, limit=3)
        github_refs = projects
        analyses = []
        for proj in projects[:2]:
            analysis = await github.analyze_project(proj["full_name"])
            analyses.append(analysis)
        github_context = "\n".join(
            f"- {a['full_name']}: {', '.join(s['file'] for s in a['tech_stack'])}"
            for a in analyses
        )
    except Exception:
        pass  # GitHub API failure is non-fatal

    # Generate roadmap with LLM
    llm = LLMService()
    try:
        result = await llm.generate_roadmap(request.description, github_context)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM service error: {str(e)}")

    if not result:
        raise HTTPException(status_code=502, detail="Failed to generate roadmap")

    # Save to database
    project = Project(title=request.description[:255], description=request.description)
    db.add(project)
    await db.flush()

    share_token = secrets.token_urlsafe(16)[:32]
    roadmap = Roadmap(
        project_id=project.id,
        share_token=share_token,
        github_refs=github_refs,
        tech_stack=result["data"].get("tech_stack"),
        phases=result["data"].get("phases"),
        llm_model=result["model"],
        llm_tokens_used=result["tokens_used"],
    )
    db.add(roadmap)
    await db.commit()
    await db.refresh(roadmap)

    # Cache the result
    await cache.set(request.description, {
        "id": str(roadmap.id),
        "share_token": share_token,
    })

    return RoadmapGenerateResponse(id=roadmap.id, share_token=share_token)


@router.get("/{share_token}", response_model=RoadmapDetail)
async def get_roadmap(
    share_token: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Roadmap).where(Roadmap.share_token == share_token)
    )
    roadmap = result.scalar_one_or_none()
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not found")

    await db.refresh(roadmap, ["project"])

    return RoadmapDetail(
        id=roadmap.id,
        title=roadmap.project.title,
        description=roadmap.project.description,
        share_token=roadmap.share_token,
        github_refs=roadmap.github_refs,
        tech_stack=roadmap.tech_stack,
        phases=roadmap.phases,
        llm_model=roadmap.llm_model,
        created_at=roadmap.created_at,
    )
