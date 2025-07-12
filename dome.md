# historical-record
MCP 服务
## 介绍
    要求
    1. 需要提供一个接口，返回所有的历史记录。
    2. 历史记录需要按照时间倒序排列。
    3. 每条历史记录包含以下字段：
        - id: 唯一标识符
        - timestamp: 时间戳
        - content: 记录内容
    目的：
    1.完成KILO CODE 每次项目和AI 的交互记录
    2.提供一个接口，供前端展示历史记录。
    3.便于后续数据分析和处理。
    4.支持多种查询方式，如按时间范围查询等。
    5.支持分页查询，避免一次性返回过多数据。
    6.支持过滤功能，如按内容关键词过滤。
    7.最好是可以直接在kilo code中的首页 展示和使用，方便集成。
    8.支持数据导出功能，方便用户下载历史记录。
## 接口设计
### 获取历史记录
## 技术实现方案

### 1. 技术选型
- **运行环境**: Node.js
- **开发语言**: TypeScript
- **核心依赖**:
  - `@modelcontextprotocol/sdk`: 用于构建 MCP 服务。
  - `lowdb`: 一个轻量级的 JSON 文件数据库，用于持久化存储历史记录。
  - `zod`: 用于定义和验证工具的输入参数。
  - `uuid`: 用于为每条历史记录生成唯一的 ID。

### 2. 架构设计
服务将作为本地后台进程运行，通过 MCP 基础设施暴露工具接口。

```mermaid
graph TD
    subgraph Kilo Code Environment
        A[Kilo Code UI / Client]
    end

    subgraph MCP Infrastructure
        B[MCP Core]
    end

    subgraph historical-record MCP Server
        C[Node.js Process]
        D[Tools (add/get)]
        E[lowdb (db.json)]
    end

    A -- "Invoke tool" --> B
    B -- "Forwards request (stdio)" --> C
    C -- "Executes tool logic" --> D
    D -- "Accesses data" --> E
    E -- "Returns data" --> D
    D -- "Returns result" --> C
    C -- "Sends response (stdio)" --> B
    B -- "Returns result" --> A
```

### 3. 数据模型
每条历史记录将遵循以下 TypeScript 接口定义：

```typescript
interface HistoricalRecord {
  id: string;          // 唯一标识符 (UUID)
  timestamp: string;   // ISO 8601 格式的时间戳
  content: any;        // 交互内容，可以是任意结构
}
```

### 4. 工具 (API) 设计

#### 4.1 添加历史记录
- **工具名称**: `add_historical_record`
- **功能描述**: 添加一条新的交互记录到数据库。
- **输入参数**:
  - `content: any`: 必需，要存储的交互内容。

#### 4.2 获取历史记录
- **工具名称**: `get_historical_records`
- **功能描述**: 查询历史记录，支持多种过滤和格式化选项。
- **输入参数**:
  - `page: number` (可选, 默认 1): 分页查询的页码。
  - `limit: number` (可选, 默认 20): 每页返回的记录数。
  - `startDate: string` (可选, ISO 8601 格式): 时间范围查询的开始日期。
  - `endDate: string` (可选, ISO 8601 格式): 时间范围查询的结束日期。
  - `keyword: string` (可选): 根据内容中的关键词进行搜索（不区分大小写）。
  - `export: boolean` (可选, 默认 false): 如果为 `true`，则忽略分页，返回所有符合条件的记录。