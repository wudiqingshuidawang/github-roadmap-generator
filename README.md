# github-roadmap-generator

AI-powered project learning roadmap generator. Describe your project idea, and get a personalized learning path based on real GitHub projects.

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
- OpenAI API key

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/projectpath.git
   cd projectpath
   ```

2. Start database services:
   ```bash
   docker compose up postgres redis -d
   ```

3. Set up backend:
   ```bash
   cd backend
   cp .env.example .env  # Add your OpenAI API key
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
- **APIs**: GitHub REST API, OpenAI API

## License

MIT
