# 给 Claude 的说明

这个仓库是用户的个人审美档案，核心文件是 `AESTHETIC.md`。

## 来源
- `references/product/wishlist-*.md`：从 CxElegy/Wishlist 复制的原文（带我的原话和日期）。Wishlist 里的规则更新后，重新同步并更新 `AESTHETIC.md`。

## 在这个仓库里工作时
- 用户往 `references/` 里放了新素材（图片、截图、链接、文字片段），或者告诉你喜欢 / 不喜欢什么时：
  1. 认真看素材，找出共同点，而不是逐个描述。
  2. 把结论写成**具体、可执行**的规则更新到 `AESTHETIC.md`，例如「主色用低饱和暖灰，类似 #EDE8E2」，而不是「喜欢高级感」。
  3. 在「参考对象」表格里记一行，在「更新记录」里写日期和改了什么。
  4. 只从一两个素材推断出的规则标为「待确认」，有新证据再确认或删除。
- 与已有规则冲突时，不要静默覆盖，向用户确认。

## 两个会话的分工（2026-11-21 用户定的）
- **投稿会话**（主会话「审美图鉴 · 投稿」）：用户发链接、说喜欢什么 → 抓取素材、写 `AESTHETIC.md` 和 `references/`、在 `catalog/items.json` 登记新条目（状态先设为 `queued` 或 `n/a`，可以写 `plan` 草稿）。**不做复刻。**
- **复刻会话**（「审美图鉴 · REA 复刻」）：按 `tools/replicate/METHOD.md` 做复刻、对比、打分、循环改进。主要改 `demos/`、`verify/`、`tools/verify/`、`tools/replicate/`，以及条目的 `demo` / `status` / `verify` / `plan` / `evidence` 字段；不改 `AESTHETIC.md` 和 `references/`。
- 两边推同一个分支：**提交前先 `git pull --rebase`**，小步提交；`catalog/items.json` 冲突时保留对方新增的条目，只合并自己负责的字段。

## 小红书素材
- 用 `tools/xhs/fetch.js` 抓取（见 `tools/xhs/README.md`）。不要伪装身份或绕过登录；需要登录时用户扫码（云端：`XHS_HEADLESS=1`，二维码截图发给用户）。登录状态缓存在 `~/.cache/rednote-profile`，不进仓库。
- 抓完后看每条的图片、`contact-sheet.jpg` 和 `frame-*.jpg`，填写 `note.md` 的「学到的」，再按上面的步骤更新 `AESTHETIC.md`。
- **提示词类笔记**（2026-11-21 用户定的）：必须把提示词**全文**存下来。来源按正文 → 图片里的文字 → 评论区的顺序找；存进条目的 `prompts`（`name` / `text` / `note`），网站详情页会显示并可复制。找不全的，在 `note` 里写清缺了哪段、在哪（例如「在评论区，需要登录才能看」）。

## 演示（demos/）
- 学到的交互、动效、视觉效果都要做成单文件 HTML 演示放进 `demos/`（不依赖构建，直接用浏览器打开），用 Playwright 实际操作并截图检查，再在 `AESTHETIC.md` 对应条目里写上演示路径。

## 审美图鉴网站（整套流程）
复刻按 `tools/replicate/METHOD.md`（改编自 REA 和 self-learning-loop）：先找源头 → 证据标信心 → 动手前写清单（`verify/checklists/<id>.md`，用户确认）→ 做 → 对比 + 独立复查 + 差距报告 → 循环到必须项连续两轮通过 → 经验写进 `tools/replicate/LESSONS.md`。

1. **抓取**：`node tools/xhs/fetch.js <链接>`（云端加 `XHS_HEADLESS=1`）→ `node tools/xhs/media.js <文件夹>` 下载图片视频、抽关键帧。
2. **学习**：看图片和 `contact-sheet.jpg`，写进 `AESTHETIC.md` 和该条 `note.md` 的「学到的」。
3. **登记**：在 `catalog/items.json` 加一条：分类（`categories` 里的 id）、标签、摘要、来源、`video`（数据库里的路径 `xhs/<笔记id>.mp4`）、状态。
4. **复刻**（能便宜复刻的就做）：单文件 HTML 放 `demos/`，在 `tools/verify/scenarios.js` 写操作剧本。
5. **核对**：按 `tools/verify/RUBRIC.md` 打分（10 分制，五个维度加权，先做「一秒钟测试」，有硬性封顶）。**宁可打低，不要只看功能齐不齐**；每条都写差距分析（原作技术 / 我的技术 / 为什么没做到 / 提分路线）。用户打分后写进 RUBRIC.md 的校准记录，差 1 分以上就修改标准。
5a. 原来的核对：`node tools/verify/compare.js <id>` 生成 `verify/<id>.jpg`（上排原作、下排复刻），自己看图，把分数、对上的、不一样的写进该条的 `verify`；分数低就改演示再核对一次。
5b. **耗 token 的复刻先排队**（2026-11-21 用户定的）：3D 建模、需要 AI 生成素材的效果，平时不做，只放原视频；在条目里写 `plan`（大小、模板、素材、步骤、AI 提示词、验收），状态设为 `queued`，运行 `node tools/replicate/queue.js` 更新 `tools/replicate/QUEUE.md`。用户说「开始做 <编号>」时，按 QUEUE.md 的固定步骤开工（`tools/replicate/new.sh` 生成起点）。
6. **视频**（2026-11-21 定）：存在**店长 PC 的自建 Supabase**（`https://elegy.tailc8cfff.ts.net`，存储桶 `aesthetic-videos`，公开读取）。网站播放用 H.264（`video.web.mp4`，原片加 faststart；超过 20MB 的重编码 CRF 23），**不用 AV1**（很多设备播不了）。条目的 `video` 是桶里的路径 `xhs/<笔记id>-h264.mp4`。
   - 上传：`node tools/db/upload-videos.js`（用公开的 publishable key，已存在的会跳过；`--check` 只检查）。
   - 上传权限是限时的：先在 PC 上执行 `db/open-video-upload.sql`（改成新的到期时间）。云端会话做法：用 `create_session` 在环境「Elegy:D:\Claude」开一个 PC 会话执行这段 SQL。**不需要也不要索取 service_role 密钥。**
   - 视频不进 git。
7. **发布**：推到 main 后 `.github/workflows/pages.yml` 自动生成并发布网站；本地预览 `node tools/site/build.js` 后打开 `dist/`。
8. **网站自己的设计**（2026-11-21 用户定的）：不要用 Wishlist 的 P5 风格（那是 Wishlist 专用的）。现在是「收藏家的图鉴」：书脊分类、收藏卡（稀有度 = 用户评价）、画册式详情页。

## 在其他任务中
做任何带审美判断的工作时，先读 `AESTHETIC.md` 并遵循。
