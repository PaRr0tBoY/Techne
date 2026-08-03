# 06 · 纯图标按钮（Icon-First Controls）

## 规范要点

- 动作能用通用图标表达时：只用图标，不加文字；语义靠 `title`（hover 延迟显示）+ `aria-label` 兜底。
- **两个属性都要**，且随语言切换动态更新（中文 `aria-label="切换语言 / Switch language"` 这类双语值在两种语言下都要可读）。
- 适用：搜索、语言、明暗、主题、关闭、下载、分享、书签等约定俗成的图标动作。
- 不适用：语义不直观的动作（下拉菜单项、移动面板项）→ 图标 + 文字，且全局一致不混用。
- 导航栏内的语言/明暗/主题是「图标-only」的上下文例外；菜单等其它上下文按图标+文字。

## 代码

```html
<button class="icon-btn" id="langBtn" type="button" aria-label="切换语言 / Switch language" title="切换语言 / Switch language">
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2 8h12M8 1.8c2.1 1.7 2.1 10.7 0 12.4M8 1.8c-2.1 1.7-2.1 10.7 0 12.4" fill="none" stroke="currentColor" stroke-width="1"/></svg>
</button>
<button class="icon-btn" id="modeBtn" type="button" aria-label="切换明暗模式 / Toggle light and dark mode" title="切换明暗模式 / Toggle light and dark mode">
  <svg id="iconSun" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" hidden><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M8 1.2v2M8 12.8v2M1.2 8h2M12.8 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M12.7 3.3l-1.4 1.4M4.7 11.3l-1.4 1.4" stroke="currentColor" stroke-width="1"/></svg>
  <svg id="iconMoon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M13 9.2A5.6 5.6 0 1 1 6.8 3a4.4 4.4 0 0 0 6.2 6.2Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
</button>
<button class="icon-btn" id="themeBtn" type="button" aria-label="切换主题色 / Change accent theme" title="切换主题色 / Change accent theme">
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M8 1.6a6.4 6.4 0 1 0 0 12.8c.9 0 1.5-.5 1.5-1.3 0-.4-.2-.7-.2-1.1 0-.6.5-1 1.1-1H11.4a2.7 2.7 0 0 0 2.7-2.7C14.1 4.3 11.4 1.6 8 1.6Z" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><circle cx="5" cy="6.4" r=".85" fill="currentColor"/><circle cx="7.7" cy="4.3" r=".85" fill="currentColor"/><circle cx="10.5" cy="5.6" r=".85" fill="currentColor"/></svg>
</button>
```

```css
.icon-btn{
  width:34px;height:34px;border:1px solid transparent;background:transparent;color:inherit;
  display:grid;place-items:center;border-radius:50%;cursor:pointer;flex:0 0 auto;
  transition:background .18s,border-color .18s;
}
.icon-btn:hover{background:var(--accent-soft);border-color:var(--line)}
```

语言/明暗/主题的切换逻辑与动态标签见 08-theme-mode。
