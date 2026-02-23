# Jack Nova Defense (Jack新星防御)

这是一个使用 React + Vite + Tailwind CSS 开发的塔防游戏。

## 部署到 Vercel 指南

1. **上传到 GitHub**:
   - 在 GitHub 上创建一个新的仓库。
   - 将此项目的所有文件推送到该仓库。

2. **连接到 Vercel**:
   - 登录 [Vercel](https://vercel.com/)。
   - 点击 "Add New" -> "Project"。
   - 导入你刚才创建的 GitHub 仓库。

3. **配置环境变量**:
   - 在 Vercel 的项目设置中，找到 "Environment Variables"。
   - 添加一个名为 `GEMINI_API_KEY` 的变量（如果你在游戏中使用了 Gemini AI 功能）。
   - 如果没有使用 AI 功能，可以跳过此步。

4. **部署**:
   - 点击 "Deploy"。Vercel 会自动识别 Vite 配置并完成构建。

## 本地开发

```bash
npm install
npm run dev
```

## 构建生产版本

```bash
npm run build
```
