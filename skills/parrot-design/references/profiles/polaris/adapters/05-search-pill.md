# 05 · 搜索胶囊（Search Control）

## 规范要点

- 默认只显示图标按钮；点击后**整体**向右展开为统一圆角胶囊（图标 + 输入框同在一个 pill 里），**不要**圆形图标背景与矩形输入框两个形状打架。
- 输入框禁用默认方形 `:focus-visible` 轮廓（胶囊边框已表达状态）。
- 图标复用 04 的「形态即状态」：搜索 ⇄ 关闭两个 SVG 在同一按钮内，`.open` 切换。
- Escape 关闭并聚焦回按钮；点击外部且无输入时关闭。

## 代码

```html
<div class="search" id="search">
  <button class="icon-btn" id="searchBtn" type="button" aria-expanded="false" aria-label="搜索 / Search" title="搜索 / Search">
    <svg id="iconSearch" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="6.8" cy="6.8" r="4.3" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M10.2 10.2 14 14" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
    <svg id="iconSearchClose" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" hidden><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
  </button>
  <input class="search__input" id="searchInput" type="text" aria-label="搜索 / Search">
</div>
```

```css
.search{display:flex;align-items:center;gap:2px;border-radius:999px;border:1px solid transparent;transition:background .2s ease,border-color .2s ease}
.search.open{background:var(--surface-2);border-color:var(--line);padding-right:10px}
.search__input{width:0;border:0;background:transparent;color:inherit;padding:0;opacity:0;min-width:0;
  transition:width .22s var(--ease),opacity .18s ease,padding .22s var(--ease);font-size:13px}
.search__input::placeholder{color:var(--faint)}
.search__input:focus-visible{outline:none}
.search.open .search__input{width:15ch;opacity:1;padding:0 2px 0 6px}
.search.open .icon-btn:hover{border-color:transparent}
```

```js
const searchWrap=document.getElementById("search");
const searchBtn=document.getElementById("searchBtn");
const iconSearch=document.getElementById("iconSearch");
const iconSearchClose=document.getElementById("iconSearchClose");
function closeSearch(){
  searchWrap.classList.remove("open");
  searchBtn.setAttribute("aria-expanded","false");
  iconSearch.hidden=false; iconSearchClose.hidden=true;
  searchInput.value="";
}
searchBtn.addEventListener("click",()=>{
  const open=searchWrap.classList.toggle("open");
  searchBtn.setAttribute("aria-expanded",String(open));
  iconSearch.hidden=open; iconSearchClose.hidden=!open;
  if(open){searchInput.focus()}else{searchInput.value="";searchInput.blur()}
});
searchInput.addEventListener("keydown",e=>{
  if(e.key==="Escape"){closeSearch();searchBtn.focus()}
});
```

搜索行为（过滤/跳转）由需求决定；`searchInput` 的 `value` 变化事件按需挂接。
