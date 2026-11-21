# 复刻待做清单

这些条目需要比较多的 token，平时先只放原视频。哪周 token 有富余，对 Claude 说「开始做 <编号>」即可。
排序：我的评价高的在前，同评价里小的在前。此文件由 `node tools/replicate/queue.js` 生成，不要手改。

## 开工的固定步骤
1. 准备素材（下面每条写了要什么；AI 视频用可灵 / Runway，提示词已写好）
2. `bash tools/replicate/new.sh <编号> <模板> [pointer|scroll]`：生成 demos/<编号>.html、素材文件夹、核对剧本草稿
3. 有视频素材时：`bash tools/replicate/video-to-frames.sh <编号> <视频> 48`
4. 写效果 → `node tools/verify/compare.js <编号>` → 看 verify/<编号>.jpg → 把分数和差异写进 catalog/items.json（status 改成 replicated）
5. 模板说明：basic = 单文件 2D 动效；frame-scrub = AI 视频拆帧后跟着鼠标或滚动切换（省 token 的「假 3D」）；three-scene = three.js 真 3D（vendor 在 demos/vendor/three，不依赖外网）

## ❤❤❤ `swipe-aurora-pay` 上滑发送的极光转账

- 大小：中（半小时左右）
- 模板：basic + WebGL shader（片段着色器做噪声极光）
- 素材：不需要
- 步骤：
  - 先按 METHOD.md 写清单：滑块跟手、极光涌起、箭头上冲、光环收缩、对勾、屏幕边缘光，每项写通过标准
  - 极光：全屏 canvas 跑片段着色器（多层 fbm 噪声 + 紫蓝调色 + 从底部往上的遮罩），滑动进度控制遮罩高度
  - 光环：径向渐变加模糊，半径从大收到金额周围；对勾用 SVG 描边动画
  - 屏幕边缘光：沿圆角矩形的发光描边，颜色沿周长从紫渐变到青，缓慢流动
  - 做成手机竖屏尺寸，电脑上用鼠标拖动模拟上滑
- 验收：RUBRIC ≥ 7：一秒钟测试能认出是同一个效果；极光要有流动的噪声质感
- 原视频：数据库 `xhs/6afe9aa9000000002b025a2d-h264.mp4`，本地 `references/xhs/2026-11-21-炫酷的交互动效分享-025a2d`

## ❤❤❤ `book-popup` 画册里长出实物

- 大小：中（半小时左右）
- 模板：frame-scrub（scroll）或 basic（CSS 立体书）
- 素材：一段 AI 视频：摊开的画册上，平面产品图「长」成立体微缩实物（4–6 秒）；或：3–5 张去背景的产品图（PNG）+ 对应的平面线稿
- 步骤：
  - 方案 A（推荐，省 token）：用可灵/Runway 按下面提示词生成视频 → video-to-frames.sh 拆 48 帧 → frame-scrub 模板用滚动驱动「长出来」
  - 方案 B：CSS 3D 立体书：书页 rotateX 翻开，产品图从 rotateX(90°) 立起到 0°，配合阴影
  - 两种都加：翻页、材质色卡、规格文字排版
- AI 视频提示词：
  > Overhead three-quarter view of an open product catalog lying on a warm walnut table, soft slanted afternoon sunlight through sheer curtains. On the right page a flat printed illustration of a leather handbag slowly rises and becomes a real miniature 3D handbag standing on the paper, casting a soft shadow. Beside it: three fabric swatches and small serif spec text. Cream paper, photorealistic, shallow depth of field, slow and smooth, no people, no text overlays.
- 验收：核对 ≥ 75 分：平面 → 立体的过程清楚、阳光与纸张质感一致、规格排版像真画册
- 原视频：数据库 `xhs/6af5abd7000000002b011407-h264.mp4`，本地 `references/xhs/2026-11-20-海外爆款分享-Part.034｜时尚品牌-011407`

## ❤❤ `mouse-tracking` 鼠标追踪的 3D 小黑猫首屏

- 大小：小（几分钟，少量 token）
- 模板：frame-scrub（pointer）
- 素材：一张 AI 生成的写实小黑猫（白底，抱咖啡杯，居中，16:9）；一段 AI 视频：小猫从看向左边慢慢转头到看向右边（3–4 秒，镜头不动）
- 步骤：
  - 生成图片和视频 → video-to-frames.sh mouse-tracking <视频> 36
  - new.sh mouse-tracking frame-scrub pointer
  - 加上杂志风标题「Treat the little things.」（细衬线 + 斜体）
- AI 视频提示词：
  > Photorealistic fluffy black kitten with big green eyes sitting on a pure white background holding a takeaway coffee cup, centered, 16:9. The kitten slowly turns its head from looking at the left edge to looking at the right edge, camera locked, soft studio light, 4 seconds, no other motion.
- 验收：核对 ≥ 80 分：鼠标从左到右，猫头平滑跟着转，没有跳帧
- 原视频：数据库 `xhs/6abc7965000000000202887b-h264.mp4`，本地 `references/xhs/2026-11-20-鼠标追踪‼️充满趣味的网站首页交互效果-02887b`

## ❤❤ `eva-magi` EVA 风格电子工牌

- 大小：小（几分钟，少量 token）
- 模板：basic
- 素材：不需要
- 步骤：
  - 黑底 + 橙/青细线框画出 MAGI 三面板（CASPER / BALTHASAR / MELCHIOR）
  - 点击后三个面板依次跳出「審議 → 承認 / 否定」，随机决策
  - 做成手机竖屏尺寸，像工牌屏幕
- 验收：核对 ≥ 80 分
- 原视频：数据库 `xhs/6af82764000000002501f1a8-h264.mp4`，本地 `references/xhs/2026-11-20-发朋友圈没人懂，但发小红书一定有人懂-01f1a8`

## ❤❤ `menu-point-swap` 指哪变哪的菜单联动

- 大小：小（几分钟，少量 token）
- 模板：basic
- 素材：4–6 张同一角度、同一背景的产品图（去背景 PNG 最好）
- 步骤：
  - 左边是菜单列表，右边是产品舞台
  - 鼠标划过菜单项：产品图交叉淡入并轻微缩放，菜名用大字从上方滑入
  - 停止划动后定格在当前产品，手机上改为点击
- 验收：核对 ≥ 80 分：切换跟手、不闪烁、名字和图同步
- 原视频：数据库 `xhs/6afa42fd00000000190256d2-h264.mp4`，本地 `references/xhs/2026-11-21-海外社媒灵感：简单好复刻的顶级轮播创意-0256d2`

## ❤❤ `anchor-wordmark` 字标不动、载体在变的品牌版式

- 大小：小（几分钟，少量 token）
- 模板：basic
- 素材：5–6 张统一暗蓝色调的场景图，字标位置留空（AI 生成）
- 步骤：
  - 字标用 CSS 固定在画面中上方，所有场景共用
  - 场景图每 0.4–0.8 秒硬切一张，节奏可以跟着鼠标或滚动
  - 字标颜色随场景反转（浅底用深色字、深底用奶白字）
- AI 视频提示词：
  > Moody dark navy studio photograph, [canvas tote bag held by a hand | open glass laptop on a black desk | back of a black leather jacket | rough stone floating in fog], centered, the upper-middle area left plain for a logo, low-key lighting, cool navy and warm cream tones, minimal, 9:16, no text.
- 验收：RUBRIC ≥ 7：字标位置一帧都不能跳，切换节奏和色调一致
- 原视频：数据库 `xhs/6afd3db6000000002b03d614-h264.mp4`，本地 `references/xhs/2026-11-21-审美积累-极简板式变化-03d614`

## ❤❤ `motion-prompts-10` 10 个交互动效提示词

- 大小：小（几分钟，少量 token）
- 模板：basic
- 素材：不需要
- 步骤：
  - 把 10 个提示词逐个原样交给生成（不改写），每个出一个演示，看「只给提示词」能做到原作的几成
  - 和原视频逐帧对比，记录提示词里缺了哪些描述才导致差距，把补充后的提示词写回来
- 验收：每个演示 RUBRIC ≥ 6；同时产出「补充版提示词」
- 原视频：数据库 `xhs/6affc46c000000001601a7ff-h264.mp4`，本地 `references/xhs/2026-11-21-AI新手村｜5个AI交互动效提示词直接复制可用-01a7ff`

## ❤❤ `ai-status-cards` 满屏会动的 AI 状态卡片

- 大小：中（半小时左右）
- 模板：basic
- 素材：不需要
- 步骤：
  - 做 6–8 种卡片组件（进度条、滚动数字、声波、头像叠排、状态切换 In Review → Done）
  - 用 CSS columns 铺满屏幕，每张卡片用随机间隔各自更新
- 验收：核对 ≥ 75 分：满屏都在动但不乱，暗色和强调色一致
- 原视频：数据库 `xhs/6afc0db90000000025008af8-h264.mp4`，本地 `references/xhs/2026-11-20-🆓救命！这个UI动效-Skill-也太好看了吧-008af8`

## ❤❤ `live-commerce` 直播电商宣传片：概念板块的讲法

- 大小：中（半小时左右）
- 模板：basic
- 素材：不需要
- 步骤：
  - 复刻三段：① 大字「Product」+ 实物台灯落在字母上 → ② 品牌/应用文字卡被商品图片围住 → ③ 打字机对话「Hey what do you want to build today?」
  - ④ 商品节点网络：散落的商品图用细线连起来，中间「découvrent un produit」
  - ⑤ 文字竖向滚动列表 + 右边网点背景上的商品卡
- 验收：核对 ≥ 70 分：剪切节奏（每 1–2 秒一个画面）和过渡方式一致
- 原视频：数据库 `xhs/6affdeee0000000016030f31-h264.mp4`，本地 `references/xhs/2026-11-20-高级感UI交互，让产品视觉更有质感✨-030f31`

## ❤❤ `rain-glass` 窗玻璃上的雨滴（Shader Lab）

- 大小：中（半小时左右）
- 模板：basic + WebGL 片段着色器
- 素材：一张背景图（风景或壁纸，自己拍或 AI 生成）
- 步骤：
  - 先读源头：fedesanchez0/shader-lab 里 Rain 的 Metal 着色器，确认许可证允许参考后，理解它的雨滴生成、折射、拖尾做法（只学做法，代码用自己的写法移植到 WebGL）
  - 背景：对背景图做模糊作为底层；雨滴：程序化生成大小不一的水滴，在水滴内按法线偏移采样「清晰且翻转」的背景
  - 动作：大水滴缓慢下滑、合并小水滴、留下拖尾和细小残留
  - 场景切换：飞机舷窗（圆角椭圆遮罩）、车窗（斜向流动）、房屋窗户（垂直下落）
- 验收：RUBRIC ≥ 7，并且心动点通过：放大看，每颗雨滴里都是清晰的折射背景
- 原视频：数据库 `xhs/6afc1f62000000002a025b5f-h264.mp4`，本地 `references/xhs/2026-11-21-把下雨效果做出来了！这个开源项目太酷了-025b5f`

## ❤❤ `earbud-scroll` 耳机概念页：滚动拆解

- 大小：大（需要 3D 模型或多段素材，token 最多）
- 模板：three-scene（有 3D 模型）或 frame-scrub（scroll，用 AI 视频）
- 素材：耳机的 GLB 模型（可在 Sketchfab 找 CC 授权的 earbuds 模型）；或：三段 AI 视频：开盒、转动、零件分层（爆炸图）
- 步骤：
  - 先用 frame-scrub + AI 视频做出三幕滚动（M）
  - 有模型时换成 three-scene：第一幕镜头推近充电盒，第二幕绕 Y 轴转到耳柄，第三幕按零件在 Y 轴方向分开
  - 文字：斜体衬线大标题 + 01/02/03 步骤，青色灯带点缀
- AI 视频提示词：
  > Product render of matte navy wireless earbuds on a deep navy background, slow turntable rotation revealing the stem, then the earbud separates into exploded layers (shell, battery, driver, circuit board) aligned vertically, thin cyan accent light strip, studio lighting, 4 seconds, seamless, no text.
- 验收：核对 ≥ 75 分：三幕顺序和镜头节奏一致，第三幕能看清分层
- 原视频：数据库 `xhs/6b00cfae000000002b033223-h264.mp4`，本地 `references/xhs/2026-11-20-耳机概念-033223`

