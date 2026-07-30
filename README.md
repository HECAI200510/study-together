# StudyTogether

StudyTogether 是一个面向计算机专业学生的轻量学习管理系统，将每日计划、学习复盘、GitHub 提交记录和长期成长数据集中在同一个 Dashboard 中。

项目使用原生 HTML、CSS 和 JavaScript 构建，不依赖服务端或构建工具，可直接通过 GitHub Pages 部署。

## 功能

- 每日任务管理：添加、完成和删除任务，自动计算完成率与学习时长
- 学习日志：记录今日收获、遇到的问题和明日计划
- Markdown 导出：一键生成当天的学习日志文件
- GitHub 学习记录：展示 Commit、最近提交和学习热力图
- 成长统计：集中展示学习等级、累计时间、连续天数和学习分布
- 本地持久化：任务与日志保存在浏览器 `localStorage` 中
- 响应式设计：适配桌面、平板和手机

## 使用方法

无需安装依赖。克隆仓库后，直接用浏览器打开 `index.html` 即可：

```bash
git clone https://github.com/HECAI200510/study-together.git
cd study-together
```

也可以使用任意静态文件服务器进行本地预览，例如 VS Code Live Server。

页面中的任务和日志仅存储在当前浏览器。更换设备或清除浏览器数据前，建议先点击“导出今日日志”，并将生成的 Markdown 文件保存到 `daily/`。

## GitHub Pages 部署

1. 打开仓库的 **Settings**。
2. 在左侧选择 **Pages**。
3. 在 **Build and deployment** 中将 Source 设为 **Deploy from a branch**。
4. Branch 选择 `main`，目录选择 `/ (root)`。
5. 点击 **Save**，等待 GitHub Actions 完成首次部署。

部署成功后的默认地址：

<https://hecai200510.github.io/study-together/>

## 学习流程

1. **计划**：每天开始学习前，在 Dashboard 中写下可验证的任务。
2. **执行**：完成任务后及时打勾，让进度和学习时长保持准确。
3. **复盘**：记录学会的内容、卡点和已经尝试过的解决方案。
4. **留痕**：导出 Markdown 日志并和练习代码一起提交到 GitHub。
5. **回顾**：每周检查任务完成率、Commit 记录和学习时间分布。

详细流程参见 [docs/workflow.md](docs/workflow.md)，每日日志格式参见 [daily/template.md](daily/template.md)。

## 项目结构

```text
study-together/
├── assets/
│   └── logo.svg
├── css/
│   └── style.css
├── daily/
│   └── template.md
├── docs/
│   └── workflow.md
├── js/
│   ├── app.js
│   └── data.js
├── .gitignore
├── index.html
└── README.md
```

## 技术栈

- HTML5
- CSS3
- Vanilla JavaScript
- GitHub Pages

## 数据与隐私

当前版本不会将个人学习数据上传到服务器。Dashboard 中的任务、完成状态和日志都保存在浏览器本地；仓库内 `js/data.js` 的 GitHub 数据是静态演示数据，可按需要替换为自己的记录。
