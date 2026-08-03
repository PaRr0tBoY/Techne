# 01 · 导航（顶栏 / 侧栏）

## 规范要点

- 浮层哑光纸卡材质（见 00-base），`position:fixed`，四周留白，不做通栏贴边。
- 容器用 `justify-content: space-between` 两端对齐；**不要**用子元素 `margin-inline-end:auto`（响应式隐藏时会让元素堆到左侧）。
- 滚动向下隐藏（`translateY` 移出视口），向上或回顶（`scrollY ≤ 24px`）显示；隐藏时同步收起所有展开的子面板（搜索/菜单/移动面板）。
- 左侧品牌（logo 标记 + 可编辑标题，编辑见 10-editable），中间导航项（桌面），右侧操作按钮（搜索/语言/明暗/主题/汉堡）。
- **布局由需求决定**：顶栏（模板实例）与侧栏（本文件变体）都是合法导航。用户要求侧栏时用侧栏，不要坚持顶栏。
- 纯图标按钮规则见 06-icon-buttons；图标变形见 04-icon-morph；移动端浮层菜单见 07-menus。

## 变体 A：浮动顶栏（模板实例）

```html
<div class="navbar-fixed">
  <header class="navbar" id="navbar">
    <div class="navbar__brand">
      <svg class="brand-mark" viewBox="0 0 64 64" width="20" height="20" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M32 4 6 58h9L23.5 37h17L49 58h9Z M23.5 30 32 4 40.5 30Z"/></svg>
      <span class="brand-name" id="brandName" ondblclick="editInPlace(this)" tabindex="0" aria-label="站点名，双击或聚焦后按 Enter 重命名 / double-click or press Enter to rename">Site</span>
    </div>
    <nav class="navbar__nav" aria-label="Primary">
      <a class="nav-link" href="#" aria-current="page"><span data-zh>概览</span><span data-en hidden>Overview</span></a>
      <a class="nav-link" href="#"><span data-zh>项目</span><span data-en hidden>Projects</span></a>
    </nav>
    <div class="navbar__actions">
      <!-- 搜索见 05-search-pill；语言/明暗/主题按钮见 06/08；移动汉堡见 07 -->
    </div>
  </header>
</div>
```

```css
.navbar-fixed{position:fixed;top:0;left:0;right:0;z-index:40;display:flex;justify-content:center;padding-top:14px;pointer-events:none}
.navbar{
  pointer-events:auto;width:min(1180px,calc(100% - 32px));
  display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 14px;
  background:
    radial-gradient(circle at 1px 1px,var(--grid) .85px,transparent 1.1px) 0 0/19px 19px,
    var(--bg);
  border:1px solid var(--line);border-radius:var(--radius);
  box-shadow:0 4px 14px var(--shadow);
  padding:9px 12px 9px 14px;
  transition:transform .32s var(--ease),opacity .25s ease;
}
.navbar.nav-hidden{transform:translateY(-140%);opacity:.001;pointer-events:none}
.navbar__brand{display:flex;align-items:center;gap:9px;color:var(--accent)}
.brand-mark{display:block;flex:0 0 auto}
.brand-name{font:600 13px "IBM Plex Mono";letter-spacing:.02em;color:var(--ink);cursor:text;outline:0;border-radius:5px}
.navbar__nav{display:flex;align-items:center;gap:2px}
.nav-link{padding:6px 10px;border-radius:8px;color:var(--muted);text-decoration:none;font-size:13px;transition:background .18s,color .18s}
.nav-link:hover,.nav-link:focus-visible{background:var(--accent-soft);color:var(--ink)}
.nav-link[aria-current="page"]{color:var(--ink)}
.navbar__actions{display:flex;align-items:center;gap:5px}
@media(max-width:760px){.navbar__nav{display:none}}
```

```js
const navbarEl=document.getElementById("navbar");
let lastScrollY=window.scrollY||0, navHiddenFlag=false;
function handleNavScroll(){
  const y=Math.max(0,window.scrollY);
  if(y<=24){
    if(navHiddenFlag){navbarEl.classList.remove("nav-hidden");navHiddenFlag=false}
  }else if(y>lastScrollY+4){
    if(!navHiddenFlag){
      navbarEl.classList.add("nav-hidden");navHiddenFlag=true;
      closeSearch();closeNavPanel();
    }
  }else if(y<lastScrollY-4){
    if(navHiddenFlag){navbarEl.classList.remove("nav-hidden");navHiddenFlag=false}
  }
  lastScrollY=y;
}
window.addEventListener("scroll",handleNavScroll,{passive:true});
```

## 变体 B：左侧侧栏（用户要求侧栏布局时用）

固定左侧纸卡侧栏，内容区让位；移动端（≤760px）收起侧栏，改用浮层菜单（见 07-menus）。

```html
<aside class="sidebar" id="sidebar">
  <div class="sidebar__brand">
    <svg class="brand-mark" viewBox="0 0 64 64" width="20" height="20" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M32 4 6 58h9L23.5 37h17L49 58h9Z M23.5 30 32 4 40.5 30Z"/></svg>
    <span class="brand-name" id="brandName" ondblclick="editInPlace(this)" tabindex="0" aria-label="站点名，双击或聚焦后按 Enter 重命名 / double-click or press Enter to rename">Site</span>
  </div>
  <nav class="sidebar__nav" aria-label="Primary">
    <a class="nav-link" href="#" aria-current="page"><span data-zh>概览</span><span data-en hidden>Overview</span></a>
    <a class="nav-link" href="#"><span data-zh>项目</span><span data-en hidden>Projects</span></a>
  </nav>
  <div class="sidebar__actions">
    <!-- 语言/明暗/主题按钮见 06/08 -->
  </div>
</aside>
```

```css
.sidebar{
  position:fixed;top:14px;left:14px;bottom:14px;width:200px;z-index:40;
  display:flex;flex-direction:column;gap:12px;
  background:var(--bg);
  border:1px solid var(--line);border-radius:var(--radius);
  box-shadow:0 4px 14px var(--shadow);
  padding:14px 10px;
  transition:transform .32s var(--ease),opacity .25s ease;
}
.sidebar__brand{display:flex;align-items:center;gap:9px;color:var(--accent);padding:2px 4px}
.sidebar__nav{display:flex;flex-direction:column;gap:2px}
.sidebar__nav .nav-link{display:block;padding:8px 10px}
.sidebar__actions{margin-top:auto;display:flex;justify-content:center;gap:5px}

/* 内容区让位：有侧栏时 shell 左侧让出 200px + 两侧 14px 间距 + 14px 呼吸 */
body.sidebar-layout .shell,
body.sidebar-layout footer{
  margin-left:max(250px,calc((100vw - 1240px)/2 + 250px));
  margin-right:auto;
}
@media(max-width:760px){
  .sidebar{display:none}
  body.sidebar-layout .shell, body.sidebar-layout footer{margin-left:auto}
}
```

侧栏滚动显隐（可选）：与顶栏相同的逻辑，把 `translateY` 换成 `translateX(-120%)`。

## 移动端

导航项收进浮层菜单（07-menus）：汉堡按钮 + 悬浮 2×2 卡片网格，不进文档流。
