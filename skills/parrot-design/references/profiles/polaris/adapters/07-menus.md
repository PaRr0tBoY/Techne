# 07 · 菜单（下拉 + 移动端浮层）

## 规范要点

- 下拉菜单项：图标 + 文字，统一不混用（见 06 规则）。
- 移动端导航：汉堡按钮 + **浮层**面板，**必须 `position:absolute` 不进文档流**（曾经把页面内容顶下去，是明确禁止的 bug）。
- 2×2 bento 卡片网格是模板实例——菜单项数量/布局按内容定，只要保持浮层 + 卡片化 + 大触达面积。
- 外点关闭：点击 `.menu-wrap` / `.nav-menu` 之外关闭对应面板。
- ARIA：`aria-expanded`、`role="menu"`、`role="menuitem"`。

## 代码：下拉菜单（+ 按钮）

```html
<div class="menu-wrap">
  <button class="icon-btn" aria-label="打开菜单 / Open menu" aria-expanded="false" onclick="toggleMenu(this)">
    <span class="plus" aria-hidden="true"></span>
  </button>
  <div class="menu" id="menu" role="menu">
    <button role="menuitem" type="button">
      <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M3 4.5h10M3 8h10M3 11.5h10" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/></svg>
      <span><span data-zh>操作项</span><span data-en hidden>Action item</span></span>
    </button>
  </div>
</div>
```

```css
.menu-wrap{position:relative;flex:0 0 auto;margin-inline-start:auto;display:flex;align-items:center}
.menu{
  position:absolute;right:0;top:39px;width:190px;padding:6px;
  background:var(--surface);border:1px solid var(--line);border-radius:11px;
  box-shadow:0 14px 35px var(--shadow);
  opacity:0;transform:translateY(-4px) scale(.98);pointer-events:none;
  transition:opacity .17s ease,transform .17s var(--ease);z-index:15;
}
.menu.open{opacity:1;transform:none;pointer-events:auto}
.menu button{display:flex;align-items:center;gap:8px;width:100%;text-align:start;padding:8px 9px;border:0;background:transparent;border-radius:7px;font-size:12px;cursor:pointer;color:inherit}
.menu button:hover{background:var(--accent-soft)}
.menu button svg{flex:0 0 auto;color:var(--muted)}
```

```js
function toggleMenu(btn){
  const menu=document.getElementById("menu"),open=menu.classList.toggle("open");
  btn.classList.toggle("open",open);
  btn.setAttribute("aria-expanded",String(open));
}
```

## 代码：移动端浮层菜单（汉堡 + 卡片网格）

```html
<div class="nav-menu">
  <button class="icon-btn" id="navBurger" type="button" aria-expanded="false" aria-controls="navPanel" aria-label="打开导航菜单 / Open navigation menu">
    <span class="burger" aria-hidden="true"><i></i><i></i><i></i></span>
  </button>
  <div class="nav-panel" id="navPanel" role="menu">
    <a class="nav-panel__item" href="#" role="menuitem">
      <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><rect x="2" y="2" width="5" height="5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="2" width="5" height="5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="2" y="9" width="5" height="5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="9" y="9" width="5" height="5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>
      <span><span data-zh>概览</span><span data-en hidden>Overview</span></span>
    </a>
  </div>
</div>
```

```css
.nav-menu{position:relative;display:none}
.nav-panel{
  position:absolute;top:calc(100% + 10px);right:0;width:236px;
  display:none;grid-template-columns:1fr 1fr;gap:8px;padding:10px;
  background:var(--surface);border:1px solid var(--line);border-radius:16px;
  box-shadow:0 16px 40px var(--shadow);
  opacity:0;transform:translateY(-6px) scale(.98);pointer-events:none;
  transition:opacity .2s ease,transform .2s var(--ease);z-index:45;
}
.nav-panel.open{display:grid;opacity:1;transform:none;pointer-events:auto}
.nav-panel__item{display:flex;flex-direction:column;gap:7px;padding:13px 11px;border-radius:11px;
  color:var(--muted);text-decoration:none;background:var(--surface-2);font-size:12px;
  transition:background .18s,color .18s}
.nav-panel__item:hover,.nav-panel__item:focus-visible{background:var(--accent-soft);color:var(--ink)}
.nav-panel__item svg{color:var(--accent)}
@media(max-width:760px){.nav-menu{display:block}}
```

```js
const navBurger=document.getElementById("navBurger");
const navPanel=document.getElementById("navPanel");
navBurger.addEventListener("click",()=>{
  const open=navBurger.classList.toggle("open");
  navBurger.setAttribute("aria-expanded",String(open));
  navPanel.classList.toggle("open",open);
});
function closeNavPanel(){
  navPanel.classList.remove("open");
  navBurger.classList.remove("open");
  navBurger.setAttribute("aria-expanded","false");
}
```

## 外点关闭（所有面板共用）

```js
document.addEventListener("click",e=>{
  if(!e.target.closest(".menu-wrap")){
    const menu=document.getElementById("menu");
    if(menu)menu.classList.remove("open");
    const b=document.querySelector(".menu-wrap .icon-btn");
    if(b){b.classList.remove("open");b.setAttribute("aria-expanded","false")}
  }
  if(!e.target.closest(".nav-menu")){closeNavPanel()}
});
```

导航隐藏（01-nav 的 `handleNavScroll`）时也要调用 `closeSearch()` 与 `closeNavPanel()`。
