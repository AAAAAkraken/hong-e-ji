# 红萼纪

> 红萼一纪，念念有你。

本地 DeepSeek 聊天桌面应用。所有数据存储在本地，保护隐私，无需联网登录。

## 功能

- 💬 与 DeepSeek 实时流式对话
- 🔒 聊天记录、API Key 和设置保存在本地；仅在发送消息时请求 DeepSeek API
- 🎨 浅色主题，简洁清爽
- ✏️ 自定义 AI 名字和头像（支持上传照片）
- 👤 自定义用户名字和头像
- 🖼️ 自定义应用图标（设置 → 选择图标文件 → 重启生效）
- ✍️ 双击对话标题重命名
- 📐 支持 LaTeX 数学公式渲染（KaTeX）
- 📥 支持从 JSON 文件导入聊天记录
- 📎 支持发送文本文件让 AI 阅读
- 🖼️ 支持图片附件占位提示，暂不支持图片识别
- 📦 可打包为 Windows 安装程序（.exe）

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Electron 28 |
| 前端 | React 18 + TypeScript |
| 数据库 | SQLite（sql.js） |
| API | DeepSeek API（OpenAI 兼容） |
| 公式渲染 | KaTeX |
| 打包 | electron-builder（NSIS 安装包） |

## 前置条件

- [Node.js](https://nodejs.org/) 18.x 或更高版本
- npm（随 Node.js 一起安装）

> 国内用户建议先设置 npm 镜像，下载更快：
> ```bash
> npm config set registry https://registry.npmmirror.com
> ```

## 快速开始

```bash
# 1. 安装依赖（首次运行必须执行）
npm install

# 2. 编译
npm run build

# 3. 启动
npx electron .
```

### 配置

打开应用 → 点击左下角「⚙️ 设置」→ 填入 DeepSeek API Key → 保存。

> 获取 API Key：[platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
>
> 💡 设置中还能修改 AI 名字/头像、你的名字/头像，以及更换应用图标（重启后生效）。

## 导入聊天记录

支持从 JSON 文件导入历史对话。点击左下角「📥 导入记录」，选择 JSON 文件即可。

JSON 文件格式如下：

```json
{
  "title": "对话标题",
  "messages": [
    { "role": "user", "content": "你好" },
    { "role": "assistant", "content": "你好！有什么可以帮你的？" },
    { "role": "user", "content": "今天天气怎么样" },
    { "role": "assistant", "content": "抱歉，我无法获取实时天气..." }
  ]
}
```

> `role` 必须是 `user`（用户）或 `assistant`（AI）。也支持纯消息数组格式（不含 `title`）。

## 使用技巧

**重命名对话：** 双击左侧对话列表中的任意标题，输入新名字后回车即可。

**数学公式：** 对话中支持 LaTeX 公式渲染（KaTeX）：
- 行内公式：`$E=mc^2$`
- 独立公式：`$$\int_0^\infty x^2 dx$$`

**导入聊天记录：** DeepSeek 分享页面 → 保存网页 → 提取对话内容，按上方 JSON 格式整理后导入。

### 打包为 exe

**CMD：**
```batch
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm run pack
```

**PowerShell：**
```powershell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm run pack
```

⚠️ 打包需要**以管理员身份运行**，否则可能因权限问题失败。

安装包生成在 `release/` 目录下。

> **注意：**
> - 本项目不包含 `node_modules`（依赖库），clone 后必须运行 `npm install`
> - 本项目不提交 `dist/`（编译输出），运行 `npm run build` 后自动生成

## 自定义图标

项目不含图标文件（属于个人隐私）。如需更换应用图标：

1. 在项目根目录创建 `assets/` 文件夹
2. 放入你的图标文件：
   - **开发运行**：`assets/icon.ico`（推荐，Windows 原生格式）
   - **打包 exe**：同样使用 `assets/icon.ico`，electron-builder 会自动嵌入
3. 重新编译并启动：`npm run build && npx electron .`
4. 图标建议尺寸 ≥ 256×256，格式支持 PNG、JPG、ICO

> 💡 更简单的方式：在应用内打开「设置 → 应用图标」直接选择图片，重启即生效，无需手动创建文件夹。

## 项目结构

```
deepseek-local-chat/
├── electron/             # Electron 主进程
│   ├── main.ts           # 应用入口，窗口管理，IPC 注册
│   ├── preload.ts        # IPC 安全桥接层
│   ├── database.ts       # SQLite 数据库增删改查
│   ├── deepseek.ts       # DeepSeek API 流式调用
│   ├── import.ts         # 聊天记录 JSON 导入
│   ├── types.ts          # 后端类型定义
│   └── uuid.ts           # 唯一 ID 生成
├── src/                  # React 前端
│   ├── components/       # UI 组件（侧边栏、聊天、设置等 6 个）
│   ├── hooks/            # 聊天状态管理 Hook
│   └── styles/           # 样式文件（浅色主题，7 个 CSS）
├── assets/               # 图标资源（未包含在仓库中，请自行准备）
├── package.json          # 项目配置（依赖、脚本、打包）
├── tsconfig.json         # TypeScript 配置（前端）
├── tsconfig.electron.json # TypeScript 配置（后端）
└── webpack.renderer.config.js  # Webpack 打包配置
```

## 隐私说明

- ✅ 所有聊天记录存储在本地 SQLite 数据库
- ✅ API Key 仅保存在本地
- ✅ 不包含任何埋点、遥测、统计
- ✅ 除用户主动发送给 DeepSeek API 的消息外，不上传本地数据库、导入文件或头像设置
- ✅ 断网后除 API 调用外一切正常

## 许可

MIT
