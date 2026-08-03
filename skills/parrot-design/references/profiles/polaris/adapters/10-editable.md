# 10 · 就地编辑（Editable Container Control）

## 规范要点

- **容器即控件**：容器本身就是编辑控件，禁止在容器里再嵌输入框、边框或背景层（无「框中框」）。代码块/媒体槽/数据面板在卡片内就直接呈现，不再套一层卡片。
- 用 `contenteditable`，**不要**用 `<input>` 模拟就地编辑（定宽与默认样式会造成编辑前后几何跳动）。
- 编辑前后几何完全不变：大小、背景、字号一致，只有光标与选区可见。
- 入口：双击，或聚焦后按 `Enter`/`F2`；`Enter` 提交、`Escape` 还原。
- 不加任何「可以点击」的提示文字/图形——可发现性来自交互本身。
- 用户重命名内容不包翻译对（09）。

## 代码

```js
function editInPlace(el){
  if(el.getAttribute("contenteditable")==="true")return;
  const original=el.textContent;
  el.setAttribute("contenteditable","true");
  el.setAttribute("spellcheck","false");
  el.focus();
  const range=document.createRange();
  range.selectNodeContents(el);
  const sel=window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  function finish(){
    el.removeAttribute("contenteditable");
    if(!el.textContent.trim())el.textContent=original;
    el.removeEventListener("blur",finish);
    el.removeEventListener("keydown",onKey);
  }
  function onKey(e){
    if(e.key==="Enter"){e.preventDefault();el.blur()}
    if(e.key==="Escape"){el.textContent=original;el.blur()}
  }
  el.addEventListener("blur",finish);
  el.addEventListener("keydown",onKey);
}
document.addEventListener("keydown",e=>{
  if(e.key==="Enter"||e.key==="F2"){
    const el=document.activeElement;
    if(el && (el.classList.contains("tab")||el.id==="brandName") && el.getAttribute("contenteditable")!=="true"){
      e.preventDefault();
      editInPlace(el);
    }
  }
});
```

## 用法

```html
<span class="brand-name" id="brandName" ondblclick="editInPlace(this)" tabindex="0" aria-label="站点名，双击或聚焦后按 Enter 重命名 / double-click or press Enter to rename">Site</span>
```

可编辑元素：`tabindex="0"` + `aria-label`（说明编辑方式）+ `ondblclick="editInPlace(this)"`。
