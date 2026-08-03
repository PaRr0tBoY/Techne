# 12 · 骨架屏加载

## 规范要点

- 加载用结构占位条（shimmer），**禁止**转圈动画与省略号动画。
- 为异步内容预留尺寸（`min-height` 等），避免布局位移（CLS）。
- 内容到达后切换 `hidden` + 渐入（`.real-body.visible`）。
- 尊重 `prefers-reduced-motion`（00-base 全局已坍缩动画时长）。

## 代码

```html
<article class="card" id="skeletonCard">
  <div class="skel-body" id="skelBody">
    <span class="skel-line skel-line--title"></span>
    <span class="skel-line skel-line--w80"></span>
    <span class="skel-line skel-line--w60"></span>
  </div>
  <div class="real-body" id="realBody" hidden>
    <h3><span data-zh>真实内容</span><span data-en hidden>Real content</span></h3>
    <p><span data-zh>加载完成后的正文。</span><span data-en hidden>Body after load.</span></p>
  </div>
  <span class="tag">LOADING</span>
</article>
```

```css
.skel-body{display:flex;flex-direction:column;gap:10px}
.skel-line{display:block;height:11px;border-radius:6px;background:linear-gradient(90deg,var(--line) 25%,var(--line-strong) 37%,var(--line) 63%);background-size:400% 100%;animation:shimmer 1.6s ease-in-out infinite}
.skel-line--title{height:15px;width:55%}
.skel-line--w80{width:80%}
.skel-line--w60{width:60%}
@keyframes shimmer{0%{background-position:100% 0}100%{background-position:0 0}}
.real-body{opacity:0;transform:translateY(4px);transition:opacity .5s ease,transform .5s var(--ease)}
.real-body.visible{opacity:1;transform:none}
```

```js
const skeletonCard=document.getElementById("skeletonCard");
if(skeletonCard){
  const skelObserver=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        skelObserver.unobserve(entry.target);
        window.setTimeout(()=>{
          document.getElementById("skelBody").hidden=true;
          const real=document.getElementById("realBody");
          real.hidden=false;
          requestAnimationFrame(()=>real.classList.add("visible"));
        },900);
      }
    });
  },{threshold:.4});
  skelObserver.observe(skeletonCard);
}
```
