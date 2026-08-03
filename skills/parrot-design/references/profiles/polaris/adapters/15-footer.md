# 15 · Footer

## 规范要点

- Footer 与 `.shell` 保持相同水平留白：自己声明 `max-width` + `margin:auto` + 独立 padding，**不依赖**父容器继承（曾经因在 `.shell` 外而贴边）。
- 内容两端对齐（`space-between`），窄屏（≤620px）转纵向。
- 弹性下拉联动（用 13 时）：跟随阶段不加 transition，回弹时加 `.footer-spring`。

## 代码

```html
<footer>
  <span><span data-zh>站点名</span><span data-en hidden>Site name</span></span>
  <span>RESPONSIVE · A11Y · REDUCED MOTION · BILINGUAL</span>
</footer>
```

```css
footer{max-width:1240px;margin:0 auto;display:flex;justify-content:space-between;gap:20px;padding:30px 30px 60px;color:var(--muted);font:11px "IBM Plex Mono";position:relative;z-index:1}
@media(max-width:620px){footer{flex-direction:column;padding:26px 20px 50px}}
```

有侧栏布局（01-nav 变体 B）时 footer 同样让位（`body.sidebar-layout footer` 的 margin 规则见 01-nav）。
