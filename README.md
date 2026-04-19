# Baby Food Tracker

宝宝辅食排敏小工具（最终版本）。

## 项目结构

- `index.html`：稳定入口，仅加载资源并挂载应用
- `styles.css`：页面样式与主题配色
- `app.js`：应用模板、交互逻辑、数据持久化与导入导出

## 说明

- 已完全移除早期“食物转盘”实现。
- 当前代码仅保留最终的排敏工具版本。

## Vercel 部署

该项目是纯静态站点，可直接部署到 Vercel。

### 方式 1：Vercel Dashboard（推荐）
1. 将仓库推送到 GitHub。
2. 在 Vercel 中 **Add New Project**，导入该仓库。
3. Framework Preset 选择 **Other**。
4. Build Command 留空；Output Directory 留空（根目录）。
5. 点击 Deploy。

### 方式 2：Vercel CLI
```bash
vercel --prod
```

> 当前仓库已包含 `vercel.json`，会将所有路由重写到 `index.html`，适配单页应用。
