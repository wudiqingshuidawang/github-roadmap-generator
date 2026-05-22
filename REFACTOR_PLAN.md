# ProjectPath 重构计划 — Senior Engineer Review Fix

## P0 — 必须修

### 1. LLM 返回值校验
**文件:** `backend/app/api/roadmap.py`, `backend/app/schemas/roadmap.py`
**问题:** LLM 返回的 JSON 没有 schema 校验就直接存库，脏数据会导致前端崩溃
**方案:**
- 在 `schemas/roadmap.py` 新增 `LLMOutput` 模型，包含 `tech_stack: list[TechStackItem]` 和 `phases: list[Phase]`
- 在 `api/roadmap.py` 的 `generate_roadmap` 中，`result["data"]` 必须通过 `LLMOutput.model_validate()` 校验
- 校验失败返回 502，附带具体校验错误信息

### 2. 异常处理加 logging
**文件:** `backend/app/api/roadmap.py`, `backend/app/services/llm.py`
**问题:** `except Exception: pass` 吞异常，`print` 代替 logging
**方案:**
- 全局 import `logging`，每个模块 `logger = logging.getLogger(__name__)`
- `api/roadmap.py` 的 GitHub catch 改为 `logger.warning(...)`
- `services/llm.py` 的 `print` 改为 `logger.warning/error`
- 新增 `backend/app/core/logging.py` 配置 structured logging（JSON 格式，方便生产环境采集）

### 3. share_token 碰撞检测
**文件:** `backend/app/api/roadmap.py`
**方案:** 生成 token 后查数据库是否已存在，循环直到唯一

### 4. localStorage 容量保护
**文件:** `frontend/src/utils/progress.ts`, `frontend/src/utils/history.ts`
**方案:** `setItem` 包 try-catch，失败时清理最旧数据后重试

### 5. config 默认值去掉明文密码
**文件:** `backend/app/core/config.py`
**方案:** `database_url` 默认值改为空字符串，启动时检查必填

## P1 — 架构改进

### 6. 状态管理迁移到 zustand
**文件:** 新建 `frontend/src/stores/`
**方案:**
- `useHistoryStore` — zustand + persist middleware
- `useFavoritesStore` — zustand + persist middleware  
- `useProgressStore` — zustand + persist middleware
- 删除 `utils/history.ts`, `utils/favorites.ts`, `utils/progress.ts`
- 更新所有引用这些 utils 的组件

### 7. 后端 Service 依赖注入
**文件:** `backend/app/services/llm.py`, `backend/app/services/github.py`
**方案:** `__init__` 参数全部必填，不从全局 settings 读取。调用方负责传入配置

### 8. 拆分 generate_roadmap handler
**文件:** `backend/app/api/roadmap.py`
**方案:** 提取 `_search_github()`, `_generate_llm()`, `_save_roadmap()` 私有函数，主 handler 只做编排

### 9. 前端 API 层统一错误处理
**文件:** `frontend/src/api/roadmap.ts`
**方案:**
- 封装 `apiClient` 函数，统一处理超时、网络错误、HTTP 错误
- 添加请求超时配置
- 错误消息统一格式

### 10. 前端提取 useRoadmap hook
**文件:** 新建 `frontend/src/hooks/useRoadmap.ts`
**方案:** RoadmapPage 的数据获取、错误处理、view 状态都放进 hook

## P2 — 工程规范

### 11. 前端 ESLint 配置
**文件:** `frontend/.eslintrc.json`
**方案:** 添加 ESLint 配置，CI 中跑 lint

### 12. Dockerfile
**文件:** `backend/Dockerfile`
**方案:** 创建后端 Dockerfile，docker-compose 能正常 build

### 13. difficulty 类型改为 union
**文件:** `frontend/src/types/roadmap.ts`
**方案:** `difficulty: "beginner" | "intermediate" | "advanced"`

---

## 执行顺序
1. P0 全部（5项）
2. P1 的 6（zustand 迁移，影响面最大，先做）
3. P1 的 7、8、9、10
4. P2 的 11、12、13
