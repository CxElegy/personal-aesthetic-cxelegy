# 汉堡食材图层的来源

- 生成：2026-11-21，用 vidIQ 的图片生成（模型 gpt_image_2_6），只生成了**一张**图，把 8 种食材分开摆在同一张图上，所以视角（约 35° 俯视）和光源（左上主光）天然一致。
- 抠图：本地 `rembg`（isnet-general-use 模型）逐个裁切、去背景，存成 webp。
- 不含原作（Stackhouse / Clico）的任何素材。

提示词：

> Studio product photograph, ingredient sprite sheet for a burger website. Eight separate burger ingredients arranged in a neat 4 by 2 grid with generous empty space between them, none touching or overlapping, on a plain seamless light warm-gray background. Every item shot from the same three-quarter top-down camera angle of about 35 degrees, so both the top surface and the side thickness are visible, same soft key light from the upper left, soft natural contact shadow under each. Top row left to right: 1) bottom half of a toasted brioche burger bun, cut side facing up, golden toasted crumb with visible airy holes; 2) a thick flame-grilled beef patty with charred crust texture; 3) a single square slice of melting cheddar cheese draping softly; 4) one ruffled fresh green lettuce leaf with translucent frilly edges, roughly round. Bottom row left to right: 5) three thick red tomato slices overlapping slightly in a fan, glossy cross-section showing seeds and gel; 6) a small loose stack of thin red onion rings, purple-pink and white layers; 7) top half of a glossy golden brioche burger bun covered in sesame seeds, dome shape; 8) an empty round matte light-gray ceramic plate. Ultra-detailed macro food photography, realistic, crisp focus on every item, consistent color grading, no text, no labels, no hands, no props.

经验：要一套视角一致的素材时，让模型在**一张图**里画全部，再自己切开，比分开生成 8 张更一致，也更省额度。
