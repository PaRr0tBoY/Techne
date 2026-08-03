# 03 · Hero（首屏区）

## 规范要点

- 桌面端 Tab + Hero 占满一屏（`min-height:100svh`），不留半截盒子；移动端不强制（滚动式页面）。
- 折页顶部留 72px 导航安全距（`--spacing-nav-safe`）；Hero 垂直 padding 12px。
- 背景曲线 = `var(--accent)` **连续单笔**描边（`sketch-line`），可叠一层更细更淡的 ghost 线；不要虚线、不要中性灰。
- 装饰是分散系统的一部分（见 14-decorative），**不要**把装饰集中成一张插画；配图占位只在需求需要时放。
- 只读型大段内容/短输入表单：主内容区约 1/3 页宽居中（见 DESIGN.md Content Width Constraint）。

## 代码

```html
<section class="fold">
  <section class="workspace">
    <div class="content">
      <section class="hero">
        <svg class="hero-bg-accent" viewBox="0 0 1200 500" preserveAspectRatio="none" aria-hidden="true">
          <path class="sketch-line sketch-line--ghost" d="M-46 372 C 250 150 470 460 760 260 S 1220 40 1410 150"/>
          <path class="sketch-line" d="M-40 380 C 258 122 518 478 902 202 S 1298 62 1400 168"/>
        </svg>
        <div class="copy">
          <div class="eyebrow">EYEBROW / 眉题</div>
          <h1><span data-zh>主标题</span><span data-en hidden>Main headline</span></h1>
          <p class="lead">
            <span data-zh>一句话说明。</span>
            <span data-en hidden>One-line description.</span>
          </p>
          <div class="actions">
            <button class="action primary" type="button"><span data-zh>主要动作</span><span data-en hidden>Primary action</span></button>
            <button class="action" type="button"><span data-zh>次要动作</span><span data-en hidden>Secondary action</span></button>
          </div>
        </div>
        <!-- 需求需要配图时才加：
        <div class="hero-media">
          <figure class="media-slot" aria-hidden="true">…4:3 占位…</figure>
        </div> -->
      </section>
    </div>
  </section>
</section>
```

```css
.fold{min-height:100svh;min-height:100dvh;display:flex;flex-direction:column;padding-top:72px}
.workspace{position:relative;flex:1 1 auto;display:flex;flex-direction:column;min-height:0}
.content{flex:1 1 auto;display:flex;flex-direction:column;min-height:0}
.hero{position:relative;flex:1;display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,.85fr);gap:54px;align-items:center;padding:12px 0}
.hero-bg-accent{position:absolute;inset:-8% -4%;width:108%;height:118%;z-index:0;pointer-events:none}
.copy{position:relative;z-index:2}
.eyebrow{font:12px "IBM Plex Mono";letter-spacing:.08em;color:var(--accent)}
h1{font-size:clamp(38px,4.6vw,60px);line-height:1.03;letter-spacing:-.05em;margin:15px 0 20px;font-weight:600;max-width:700px}
.lead{font-size:16px;line-height:1.8;color:var(--muted);max-width:620px}
.actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:26px}
.action{border:1px solid var(--line);background:transparent;border-radius:9px;padding:9px 13px;font-size:13px;cursor:pointer;transition:.18s var(--ease)}
.action:hover{background:var(--accent-soft);border-color:var(--line-strong);transform:translateY(-1px)}
.action.primary{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.hero-media{position:relative;z-index:2}

@media(max-width:900px){
  .fold{min-height:auto}
  .workspace,.content{flex:none}
  .hero{flex:none;display:block;padding:20px 0}
  .hero-media{margin-top:26px}
}
```

无 hero 区（工具页/数据页直接进入内容）完全合法——Hero 不是必选组件。
