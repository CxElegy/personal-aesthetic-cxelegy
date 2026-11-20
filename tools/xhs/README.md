# 小红书笔记抓取

把小红书笔记（图文、视频、评论）存进 `references/xhs/`，再让 Claude 看完素材，把学到的写进 `AESTHETIC.md`。

做法参考 [piekill/xiaohongshu-summarizer-skill](https://github.com/piekill/xiaohongshu-summarizer-skill)：用**带界面的真实浏览器 + 你自己的小红书登录**，不伪装身份、不绕过登录。所以要在**你自己的电脑**上跑（云端会话没有界面，也没有你的登录）。

和原 skill 的区别：原版按关键词搜索、只抓图片；这个按分享链接抓，**连视频一起下载**，并用 ffmpeg 抽关键帧，Claude 能「看」动效。

## 第一次准备（电脑上一次就好）
```bash
npm i playwright && npx playwright install chromium
# ffmpeg：Windows 用 winget install ffmpeg，Mac 用 brew install ffmpeg
```

## 用法
```bash
node tools/xhs/fetch.js "抽奖的灵感有着落了！… https://xhslink.cn/o/544mW3K5BDk コピーして…" "https://xhslink.cn/o/4XJYPKYzZEg"
```
- 直接把小红书「复制链接」得到的整段文字贴进去就行，多条用空格隔开。
- 第一次会打开浏览器窗口，在窗口里登录小红书；登录状态存在 `tools/xhs/.profile/`（不会提交到 git）。
- 超过 20MB 的视频只留关键帧。

## 抓完之后
对 Claude 说「看 references/xhs 里新抓的笔记，更新审美档案」。Claude 会看图片和关键帧，填写每条 `note.md` 的「学到的」，同步到 `AESTHETIC.md`，然后提交推送。

## 注意
存的是别人的作品，仓库请保持**私有**；公开的话只留关键帧、文字和原链接。
