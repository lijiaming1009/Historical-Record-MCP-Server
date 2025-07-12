# Historical Record MCP Server

## 1. 介绍

本项目是一个基于模型上下文协议 (MCP) 的服务，旨在记录和管理与 AI 的历史交互。它提供了一套工具，用于添加和查询历史记录，并支持持久化存储、分页、过滤和数据导出等功能，可以方便地集成到 Kilo Code 或其他客户端应用程序中。

## 2. 功能特性

- **添加记录**: 快速添加新的交互记录。
- **查询记录**: 检索全部或部分历史记录。
- **持久化存储**: 使用轻量级的 `lowdb` 将所有记录存储在本地 `db.json` 文件中。
- **时间排序**: 记录默认按时间倒序存储和返回。
- **分页查询**: 支持按页码和每页数量查询，避免一次性加载大量数据。
- **时间范围过滤**: 可以根据开始和结束日期筛选记录。
- **关键词搜索**: 支持在交互内容中进行不区分大小写的关键词搜索。
- **数据导出**: 提供一个选项，可以一次性导出所有符合条件的记录。

## 3. 技术实现

### 3.1 技术选型

- **运行环境**: Node.js
- **开发语言**: TypeScript
- **核心依赖**:
  - `lowdb`: 一个轻量级的 JSON 文件数据库，用于持久化存储历史记录。
  - `zod`: 用于定义和验证工具的输入参数。
  - `uuid`: 用于为每条历史记录生成唯一的 ID。

### 3.2 架构与流程

本服务作为独立的后台进程运行，通过标准输入/输出 (stdio) 与 MCP 核心或其他调用方进行通信。

```mermaid
graph TD
    subgraph Client Environment
        A[Kilo Code UI / Client]
    end

    subgraph MCP Infrastructure
        B[MCP Core / Caller]
    end

    subgraph historical-record MCP Server
        C[Node.js Process]
        D[Tools (add/get)]
        E[lowdb (db.json)]
    end

    A -- "1. 调用工具 (Invoke tool)" --> B
    B -- "2. 转发请求 (stdio)" --> C
    C -- "3. 执行工具逻辑" --> D
    D -- "4. 访问数据" --> E
    E -- "5. 返回数据" --> D
    D -- "6. 返回结果" --> C
    C -- "7. 发送响应 (stdio)" --> B
    B -- "8. 返回最终结果" --> A
```

## 4. 安装与启动

### 4.1 安装依赖

在项目根目录下运行以下命令来安装所有必需的依赖项：

```bash
npm install
```

### 4.2 编译项目

如果对源代码 (`.ts` 文件) 进行了修改，需要运行以下命令来编译 TypeScript 代码：

```bash
npm run build
```

### 4.3 启动服务

使用以下命令来启动 MCP 服务：

```bash
npm start
```

服务启动后，它将首先输出一个包含其元数据（名称、版本、可用工具等）的 JSON 对象，然后进入监听状态，等待来自标准输入的请求。

### 4.4 快速上手 (从 GitHub 克隆)

对于从 GitHub 下载的全新用户，请按以下步骤操作：

```bash
# 1. 克隆仓库到本地
git clone <你的仓库URL>
cd <项目目录>

# 2. 安装依赖
npm install

# 3. 启动服务
npm start
```

## 5. API (工具) 使用说明

本服务通过标准输入/输出接收和发送 JSON 数据。

### 5.1 `add_historical_record`

添加一条新的历史记录。

- **请求 (Input)**:
  ```json
  {
    "id": "request-123",
    "tool": "add_historical_record",
    "input": {
      "content": { "user": "Hello", "ai": "Hi there!" }
    }
  }
  ```
- **响应 (Output)**:
  ```json
  {
    "id": "request-123",
    "result": {
      "success": true,
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    }
  }
  ```

### 5.2 `get_historical_records`

查询历史记录，支持多种过滤和分页选项。

- **参数 (Input)**:
  - `page: number` (可选, 默认 1): 分页查询的页码。
  - `limit: number` (可选, 默认 20): 每页返回的记录数。
  - `startDate: string` (可选, ISO 8601 格式): 时间范围查询的开始日期。
  - `endDate: string` (可选, ISO 8601 格式): 时间范围查询的结束日期。
  - `keyword: string` (可选): 根据内容中的关键词进行搜索。
  - `export: boolean` (可选, 默认 false): 如果为 `true`，则忽略分页，返回所有符合条件的记录。

- **请求示例 (分页查询)**:
  ```json
  {
    "id": "request-456",
    "tool": "get_historical_records",
    "input": {
      "page": 1,
      "limit": 10
    }
  }
  ```

- **响应示例 (分页查询)**:
  ```json
  {
    "id": "request-456",
    "result": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "data": [
        { "id": "...", "timestamp": "...", "content": "..." },
        ...
      ]
    }
  }
  ```

- **请求示例 (关键词和时间范围过滤)**:
  ```json
  {
    "id": "request-789",
    "tool": "get_historical_records",
    "input": {
      "keyword": "hello",
      "startDate": "2023-01-01T00:00:00.000Z"
    }
  }
```

## 6. 服务持久化运行 (可选)

默认情况下，通过 `npm start` 启动的服务会在关闭终端窗口后停止。这意味着，通常在每次启动 Kilo Code 准备使用此功能时，你都需要手动运行 `npm start` 来启动服务。

为了让服务在后台持续运行，并能随系统重启自动启动，推荐使用进程管理工具 `pm2`。

### 6.1 安装 pm2

这是一个全局安装，只需执行一次。

```bash
npm install pm2 -g
```

### 6.2 使用 pm2 启动服务

在项目根目录下运行以下命令。服务将会在后台启动。

```bash
# --name "historical-record" 为你的服务进程命名，方便后续管理
pm2 start npm --name "historical-record" -- start
```

### 6.3 管理服务

你可以使用以下命令来管理你的后台服务：

```bash
pm2 list          # 查看所有由 pm2 管理的服务状态
pm2 stop historical-record  # 停止服务
pm2 restart historical-record # 重启服务
pm2 logs historical-record  # 查看实时日志
pm2 delete historical-record # 从 pm2 列表中移除服务
```

### 6.4 设置开机自启

运行以下命令后，`pm2` 会生成一条指令，复制并执行该指令即可完成开机自启的设置。

```bash
pm2 startup
```

通过 `pm2` 进行配置后，你只需设置一次，服务便会长久在后台运行，无需每次都手动干预。
