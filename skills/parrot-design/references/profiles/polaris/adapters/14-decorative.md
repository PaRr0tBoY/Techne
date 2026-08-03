# 14 · 分散装饰系统（Decorative Accent）

## 规范要点

- 装饰是**分散**的视觉标点：细线曲线、小圆点、虚线折角、圆角小方块分布在 Hero 背景、logo 标记、卡片角落——不是集中在某处的插画。
- Hero 背景曲线：`var(--accent)` **连续单笔**描边（可叠一层更细更淡的 ghost 线），控制点可不对称，避免「数学公式生成」的观感。
- 装饰透明度一般 0.2–0.55；`pointer-events:none`，不参与交互。
- **有需要才放**：页面不需要装饰时（数据页）不放，装饰不是规范义务。

## 代码

```css
.art-line{fill:none;stroke:var(--accent);stroke-width:1.2;vector-effect:non-scaling-stroke}
.art-soft{fill:none;stroke:var(--line-strong);stroke-width:1;stroke-dasharray:4 8;vector-effect:non-scaling-stroke}
.art-fill{fill:var(--accent-soft);stroke:var(--accent);stroke-width:1}
.sketch-line{fill:none;stroke:var(--accent);stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke;opacity:.26}
.sketch-line--ghost{stroke-width:.9;opacity:.11}
.draw{stroke-dasharray:900;stroke-dashoffset:900;animation:draw 2.1s var(--ease) .1s forwards}
.float{animation:float 9s ease-in-out infinite}
@keyframes draw{to{stroke-dashoffset:0}}
@keyframes float{50%{transform:translate(3px,-6px)}}

.card-deco{position:absolute;opacity:.55;pointer-events:none}
.card-deco--dots{right:14px;top:14px;width:34px;height:34px}
.card-deco--bracket{right:12px;bottom:12px;width:38px;height:38px}
.card-deco--rounded{left:14px;top:14px;width:30px;height:30px}
```

## 用法示例

```html
<!-- 卡片角落点缀 -->
<svg class="card-deco card-deco--dots" viewBox="0 0 60 60" aria-hidden="true">
  <circle class="art-fill float" cx="10" cy="42" r="4"/>
  <circle class="art-line" cx="30" cy="18" r="3"/>
  <circle class="art-fill" cx="48" cy="34" r="5.5"/>
</svg>

<!-- 卡片内装饰曲线 -->
<svg class="deco" viewBox="0 0 180 130" aria-hidden="true">
  <path class="art-soft" d="M10 110 C40 15 65 125 98 45 S145 40 175 10"/>
  <path class="art-line" d="M10 110 C40 15 65 125 98 45 S145 40 175 10"/>
</svg>
```

Hero 背景曲线见 03-hero（`hero-bg-accent` + `sketch-line`）。logo 标记也是装饰系统的一部分（几何形，见 01-nav `brand-mark`）。
