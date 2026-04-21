# Baby Food Tracker（本地优先 / 纯前端 / 可离线）

本项目已重构为 **单机 Web App**：
- 无后端
- 无账号系统
- 无线上数据库
- 核心数据存储在浏览器本地 IndexedDB

## 1) 新文件结构

```text
.
├── index.html
├── styles.css
├── sw.js
├── vercel.json
└── js
    ├── app.js
    ├── db.js
    ├── storage.js
    ├── ui.js
    └── utils.js
```

## 2) 本地运行方法

### 方式 A：VS Code Live Server
直接右键 `index.html` -> Open with Live Server。

### 方式 B：Python 静态服务器
```bash
python -m http.server 8000
```
打开：`http://localhost:8000`

### 方式 C：任意 localhost 静态服务
只要是本地静态服务器即可（建议不要使用 `file://` 作为主要运行方式）。

## 3) IndexedDB 实现说明

数据库名称：`appLocalDB`

Object Stores：
- `settings`（UI 偏好设置）
- `entities`（主业务状态）
- `records`（复盘记录）

封装 API（`js/db.js`）：
- `initDB()`
- `getAll(storeName)`
- `getById(storeName, id)`
- `add(storeName, data)`
- `update(storeName, data)`
- `remove(storeName, id)`
- `clearStore(storeName)`
- `exportAllData()`
- `importAllData()`

## 4) 数据安全能力

已支持：
- 本地 JSON 全量导出
- JSON 全量导入恢复
- 清空本地数据（confirm 二次确认）

## 5) 后续可扩展建议

- 增加数据版本迁移（IndexedDB migration）
- 增加数据压缩导入导出
- 增加 PWA manifest 与安装到桌面能力
- 增加离线冲突检测与恢复提示
- 增加更细粒度的 UI 主题设置（仅存储在 `settings`）
