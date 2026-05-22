# ProjectPath — AI 驱动的项目学习路径生成器

描述你的项目想法，基于真实 GitHub 项目生成个性化的学习路线图，支持时间线和思维导图两种视图。

## ✨ 功能

- **GitHub 驱动** — 分析真实开源项目，生成准确的路线图
- **AI 生成** — 使用 LLM 创建结构化、可执行的学习计划
- **双视图切换** — 时间线 + 思维导图
- **分享链接** — 一键生成可分享的路线图
- **收藏系统** — 收藏重要路线图，快速访问
- **进度追踪** — 勾选已完成任务，进度条实时显示
- **导出功能** — 支持导出 Markdown、Mermaid、PNG、PDF
- **历史记录** — 搜索、过滤、排序已生成的路线图
- **趋势分析** — 技术栈分布、复杂度统计、月度活动图表
- **移动端适配** — 响应式布局，手机也能用

## 🚀 快速开始

### 环境要求

- Docker & Docker Compose
- Node.js 18+
- Python 3.11+
- Anthropic API Key（用于 LLM 生成）
- GitHub Token（可选，提高 API 限额）

### 安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/wudiqingshuidawang/github-roadmap-generator.git
   cd github-roadmap-generator
   ```

2. 启动数据库服务：
   ```bash
   docker compose up postgres redis -d
   ```

3. 配置后端：
   ```bash
   cd backend
   cp .env.example .env   # 编辑 .env 填入你的 API Key
   pip install -e .
   alembic upgrade head
   uvicorn app.main:app --reload
   ```

4. 启动前端：
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. 打开 http://localhost:5173

## 🛠 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React, TypeScript, Tailwind CSS, D3.js |
| 后端 | Python, FastAPI, SQLAlchemy, Alembic |
| 数据库 | PostgreSQL, Redis |
| API | GitHub REST API, Anthropic API |
| 部署 | Docker Compose |

## 📁 项目结构

```
├── frontend/          # React 前端
│   ├── src/
│   │   ├── pages/     # 页面组件
│   │   ├── components/# UI 组件
│   │   ├── utils/     # 工具函数
│   │   ├── api/       # API 调用
│   │   └── types/     # TypeScript 类型
│   └── package.json
├── backend/           # FastAPI 后端
│   ├── app/
│   │   ├── api/       # 路由
│   │   ├── services/  # 业务逻辑
│   │   ├── models/    # 数据库模型
│   │   ├── schemas/   # Pydantic 模式
│   │   └── core/      # 配置、数据库、缓存
│   └── alembic/       # 数据库迁移
├── docker-compose.yml
└── README.md
```

## 📄 License

MIT
