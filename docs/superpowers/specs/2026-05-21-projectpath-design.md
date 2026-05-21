# ProjectPath — AI 项目学习路线图生成器

## 产品定位

**一句话定位**：输入你想做的项目，AI 帮你拆解成可执行的学习路线图。

**目标用户**：想转行/自学 CS 的人，不知道从哪开始、怎么拆解一个项目。

**核心差异化**：基于 GitHub 真实项目数据 + LLM 生成，不是纯 LLM 编造。

## 核心流程

```
用户输入项目描述
       ↓
GitHub API 搜索同类项目（按 stars 排序）
       ↓
分析 top 项目的技术栈、目录结构、README
       ↓
真实数据作为上下文 → 喂给 LLM
       ↓
LLM 基于真实数据生成结构化路线图
       ↓
前端渲染（时间线 + 思维导图双视图）
```

## 技术架构

### 前端
- React + TypeScript
- 可视化：D3.js（思维导图）+ 自定义组件（时间线）
- UI：Tailwind CSS + shadcn/ui
- 状态管理：Zustand

### 后端
- Python + FastAPI
- LLM API：OpenAI GPT-4 / Claude API
- GitHub API：REST API（requests 库）
- 数据库：PostgreSQL（JSONB）
- 缓存：Redis

### 部署
- 前端：Vercel
- 后端：Railway / Fly.io

## 数据模型

```sql
-- 项目表
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 路线图表
CREATE TABLE roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id),
    share_token VARCHAR(32) UNIQUE,
    github_refs JSONB,              -- 引用的 GitHub 项目
    tech_stack JSONB,               -- 推荐技术栈
    phases JSONB,                   -- 阶段数据（核心）
    llm_model VARCHAR(50),
    llm_tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 缓存表
CREATE TABLE cache (
    key VARCHAR(64) PRIMARY KEY,    -- SHA256 哈希
    response JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### JSONB 结构（phases 字段）

```json
[
  {
    "name": "前端基础",
    "duration": "2周",
    "tasks": [
      {
        "title": "学习 React 基础",
        "description": "掌握 JSX、组件、状态管理",
        "resources": [
          {"type": "github", "title": "react 官方示例", "url": "https://github.com/..."},
          {"type": "doc", "title": "React 文档", "url": "https://react.dev"}
        ],
        "difficulty": "beginner",
        "dependencies": []
      }
    ]
  }
]
```

## GitHub API 集成

### 搜索同类项目
```
GET /search/repositories?q={用户输入关键词}&sort=stars&per_page=5
```

### 分析项目技术栈
```
GET /repos/{owner}/{repo}/contents/package.json      # Node.js 项目
GET /repos/{owner}/{repo}/contents/requirements.txt   # Python 项目
```

### 获取项目结构
```
GET /repos/{owner}/{repo}/git/trees/main?recursive=1
```

### 获取 README
```
GET /repos/{owner}/{repo}/readme
```

### API 限制
- 未认证：60 次/小时
- Token 认证：5000 次/小时
- MVP 阶段未认证够用，后期加 Token

## LLM Prompt 设计

### System Prompt
```
你是一个项目规划专家。根据用户想做的项目和 GitHub 上真实项目的数据，
生成一份详细的学习路线图。

输出必须是 JSON 格式，包含以下字段：
- tech_stack: 推荐技术栈列表，每项包含名称和理由
- phases: 学习阶段列表

每个阶段包含：
- name: 阶段名称
- duration: 预估学习时间
- tasks: 任务列表

每个任务包含：
- title: 任务标题
- description: 详细描述
- resources: 学习资源列表（优先使用提供的 GitHub 项目链接）
- difficulty: beginner/intermediate/advanced
- dependencies: 依赖的前置任务标题列表
```

### User Prompt 模板
```
用户想做的项目：{用户输入}

以下是 GitHub 上类似的热门项目：
{GitHub API 返回的项目列表和技术栈分析}

请基于以上真实数据，生成学习路线图。
```

## API 接口

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/roadmap/generate` | 输入项目描述，生成路线图 |
| GET | `/api/roadmap/{share_token}` | 通过分享链接获取路线图 |
| GET | `/api/roadmap/{id}` | 获取路线图详情 |

## 前端页面

### 首页（`/`）
- 产品介绍 + 输入框
- 用户输入项目描述 → 点击生成

### 生成中页（`/generating`）
- Loading 动画 + 进度提示
- 前端轮询后端（每 2 秒查一次状态），生成完成后跳转路线图页

### 路线图页（`/roadmap/{share_token}`）
- 默认：垂直时间线视图
- 可切换：思维导图视图
- 顶部：项目名称 + 技术栈标签
- 操作：导出 PDF、复制分享链接

## 渲染方案

**采用结构化 JSON + React 组件渲染**（非 LLM 直接生成 HTML）。

原因：
- 需要交互功能（展开/折叠、视图切换）
- 需要响应式布局
- 需要一致的 UI 设计
- 需要导出 PDF
- 安全，无 XSS 风险

LLM 输出结构化 JSON → 前端用 React 组件渲染为时间线/思维导图。

## 可视化方案

### 视图 A：垂直时间线
- 从上到下展示学习阶段
- 每个阶段是一张卡片，显示技术栈、子任务、时间估算
- 适合看学习进度

### 视图 B：思维导图
- 中心是项目目标，向外辐射技术栈和子任务
- 可展开/折叠节点
- 适合看项目全貌

### 实现
- 默认展示时间线视图
- 右上角切换按钮切换到思维导图
- 两种视图数据源相同，只是渲染方式不同

## 缓存策略

**MVP 阶段使用 Redis**：

```
key: "roadmap:{SHA256(用户输入)}"
value: LLM 返回的完整 JSON
TTL: 7 天
```

- 相同输入直接返回缓存
- 节省 API 费用
- 后期可加 pgvector 做语义缓存

PostgreSQL 中的 cache 表作为持久化备份（Redis 重启后可恢复）。

## 错误处理

- GitHub API 失败 → 降级为纯 LLM 生成（无真实数据参考）
- LLM API 超时 → 重试 3 次 → 提示用户稍后重试
- LLM 输出格式错误 → 带错误信息重新调用 → 最多重试 2 次
- 分享链接无效 → 404 页面

## 测试策略

- 后端：pytest 测试 API 接口 + LLM 输出校验
- 前端：组件测试（Vitest）
- E2E：核心流程端到端测试（Playwright，可选）

## MVP 完成标准

1. 用户输入项目描述 → 生成路线图（时间线视图）
2. 路线图可切换思维导图视图
3. 路线图可保存、生成分享链接
4. 分享链接可访问
5. GitHub API 集成（搜索同类项目）
6. Redis 缓存生效
7. 基本错误处理
8. 部署上线，可公开访问

## 项目结构

```
projectpath/
├── frontend/                # React 前端
│   ├── src/
│   │   ├── components/      # UI 组件
│   │   ├── pages/           # 页面
│   │   ├── hooks/           # 自定义 hooks
│   │   ├── utils/           # 工具函数
│   │   └── types/           # TypeScript 类型
│   ├── package.json
│   └── tsconfig.json
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── api/             # API 路由
│   │   ├── core/            # 配置、数据库连接
│   │   ├── services/        # 业务逻辑
│   │   │   ├── github.py    # GitHub API 调用
│   │   │   ├── llm.py       # LLM API 调用
│   │   │   └── cache.py     # 缓存逻辑
│   │   └── models/          # 数据模型
│   ├── tests/
│   ├── requirements.txt
│   └── main.py
├── docs/                    # 文档
├── docker-compose.yml       # 本地开发环境
└── README.md
```
