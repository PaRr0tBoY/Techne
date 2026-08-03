# 00 · 页面基座（每次必读）

页面级基础：字体、token 块、纸面背景、全局样式。所有页面从这里开始。

## 规范要点

- 背景 = 细点阵（19px 间隔、0.85px 点、低对比）+ 极轻 SVG 噪声（`opacity .035`）。
- 浮层一律哑光纸卡：实色 `var(--surface)` + 1px 边框 + `--radius-card` + 克制阴影。**禁止** `backdrop-filter` 玻璃拟态。
- 无纯黑 `#000` / 纯白 `#FFF`；默认 Verdigris 主题 + 暗色。
- 分区用间距与表面差异，不用 `<hr>` 或硬边框（分隔线规则见 DESIGN.md）。

## 代码

```html
<style>
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+SC:wght@400;500;600;700&display=swap');
/* 英文正文需要 IBM Plex Sans 时：把 family=IBM+Plex+Sans:wght@400;500;600;700 加进 @import，
   并在 --font-sans 的 family 列表最前面 */

:root{
  --bg:#e9e6dc; --surface:#f2efe7; --surface-2:rgba(255,255,255,.28);
  --ink:#292925; --muted:#716f68; --faint:#aaa79d;
  --line:rgba(41,41,37,.15); --line-strong:rgba(41,41,37,.26);
  --grid:rgba(41,41,37,.12); --accent:#5f5b51; --accent-soft:rgba(95,91,81,.13);
  --accent-ink:#f5f2e9; --shadow:rgba(35,34,30,.08);
  --radius:14px; --ease:cubic-bezier(.2,.75,.2,1);
}
html[data-theme="cobalt"]{--accent:#315f9b;--accent-soft:rgba(49,95,155,.13);--accent-ink:#f4f6fa;}
html[data-theme="verdigris"]{--accent:#39756c;--accent-soft:rgba(57,117,108,.13);--accent-ink:#f2f7f4;}
html[data-theme="amber"]{--accent:#9a6a24;--accent-soft:rgba(154,106,36,.14);--accent-ink:#fff8ed;}
html[data-theme="violet"]{--accent:#685b91;--accent-soft:rgba(104,91,145,.13);--accent-ink:#f6f3fb;}
html[data-mode="dark"]{
  --bg:#20211f;--surface:#282925;--surface-2:rgba(255,255,255,.035);
  --ink:#e8e6de;--muted:#aaa79e;--faint:#77756e;
  --line:rgba(232,230,222,.14);--line-strong:rgba(232,230,222,.24);
  --grid:rgba(232,230,222,.10);--shadow:rgba(0,0,0,.18);
}
html[data-mode="dark"][data-theme="cobalt"]{--accent:#7199d1;--accent-soft:rgba(113,153,209,.15);--accent-ink:#171b22}
html[data-mode="dark"][data-theme="verdigris"]{--accent:#6aa99f;--accent-soft:rgba(106,169,159,.15);--accent-ink:#17201e}
html[data-mode="dark"][data-theme="amber"]{--accent:#d2a65f;--accent-soft:rgba(210,166,95,.16);--accent-ink:#211b12}
html[data-mode="dark"][data-theme="violet"]{--accent:#a79bd0;--accent-soft:rgba(167,155,208,.16);--accent-ink:#1d1a25}

*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  margin:0;color:var(--ink);font-family:"IBM Plex Sans SC",system-ui,sans-serif;
  background:
    radial-gradient(circle at 1px 1px,var(--grid) .85px,transparent 1.1px) 0 0/19px 19px,
    var(--bg);
  transition:background .25s ease,color .25s ease;
  overflow-x:hidden;
}
body:before{
  content:"";position:fixed;inset:0;pointer-events:none;opacity:.035;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode:multiply;z-index:41;
}
button,input{font:inherit}
button{color:inherit;font-family:inherit}
a{color:inherit}
button:focus-visible,[tabindex]:focus-visible,input:focus-visible,a:focus-visible{
  outline:2px solid var(--accent);outline-offset:3px;
}
[hidden]{display:none!important}

.shell{max-width:1240px;margin:auto;padding:22px 30px 90px}

.below-fold{padding-top:8px}
.section{margin-top:76px}
.section:first-child{margin-top:0}
.section-title{font:11px "IBM Plex Mono";letter-spacing:.06em;color:var(--muted);margin-bottom:15px}

@media(max-width:900px){
  .shell{padding:16px 18px 70px}
}
@media(prefers-reduced-motion:reduce){
  *,*:before,*:after{animation-duration:.001ms!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
}
</style>
```

## 视口渐入（通用）

```css
.reveal{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s var(--ease)}
.reveal.visible{opacity:1;transform:none}
```

```js
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}
  });
},{rootMargin:"0px 0px -8% 0px",threshold:.08});
document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));
```
