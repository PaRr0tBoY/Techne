# 02 · Bento 网格 + 纸卡

## 规范要点

- 卡片尺寸由内容权重决定：重要内容占大区域，同级内容同尺寸；**必须满铺无缺口**（用户明确反馈过缺角问题）。
- 卡片 = 哑光纸面：`--surface-2` 实色 + 1px `--line` 边框 + `--radius-card` + 克制阴影；hover 轻微上浮（`translateY(-2px)`）+ `--accent-soft` 背景。
- 卡片 padding 22px；bento 间距 12px。
- 卡片间**不加** `<hr>`/硬边框分隔（用间距和表面差异）。
- 配图占位（`media-slot`）：4:3 用于 hero，21:9 宽幅用于 bento——**只有需求需要配图时才放占位**，不要默认带。
- 断点：≤900px 两列、大卡跨两列；≤620px 单列。

## 代码

```html
<section class="section reveal">
  <div class="section-title">TOOLS / 工具</div>
  <div class="bento">
    <article class="card large">
      <h3><span data-zh>主卡片</span><span data-en hidden>Main card</span></h3>
      <p><span data-zh>卡片说明文字。</span><span data-en hidden>Card description.</span></p>
      <span class="tag">01 / MAIN</span>
      <!-- 装饰见 14-decorative：card-deco 或 svg.deco -->
    </article>
    <article class="card">
      <h3><span data-zh>普通卡片</span><span data-en hidden>Card</span></h3>
      <p><span data-zh>说明文字。</span><span data-en hidden>Description.</span></p>
      <span class="tag">02 / CARD</span>
    </article>
    <article class="card">
      <h3><span data-zh>普通卡片</span><span data-en hidden>Card</span></h3>
      <p><span data-zh>说明文字。</span><span data-en hidden>Description.</span></p>
      <span class="tag">03 / CARD</span>
    </article>
    <figure class="media-slot media-slot--wide" aria-hidden="true">
      <!-- 21:9 宽幅占位：需要配图时才放 -->
    </figure>
  </div>
</section>
```

```css
.bento{display:grid;grid-template-columns:1.15fr .85fr .85fr;grid-template-rows:190px 190px auto;gap:12px}
.card{position:relative;overflow:hidden;padding:22px;background:var(--surface-2);border:1px solid var(--line);border-radius:var(--radius);transition:transform .2s var(--ease),background .2s,border-color .2s}
.card:hover{transform:translateY(-2px);background:var(--accent-soft);border-color:var(--line-strong)}
.card.large{grid-row:span 2}
.card h3{font-size:15px;margin:0 0 9px;font-weight:600}
.card p{font-size:13px;line-height:1.75;color:var(--muted);margin:0;max-width:330px}
.card .tag{position:absolute;right:17px;bottom:16px;font:10px "IBM Plex Mono";color:var(--faint)}
.card svg.deco{position:absolute;right:-4px;bottom:-3px;width:48%;height:52%;opacity:.75}
.card.large svg.deco{width:65%;height:70%}

.media-slot{margin:0;position:relative;border-radius:var(--radius);background:var(--surface-2);
  min-height:320px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.media-slot--wide{grid-column:1/-1;min-height:200px}

@media(max-width:900px){
  .bento{grid-template-columns:1fr 1fr;grid-template-rows:auto}
  .card.large{grid-row:span 1;grid-column:span 2;min-height:220px}
  .media-slot{min-height:230px}
}
@media(max-width:620px){
  .bento{grid-template-columns:1fr}
  .card.large{grid-column:auto}
}
```

## 满铺布局提示

网格行数/列数按内容数量调：`grid-template-columns` 与 `grid-template-rows` 没有固定值，目标是**矩形满铺、无缺口**。缺口 = 用 `span` 调尺寸或用额外卡片补位；**不要**留白块。
