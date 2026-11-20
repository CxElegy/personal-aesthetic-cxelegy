# personal-aesthetic-cxelegy

我的审美档案，让 AI 按我的审美做事。

- `AESTHETIC.md`：审美规则（核心文件，给 AI 读）
- `references/`：素材
  - `visual/`：喜欢或讨厌的设计、海报、网站、照片截图
  - `writing/`：喜欢的文字片段、文案
  - `product/`：喜欢的 App、交互
  - `motion/`：动效录屏
  - `xhs/`：用 `tools/xhs/fetch.js` 抓下来的小红书笔记
  - 文件名可以写上态度，例如 `like-某网站首页.png`、`dislike-渐变按钮.png`

## 怎么喂素材
把素材放进 `references/`，然后对 Claude 说「根据新素材更新审美档案」。也可以直接说「我喜欢 X，因为 Y」。

## 怎么在别处用
- **Claude Code（所有项目）**：把 `AESTHETIC.md` 的内容放进 `~/.claude/CLAUDE.md`，或在项目的 CLAUDE.md 里写一句「遵循 <路径>/AESTHETIC.md」。
- **claude.ai**：设置 → Profile 的个人偏好里粘贴，或放进某个 Project 的说明 / 知识库。
- **其他 AI**：把 `AESTHETIC.md` 作为系统提示词或对话开头粘贴。
