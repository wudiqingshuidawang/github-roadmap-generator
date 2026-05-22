# ProjectPath — AI 驱动的项目学习路径生成器

## 架构
- **前端:** React + TypeScript + Tailwind CSS + Vite，端口 5173
- **后端:** Python FastAPI + SQLAlchemy (async) + PostgreSQL + Redis，端口 8000
- **LLM:** Anthropic Claude API
- **GitHub API:** 搜索类似项目 + 读取 README

## 关键命令
```bash
# 前端
cd frontend && npm run build        # TypeScript 编译检查 + Vite 构建
cd frontend && npx tsc --noEmit     # 仅类型检查

# 后端
cd backend && python -m pytest tests/ -v  # 跑测试
cd backend && python -m py_compile app/api/roadmap.py  # 语法检查
```

## 代码规范
- Python: 使用 `logging` 模块，不要 `print`
- Python: 所有 public 函数必须有 type hints
- TypeScript: 禁止 `any` 类型
- TypeScript: 使用 zustand 管理状态，不要直接操作 localStorage
- 错误处理: 不要 `except Exception: pass`，至少 log
- UI 语言: 简体中文
- 组件: 每个组件单一职责，不超过 200 行

## 项目结构
```
backend/
  app/
    api/          # FastAPI 路由
    services/     # 业务逻辑（LLM、GitHub、Cache）
    models/       # SQLAlchemy ORM 模型
    schemas/      # Pydantic 请求/响应模型
    core/         # config、database、redis
  tests/          # pytest 测试

frontend/
  src/
    pages/        # 页面组件
    components/   # UI 组件
    stores/       # zustand 状态管理（目标状态）
    hooks/        # 自定义 hooks
    api/          # API 调用封装
    types/        # TypeScript 类型
    utils/        # 工具函数
```
