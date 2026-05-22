# github-roadmap-generator

搜集 GitHub 教程 + 思维导图 + 时间线 — AI 驱动的项目学习路径生成器。描述你的项目想法，基于真实 GitHub 项目生成个性化的学习路线图，支持时间线和思维导图两种视图。

## Features

- **GitHub-Powered**: Analyzes real open-source projects to generate accurate roadmaps
- **AI-Generated**: Uses LLM to create structured, actionable learning plans
- **Dual Views**: Switch between timeline and mind map visualizations
- **Shareable**: Generate share links for your roadmaps

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.11+
- Anthropic API key

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/wudiqingshuidawang/github-roadmap-generator.git
   cd github-roadmap-generator
   ```

2. Start database services:
   ```bash
   docker compose up postgres redis -d
   ```

3. Set up backend:
   ```bash
   cd backend
   cp .env.example .env  # Add your Anthropic API key
   pip install -e .
   alembic upgrade head
   uvicorn app.main:app --reload
   ```

4. Set up frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, D3.js
- **Backend**: Python, FastAPI, SQLAlchemy, PostgreSQL, Redis
- **APIs**: GitHub REST API, Anthropic API

## License

MIT
