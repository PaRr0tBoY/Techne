# 11 · Tab 栏（Workspace / 分段控件）

## 规范要点

- 横向滚动容器必须显式 `overflow-y:hidden` + `touch-action:pan-x`（只写 `overflow-x:auto` 时浏览器可能推断 `overflow-y:auto`，触屏会整个容器被纵向拖动）。
- Tab 可就地重命名（10-editable）；激活态指示器用 `transform: translateX` 滑动（不 animate `left`/`width`）。
- 激活 Tab：`--accent-soft` 背景 + `--ink` 文字；hover 同态。
- 隐藏滚动条（`scrollbar-width:none` + `::-webkit-scrollbar{display:none}`）。

## 代码

```html
<nav class="tabs" aria-label="Workspace navigation">
  <div class="tab-scroll">
    <div class="tab active" ondblclick="editInPlace(this)" tabindex="0" aria-label="Workspace，双击或按 Enter 重命名">Workspace</div>
    <div class="tab" ondblclick="editInPlace(this)" tabindex="0" aria-label="Typography，双击或按 Enter 重命名">Typography</div>
  </div>
  <!-- 右侧操作（+ 菜单）见 07-menus：.menu-wrap -->
</nav>
```

```css
.tabs{flex:0 0 auto;min-height:46px;display:flex;align-items:stretch;gap:3px;padding:6px 2px;border-bottom:1px solid var(--line)}
.tab-scroll{display:flex;align-items:stretch;gap:3px;overflow-x:auto;overflow-y:hidden;touch-action:pan-x;min-width:0;scrollbar-width:none}
.tab-scroll::-webkit-scrollbar{display:none}
.tab{display:flex;align-items:center;padding:0 16px;border-radius:10px;color:var(--muted);cursor:text;white-space:nowrap;transition:background .18s,color .18s;outline:0}
.tab:hover,.tab.active{background:var(--accent-soft);color:var(--ink)}
```

## 滑动指示器（分段控件/底部 Tab 栏通用）

```html
<div class="seg" id="seg">
  <div class="seg__indicator" id="segIndicator"></div>
  <button class="seg__item active" data-target="0"><span data-zh>概览</span><span data-en hidden>Overview</span></button>
  <button class="seg__item" data-target="1"><span data-zh>日历</span><span data-en hidden>Calendar</span></button>
</div>
```

```css
.seg{position:relative;display:flex;gap:3px;padding:4px;border:1px solid var(--line);border-radius:999px;background:var(--surface-2)}
.seg__indicator{position:absolute;top:4px;left:4px;border-radius:999px;background:var(--accent-soft);
  transition:transform .24s var(--ease),width .24s var(--ease)}
.seg__item{position:relative;z-index:1;padding:7px 14px;border:0;background:transparent;border-radius:999px;color:var(--muted);cursor:pointer;font-size:13px;white-space:nowrap}
.seg__item.active{color:var(--ink)}
```

```js
function moveIndicator(seg){
  const items=[...seg.querySelectorAll(".seg__item")];
  const active=seg.querySelector(".seg__item.active");
  const ind=seg.querySelector(".seg__indicator");
  const i=items.indexOf(active);
  ind.style.width=active.offsetWidth+"px";
  ind.style.transform=`translateX(${i*active.offsetWidth + i*3}px)`; /* 3px = .seg gap */
}
document.querySelectorAll(".seg").forEach(seg=>{
  seg.querySelectorAll(".seg__item").forEach(btn=>{
    btn.addEventListener("click",()=>{
      seg.querySelectorAll(".seg__item").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      moveIndicator(seg);
    });
  });
  moveIndicator(seg);
});
```

> 注：指示器宽度/位移用 JS 量测是模板的简化实现；`transform` 只动合成属性，满足规范。window resize 后可重调 `moveIndicator`。
