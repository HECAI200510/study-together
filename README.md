# StudyTogether

StudyTogether 是一个轻量的 GitHub 学习监督工具，用于帮助一名学习者每天填写计划、勾选完成情况、进行复盘，并把 Markdown 日报和真实学习成果提交到 GitHub。

它不是学校教务系统，不是多人学习 SaaS，也不是自动监控软件。网页不会读取 GitHub Commit、不会判断学习质量，也不会替代监督者的人工检查。

## 工作方式

学习者每天完成以下流程：

1. 打开网页，填写姓名、学习方向和今日目标时间。
2. 把学习计划拆成可以验证的任务。
3. 为每项任务填写完成标准和学习分钟数。
4. 完成一项后勾选一项。
5. 写下今天学会的内容、遇到的问题和明日计划。
6. 导出 `YYYY-MM-DD.md` 日报。
7. 把日报、代码练习和必要的笔记一起提交到 GitHub。

监督者每周查看提交内容、完成率与复盘质量，而不是只数 Commit 或绿色贡献格子。

## 数据保存与隐私

本项目是纯静态网页，不使用服务器和数据库。

网页填写的数据默认保存在当前浏览器的 `LocalStorage`：

- 刷新页面后，当天内容一般仍然存在。
- 更换浏览器或设备不会自动同步。
- 清理浏览器数据可能导致本地记录消失。
- 真正的长期记录必须导出 Markdown 并提交到 GitHub。

页面不会请求 GitHub Token，也不会从浏览器直接写入仓库。

## 使用方法

克隆仓库后直接打开根目录的 `index.html`，或使用任意静态文件服务器：

```bash
git clone https://github.com/HECAI200510/study-together.git
cd study-together
```

无需安装依赖或执行构建命令。

## 如何填写每日计划

任务应该包含三个要素：

- **任务名称**：今天要做什么。
- **完成标准**：怎样才算完成，必须能够检查。
- **学习分钟数**：预计或实际投入的有效时间。

不够具体：

> 看完 Python 课程。

更好的写法：

> 理解 Python 列表切片的开始、结束和步长，并独立完成 3 道练习。

默认任务只是可编辑示例，不代表用户已经完成学习。

## 导出与上传

点击网页中的“导出今日 Markdown”，浏览器会下载 `YYYY-MM-DD.md`。也可以点击“复制 Markdown 内容”后粘贴到本地文件。

推荐把日报保存为：

```text
daily/
└── friend-name/
    ├── 2026-07-30.md
    ├── 2026-07-31.md
    └── 2026-08-01.md
```

学习代码建议按方向整理：

```text
practice/
├── python/
├── algorithms/
└── projects/
```

一次完整提交应包含：

- 当天的 Markdown 日报
- 实际编写的代码或练习题
- 必要的学习笔记
- 项目链接或少量关键截图（如确有需要）

示例提交信息：

```text
Day 01: Python loops and 3 exercises
```

## 监督者每周检查

监督者应检查：

- 日报是否写得具体，而不是只有“看完了”“学了一会儿”
- 勾选的任务是否有对应代码、练习或笔记
- 遇到的问题是否记录了尝试过程
- 学习计划是否连续过大、过小或长期延期
- 下周计划是否根据本周问题做了调整

GitHub 的绿色贡献图只能说明发生过提交，不能证明学习时长、内容质量或是否真正理解。判断学习质量必须查看日报和实际成果。

## 仓库体积建议

Markdown、源代码和少量笔记占用很小，正常长期使用通常不会轻易耗尽 GitHub 仓库存储。

不要提交：

- `node_modules/`
- `.venv/` 或 `venv/`
- Unity 的 `Library/`、`Temp/`、`Logs/`
- 大型视频、PSD、软件安装包
- 构建产物和缓存文件
- 重复的大型二进制文件

## 项目结构

```text
study-together/
├── css/
│   └── style.css
├── daily/
│   └── README.md
├── js/
│   └── app.js
├── templates/
│   └── daily-template.md
├── .gitignore
├── index.html
└── README.md
```

## GitHub Pages

`index.html` 位于仓库根目录，可以直接使用 GitHub Pages 发布。

在仓库中依次打开：

```text
Settings → Pages → Deploy from a branch → main → / (root) → Save
```

部署成功后的实际网站地址：

<https://hecai200510.github.io/study-together/>

仓库页面与网站页面不同：

- 仓库：<https://github.com/HECAI200510/study-together>
- 网站：<https://hecai200510.github.io/study-together/>
