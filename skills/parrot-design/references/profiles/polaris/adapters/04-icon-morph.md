# 04 · 图标变形（Icon Morph）

## 规范要点

- `+` ⇄ `×`、汉堡 ⇄ 关闭、搜索 ⇄ 关闭共用同一套「形态即状态」动效：CSS 旋转/线段位移，`.icon-btn.open` 驱动。
- 只动 `transform`/`opacity`，不动布局属性；时长 ~0.28s，`var(--ease)`。
- 变形的两个图标放在**同一个按钮内**，由 `.open` 类切换；或同一图标几何变形（汉堡三条线 → 叉）。

## 代码

```css
/* + ⇄ × */
.plus{position:relative;width:15px;height:15px;display:block;transition:transform .28s var(--ease)}
.plus:before,.plus:after{content:"";position:absolute;left:50%;top:50%;width:13px;height:1.5px;background:currentColor;border-radius:2px;transform:translate(-50%,-50%)}
.plus:after{transform:translate(-50%,-50%) rotate(90deg)}
.icon-btn.open .plus{transform:rotate(45deg)}

/* 汉堡 ⇄ 关闭 */
.burger{position:relative;width:15px;height:11px;display:block}
.burger i{position:absolute;left:0;width:100%;height:1.5px;background:currentColor;border-radius:2px;font-style:normal;
  transition:transform .28s var(--ease),opacity .2s ease,top .28s var(--ease)}
.burger i:nth-child(1){top:0}
.burger i:nth-child(2){top:4.75px}
.burger i:nth-child(3){top:9.5px}
.icon-btn.open .burger i:nth-child(1){top:4.75px;transform:rotate(45deg)}
.icon-btn.open .burger i:nth-child(2){opacity:0}
.icon-btn.open .burger i:nth-child(3){top:4.75px;transform:rotate(-45deg)}

/* 搜索 ⇄ 关闭：两个 SVG 在同一按钮内，hidden 切换（见 05-search-pill） */
```

```js
/* 通用开关（汉堡/加号等） */
function toggleBtnState(btn){
  const open=btn.classList.toggle("open");
  btn.setAttribute(btn.hasAttribute("aria-pressed")?"aria-pressed":"aria-expanded",String(open));
}
```

## 用法

- 汉堡按钮：`<span class="burger" aria-hidden="true"><i></i><i></i><i></i></span>` 放在 `.icon-btn` 内。
- `+` 按钮：`<span class="plus" aria-hidden="true"></span>`。
- 图标按钮必须带 `aria-label` + `title`（见 06）。
