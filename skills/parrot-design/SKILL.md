---
name: parrot-design
description: >
  让 AI 按照内置设计规范（Design Language Document v7，风格代号 Technical Editorial
  Minimalism + Tactile Motion）完成设计任务。用法：用户说明是修改现有设计还是重构设计；
  最终目标都是产出符合规范的设计。规范本体在技能 references/ 中，SKILL.md 只说明文件结构
  与工作流，不转写规范内容；动手前必须先读 references/ 再按参考风格设计。只要用户提到
  设计规范、按规范、重构/重做、新建页面/工具页、修改现有设计、风格统一，或在
  PaRr0tBoY.github.io 仓库内要求新建/修改任何 HTML 页面、工具页、组件、界面，都应使用本技能。
---

# Parrot Design

本技能让 AI 根据内置设计规范完成用户的设计要求。
技能内**不转写规范内容**——规范本体在 `references/` 中，先读参考文件，再按参考风格设计。

## 参考文件结构

规范文件位于本技能目录的 `references/`（v7 设计语言，不可变发布版）：

| 文件 | 内容 | 何时读 |
|---|---|---|
| `references/design-language-document-v7-DESIGN.md` | 设计语言权威文档：全部 token、组件规范、动效系统、Do's and Don'ts | **必读**（每次设计前） |
| `references/design-language-document-v7-variables.css` | 可直接使用的 CSS 变量（颜色/字体/间距/圆角/阴影） | 取 token 值时 |
| `references/design-language-document-v7-tokens.json` | W3C 格式设计 token | 需要结构化 token 时 |
| `references/design-language-document-v7-raw-tokens.json` | 原始 token，含组件定义 | 需要组件级细节时 |
| `references/design-language-document-v7-theme.css` | Tailwind `@theme` 形式 | Tailwind 项目 |
| `references/design-template-v8.html` | v8 完整参考实现（自包含单文件 HTML） | **重构设计必读**；需要交互/组件参考时 |
| `references/README.md` | 版本说明（不可变发布版；改派生文件需先改 DESIGN.md） | 可选 |

### 如何定位规范文件

1. 本技能目录下的 `references/`（与 `SKILL.md` 同级）。技能触发后先解析技能自身路径，再读 `references/`。
2. 若当前会话把技能挂到了别名路径，仍以**本技能目录**内的 `references/` 为准，不要去仓库 `design/` 找替代副本（仓库 `design/` 可与本包同步，但执行时以技能内 references 为唯一事实来源）。
3. 找不到 `references/` → 停止并向用户说明技能安装不完整。**不要凭记忆或训练数据推断规范内容**。

## 工作流

### 第 1 步：读规范（任何模式都必须）

必读 `references/design-language-document-v7-DESIGN.md`（一次读完）。涉及交互、组件、动效时
再读 `references/design-template-v8.html` 参考实现。规范文件是唯一事实来源：颜色、字体、间距、圆角、
阴影等所有取值都从参考文件取，不靠记忆。

### 第 2 步：确定模式

用户会说明是**修改现有设计**还是**重构设计**。没说时按请求判断：
- 针对已有文件做改动 → 修改现有设计
- 新建文件或推倒重做 → 重构设计
- 无法判断 → 一句话向用户确认，不要擅自选

### 规范冲突处理（两种模式通用）

用户要求与规范冲突时（如指定了规范外的颜色、材质或交互）：指出冲突与理由，给出规范内的替代
方案，由用户决定。不要静默违反规范，也不要无视用户要求。

### 模式 A：修改现有设计

目标：把现有设计按规范修正，保持原有功能和设计语言方向。

1. 读目标文件，弄清现状与改动范围。
2. 对照规范找出差距（颜色 token、字体、材质、间距、圆角、动效、i18n 等）。
3. 只改请求范围内的内容，加上与请求直接相关的规范偏差修正。**不要借机重写无关部分**。
4. 验证原功能未破坏：修改后跑一次冒烟测试（浏览器验证或等价检查），确认输入、打分、结果展示
   等原有交互仍然工作。这一步和视觉自检同等重要。
5. 不改变设计语言方向，除非用户明确要求。
6. 完成符合性自检和验证后交付。

### 模式 B：重构设计

目标：从零（或推倒重做）创建符合规范的设计。

1. 通读 `references/design-language-document-v7-DESIGN.md` 和 `references/design-template-v8.html`，建立完整风格认知（风格语言、组件、交互模式）。
2. 新建设计时沿用仓库惯例：自包含单文件 HTML（内联 CSS/JS，字体可引 CDN）。
3. 复用规范的 token 和组件语言：浮动导航、bento 卡片、纸感材质、分散装饰、图标变形、双语结构、动效系统。
4. 内容按需求全新设计，但所有视觉决策必须落在规范框架内。
5. 完成符合性自检和验证后交付。

## 符合性自检

对照 `references/design-language-document-v7-DESIGN.md` 的对应章节逐项检查（以参考文件为准，下列条目只是检查点，不是规范全文）：

- **Colors**：颜色全部来自规范 token；无纯黑 `#000` / 纯白 `#FFF`；默认 Verdigris 主题，五主题（Graphite/Cobalt/Verdigris/Amber/Violet）明暗两态都可用
- **Typography**：IBM Plex Sans / Mono / Sans SC；中文避开 Light 字重；字号层级用 `--type-*` token
- **Paper Surface 材质**：浮层一律哑光纸卡（实色 `--surface` + 1px 边框 + 统一圆角 token + 克制阴影）；**禁止** `backdrop-filter` 玻璃拟态；背景为细点阵 + 极轻噪声
- **Decorative Accent**：装饰分散在各处，不集中成一张 Hero 插画；Hero 背景曲线用 `var(--accent)` 连续单笔
- **Components**：容器即控件——就地重命名/编辑控件（标题、Tab 名、标签）用 `contenteditable` 且编辑前后几何形状不变，不用 `<input>` 模拟（定宽与默认样式会跳动）；表单数据输入字段仍用 `<input>`。导航 `justify-content: space-between`；图标变形 `+ ⇄ ×` / 汉堡 ⇄ 关闭 / 搜索 ⇄ 关闭 统一实现；搜索展开为统一胶囊；移动菜单是浮动 2×2 bento 卡网格（不进文档流）；加载用骨架屏；浮层隐藏时收起子面板
- **Motion**：视口进入用 opacity + translateY 一次性 reveal；浮动导航可见性用 transform；全部动效尊重 `prefers-reduced-motion`
- **Layout / Responsive**：折页 72px 导航安全间距、Hero 垂直 padding 12px、卡片 padding 22px、bento 间距 12px；`≤760px` 断点；横向滚动容器必须 `overflow-y: hidden` + `touch-action: pan-x`
- **i18n / A11y**：中英双语用 `data-zh` / `data-en` + `hidden` 切换；图标按钮带 `aria-label` + `title`；导航用语义化 ARIA 状态（`aria-expanded` 等）
- **Do's and Don'ts**：通读规范结尾的 Do's and Don'ts 章节，确认没有违反

## 验证与交付

- 交付物：符合规范的设计——通常是自包含 HTML 文件（重构）或对现有文件的修改（修改模式）。
- 验证：有渲染条件时在浏览器打开检查——明暗两态、默认 Verdigris 主题、375px 窄屏、关键动效、reduced-motion，尽量截图留证。修改模式额外验证原功能未破坏（见模式 A 第 4 步）。无法渲染时明确说明并给出需要用户检查的视口。
- 交付说明：列出改动/新增内容、与规范关键条款的对应关系、遗留的待确认项。
