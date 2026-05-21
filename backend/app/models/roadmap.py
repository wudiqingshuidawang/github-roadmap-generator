import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    roadmaps: Mapped[list["Roadmap"]] = relationship(back_populates="project")


class Roadmap(Base):
    __tablename__ = "roadmaps"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id"))
    share_token: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    github_refs: Mapped[dict] = mapped_column(JSONB, nullable=True)
    tech_stack: Mapped[dict] = mapped_column(JSONB, nullable=True)
    phases: Mapped[dict] = mapped_column(JSONB, nullable=True)
    llm_model: Mapped[str] = mapped_column(String(50), nullable=True)
    llm_tokens_used: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    project: Mapped["Project"] = relationship(back_populates="roadmaps")
