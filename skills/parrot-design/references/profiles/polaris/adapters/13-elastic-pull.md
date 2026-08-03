# 13 · 底部弹性下拉（可选玩味组件）

## 规范要点

- 用 `wheel`/`touch` 事件模拟底部橡皮筋回弹（浏览器无原生接口）；数据类页面通常**不需要**。
- 必须 `position:fixed` 悬浮在页面之上，**不进文档流**（进文档流会不断改变 `scrollHeight`，形成抖动反馈环）。
- 分层阈值显示（5 层塔层，各自独立 transform/opacity 过渡），不用逐像素插值改 `height`。
- 拉动距离经指数缓动映射；停止输入约 220ms 后收回；完全拉满松手可选弹回顶部（删掉 `release()` 里的 `wasFull` 条件即可关闭）。
- footer 与下拉联动：跟随时不加 transition，回弹时短暂开启 `footer-spring`。

## 代码

```html
<div class="elastic-pull" id="elasticPull" aria-hidden="true">
  <span class="elastic-pull__tier" style="--w:100%;--o:.55"></span>
  <span class="elastic-pull__tier" style="--w:76%;--o:.46"></span>
  <span class="elastic-pull__tier" style="--w:54%;--o:.37"></span>
  <span class="elastic-pull__tier" style="--w:34%;--o:.28"></span>
  <span class="elastic-pull__tier" style="--w:16%;--o:.2"></span>
</div>
```

```css
.elastic-pull{position:fixed;left:0;right:0;bottom:0;height:0;z-index:30;pointer-events:none;filter:blur(13px)}
.elastic-pull__tier{
  position:absolute;left:50%;bottom:0;height:30px;width:var(--w);
  border-radius:6px 6px 0 0;
  transform:translate(-50%,0) scaleY(0);transform-origin:bottom;
  opacity:0;transition:transform .4s var(--ease),opacity .32s ease;
}
.elastic-pull__tier:nth-child(1){bottom:0;background:var(--accent)}
.elastic-pull__tier:nth-child(2){bottom:18px;background:color-mix(in srgb,var(--accent) 82%,var(--bg))}
.elastic-pull__tier:nth-child(3){bottom:36px;background:color-mix(in srgb,var(--accent) 62%,var(--bg))}
.elastic-pull__tier:nth-child(4){bottom:54px;background:color-mix(in srgb,var(--accent) 42%,var(--bg))}
.elastic-pull__tier:nth-child(5){bottom:72px;background:color-mix(in srgb,var(--accent) 22%,var(--bg))}
.elastic-pull__tier.show{opacity:var(--o);transform:translate(-50%,0) scaleY(1)}
footer{transition:none}
footer.footer-spring{transition:transform .4s var(--ease)}
```

```js
const tiers=Array.from(document.querySelectorAll(".elastic-pull__tier"));
const MAX_PULL=105;
const reduceMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let rawPull=0, pull=0, releaseTimer=null;

function atBottom(){
  return window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-2;
}
function applyTiers(v){
  const count=Math.round((v/MAX_PULL)*tiers.length);
  tiers.forEach((t,i)=>t.classList.toggle("show",i<count));
}
function setRawPull(next){
  rawPull=Math.max(0,next);
  pull=MAX_PULL*(1-Math.exp(-rawPull/(MAX_PULL*0.9)));
  applyTiers(pull);
}
function release(){
  const wasFull=pull>=MAX_PULL*0.92;
  rawPull=0; pull=0;
  applyTiers(0);
  if(wasFull){
    window.scrollTo({top:0,behavior:reduceMotion?"auto":"smooth"});
  }
}
function scheduleRelease(){
  clearTimeout(releaseTimer);
  releaseTimer=setTimeout(release,220);
}
window.addEventListener("wheel",e=>{
  if(atBottom()&&e.deltaY>0){
    setRawPull(rawPull+e.deltaY);
    scheduleRelease();
  }else if(pull>0&&e.deltaY<0){
    clearTimeout(releaseTimer);
    release();
  }
},{passive:true});

let touchStartY=null;
window.addEventListener("touchstart",e=>{touchStartY=e.touches[0].clientY},{passive:true});
window.addEventListener("touchmove",e=>{
  if(touchStartY===null)return;
  const dy=touchStartY-e.touches[0].clientY;
  if(atBottom()&&dy>0){setRawPull(dy*1.6)}
},{passive:true});
window.addEventListener("touchend",()=>{touchStartY=null;release()});
```
