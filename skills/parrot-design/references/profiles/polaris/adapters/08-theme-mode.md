# 08 · 主题 × 明暗切换

## 规范要点

- 五主题（Graphite / Cobalt / **Verdigris 默认** / Amber / Violet）× 明暗两态；默认组合 Verdigris + 暗色。
- token 切换只动 `html[data-theme]` / `html[data-mode]`（映射见 00-base），页面全局 transition 平滑过渡。
- 明暗按钮：不同模式下显示对应图标（太阳/月亮），不要两个图标挤一起；图标间可加 morph 过渡（04）。
- 主题/明暗持久化到 `localStorage`。
- 动态更新 a11y 标签：`aria-label`/`title` 含当前主题名与当前明暗态，随语言切换刷新。

## 代码

```js
const root=document.documentElement;
const themes=["graphite","cobalt","verdigris","amber","violet"];
const themeNames={
  graphite:{zh:"石墨",en:"Graphite"},
  cobalt:{zh:"钴蓝",en:"Cobalt"},
  verdigris:{zh:"青绿",en:"Verdigris"},
  amber:{zh:"琥珀",en:"Amber"},
  violet:{zh:"紫罗兰",en:"Violet"}
};
let themeIndex=Math.max(0,themes.indexOf(root.dataset.theme));
const langBtn=document.getElementById("langBtn");
const themeBtn=document.getElementById("themeBtn");
const modeBtn=document.getElementById("modeBtn");
const iconSun=document.getElementById("iconSun");
const iconMoon=document.getElementById("iconMoon");

function isEnglish(){return root.lang==="en"}
function updateThemeA11y(){
  const name=themeNames[themes[themeIndex]];
  const label=isEnglish()?`Change accent theme (current: ${name.en})`:`切换主题色（当前：${name.zh}）`;
  themeBtn.setAttribute("aria-label",label);
  themeBtn.title=label;
}
function updateModeA11y(){
  const dark=root.dataset.mode==="dark";
  const label=isEnglish()?`Toggle light and dark mode (current: ${dark?"dark":"light"})`:`切换明暗模式（当前：${dark?"深色":"浅色"}）`;
  modeBtn.setAttribute("aria-label",label);
  modeBtn.title=label;
}
function applyMode(dark){
  root.dataset.mode=dark?"dark":"light";
  iconSun.hidden=dark; iconMoon.hidden=!dark;
  localStorage.setItem("mode",root.dataset.mode);
  updateModeA11y();
}
modeBtn.addEventListener("click",()=>{applyMode(root.dataset.mode!=="dark")});
themeBtn.addEventListener("click",()=>{
  themeIndex=(themeIndex+1)%themes.length;
  root.dataset.theme=themes[themeIndex];
  updateThemeA11y();
  localStorage.setItem("theme",themes[themeIndex]);
});
langBtn.addEventListener("click",()=>{applyLang(!isEnglish())});

const savedTheme=localStorage.getItem("theme");
if(savedTheme && themes.includes(savedTheme)){themeIndex=themes.indexOf(savedTheme);root.dataset.theme=savedTheme}
const savedMode=localStorage.getItem("mode");
applyMode(savedMode?savedMode==="dark":root.dataset.mode==="dark");
```

- `langBtn` 与 `applyLang` 见 09-i18n（页面初始化时调用一次 `applyLang(false)`）。
- 只用单一主题（需求指定时）：删掉 `themes` 循环，保留 `data-theme` 映射即可。
