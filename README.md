<div align="center">

# 历史记录 MCP 服务器

**一个轻量、可靠且易于集成的历史交互记录工具集。**

</div>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version" />
  <img src="https://img.shields.io/badge/license-ISC-green.svg" alt="License" />
  <img src="https://img.shields.io/badge/node-%3E%3D18.0-yellow.svg" alt="Node.js" />
  <img src="https://img.shields.io/badge/python-%3E%3D3.6-blue.svg" alt="Python" />
</p>

> 这是一个用于管理历史交互记录的工具集，包含一个由 Node.js 驱动的后端服务和一个功能强大的 Python 客户端，旨在提供一个稳定、灵活且对开发者友好的记录解决方案。

---

## ✨ 功能亮点

*   **📝 记录任意数据**: 轻松将任何文本或 JSON 对象作为历史记录进行存储。
*   **🔍 强大查询**: 支持分页、按日期、按关键字等多种方式查询记录。
*   **🖥️ 图形化管理**: 提供一个用 Python (Tkinter) 构建的图形用户界面 (GUI)，让您能方便地查看和添加记录。
*   **🤖 命令行集成**: 支持通过命令行参数直接添加记录，完美兼容自动化和脚本集成。
*   **📦 模块化设计**: 服务端和客户端代码均经过精心重构，结构清晰，易于扩展和维护。

---

## 📂 项目结构

```
.
├── src/                # Node.js 服务端源码
│   ├── db.ts           # 数据库连接与模型定义
│   ├── tools.ts        # MCP 工具定义与实现
│   └── index.ts        # 服务器主入口与通信层
├── client.py           # Python 客户端主程序 (GUI 与 CLI 逻辑)
├── mcp_client.py       # Python MCP 通信客户端模块
├── package.json        # 项目依赖与脚本
├── tsconfig.json       # TypeScript 编译配置
└── db.json             # 数据存储文件 (自动创建)
```

---

## 🚀 快速开始

### 安装

1.  **安装 Node.js 依赖**:
    ```bash
    npm install
    ```

2.  **编译 Node.js 服务**:
    *该步骤在首次运行客户端时会自动执行，但也可以手动运行。*
    ```bash
    npm run build
    ```

### 使用方法

本项目提供了两种与服务器交互的方式：

#### 1. 图形用户界面 (GUI)

直接运行 `client.py` 即可启动图形化客户端。

```bash
python client.py
```

这会打开一个窗口，您可以在其中：
*   **查看所有记录**: 记录会以时间倒序显示在主文本区。
*   **刷新记录**: 点击“刷新记录”按钮从服务器重新加载数据。
*   **添加新记录**: 点击“添加新记录”按钮，在弹出的对话框中输入任意文本即可。

#### 2. 命令行接口 (CLI)

您可以通过命令行参数直接与服务器交互，这对于自动化脚本非常有用。

##### 添加一条新记录

使用我们封装好的 npm 脚本（推荐）：

```bash
npm run record -- "这是一条需要记录的文本。"
```
> **提示**: 当消息中包含空格或特殊字符时，请务必使用引号将其包裹起来。`--` 分隔符是必需的，用于将参数正确地传递给 npm 脚本。

或者，直接使用 Python 脚本：

```bash
python client.py --add "这是一条需要记录的文本。"
