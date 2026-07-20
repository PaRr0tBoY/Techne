#!/usr/bin/env node
/**
 * Vivaldi Preferences — read/write/search settings.
 *
 *   get:  reads from disk (instant, no Vivaldi needed)
 *   set:  applies live via CDP (same API Vivaldi's own settings UI uses)
 *   search/list: reads from disk
 *
 * Usage:
 *   node prefs.mjs get <path>
 *   node prefs.mjs set <path> <value>
 *   node prefs.mjs search <keyword>
 *   node prefs.mjs list <category>
 *   node prefs.mjs snapshot
 */

import { readFileSync, existsSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { createConnection } from 'node:net';
import { randomBytes } from 'node:crypto';
import { get } from 'node:http';

const PREF_PATH = 'C:/Users/Acid/AppData/Local/Vivaldi/User Data/Default/Preferences';
const VIVALDI_EXE = 'D:/Package/软件/Application/vivaldi.exe';
const CDP_PORT = parseInt(process.env.VIVALDI_CDP_PORT || '9222');

// ── Disk helpers ──

function readPrefs() {
  if (!existsSync(PREF_PATH)) throw new Error('Preferences not found');
  return JSON.parse(readFileSync(PREF_PATH, 'utf8'));
}

function vivaldiRunning() {
  try { execSync('tasklist /fi "imagename eq vivaldi.exe" 2>nul | find /i "vivaldi"', { stdio: 'pipe' }); return true; }
  catch { return false; }
}

function ensureVivaldiCDP() {
  if (!vivaldiRunning()) {
    console.error('[prefs] Starting Vivaldi...');
    spawnSync('powershell', ['-Command', `Start-Process '${VIVALDI_EXE}' -ArgumentList '--remote-debugging-port=${CDP_PORT}'`], { stdio: 'pipe', shell: true });
    for (let i = 0; i < 20; i++) {
      const s = Date.now(); while (Date.now() - s < 1000) {}
      try { execSync(`node -e "require('http').get('http://localhost:${CDP_PORT}/json/version',r=>{r.resume();process.exit(0)}).on('error',()=>process.exit(1))"`, { stdio: 'pipe', timeout: 2000 }); console.error('[prefs] CDP ready'); return true; }
      catch {}
    }
    throw new Error('CDP startup timeout');
  }
  return true;
}

// ── CDP helpers ──

function wsConnect(urlStr) {
  const url = new URL(urlStr);
  return new Promise((resolve, reject) => {
    const wkey = randomBytes(16).toString('base64');
    const req = `GET ${url.pathname}${url.search} HTTP/1.1\r\nHost: ${url.hostname}:${parseInt(url.port)||9222}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${wkey}\r\nSec-WebSocket-Version: 13\r\n\r\n`;
    const sock = createConnection({host: url.hostname, port: parseInt(url.port)||9222});
    let hs=false, hsD='', buf=Buffer.alloc(0), h=[], mid=0;
    function sendFrame(s) {
      const pl=Buffer.from(s,'utf8'), mk=randomBytes(4), len=pl.length;
      let hdr; if(len<126){hdr=Buffer.allocUnsafe(2);hdr[0]=0x81;hdr[1]=0x80|len;} else{hdr=Buffer.allocUnsafe(4);hdr[0]=0x81;hdr[1]=0x80|126;hdr.writeUInt16BE(len,2);}
      const m=Buffer.allocUnsafe(len); for(let i=0;i<len;i++)m[i]=pl[i]^mk[i%4];
      sock.write(Buffer.concat([hdr,mk,m]));
    }
    function proc() {while(buf.length>=2){const op=buf[0]&0xf;let len=buf[1]&0x7f,off=2;
      if(len===126){if(buf.length<4)break;len=buf.readUInt16BE(2);off=4;} else if(len===127){if(buf.length<10)break;len=Number(buf.readBigUInt64BE(2));off=10;}
      if(buf.length<off+len)break; if(op===0x8){sock.end();return;} if(op===0x9){const p=Buffer.concat([Buffer.from([0x8a,len]),buf.subarray(off,off+len)]);sock.write(p);buf=buf.subarray(off+len);continue;}
      const ps=buf.subarray(off,off+len).toString('utf8');buf=buf.subarray(off+len);
      try{const m=JSON.parse(ps);if(m.id){for(let i=h.length-1;i>=0;i--){if(h[i].pred(m)){h[i].resolve(m);h.splice(i,1);break;}}}}catch{}}}
    sock.on('connect',()=>sock.write(req));
    sock.on('data',(d)=>{if(!hs){hsD+=d.toString('utf8');if(hsD.includes('\r\n\r\n')){buf=Buffer.from(hsD.substring(hsD.indexOf('\r\n\r\n')+4),'binary');hs=true;if(buf.length>0)proc();resolve({send(method,params,sid){const id=++mid;sendFrame(JSON.stringify(sid?{id,method,params,sessionId:sid}:{id,method,params}));return new Promise((res,rej)=>{h.push({pred:m=>m.id===id,resolve:res,reject:rej});setTimeout(()=>{const i=h.findIndex(x=>x.resolve===res);if(i>=0){h.splice(i,1);rej(new Error('Timeout'))}},15000);});},close:()=>sock.end()});}return;}buf=Buffer.concat([buf,d]);proc();});
    sock.on('error',reject);
  });
}

async function cdpEval(code) {
  const ver = await new Promise((r,j)=>get(`http://localhost:${CDP_PORT}/json/version`,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>r(JSON.parse(d)));}).on('error',j));
  const browser = await wsConnect(ver.webSocketDebuggerUrl);
  const targets = await new Promise((r,j)=>get(`http://localhost:${CDP_PORT}/json/list`,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>r(JSON.parse(d)));}).on('error',j));
  const win = targets.find(t=>t.url?.includes('window.html'));
  if(!win) throw new Error('window.html not found');
  const ar = await browser.send('Target.attachToTarget',{targetId:win.id,flatten:true});
  const sid = ar.result.sessionId;
  await browser.send('Runtime.enable',{},sid);
  const result = await browser.send('Runtime.evaluate',{expression:code,returnByValue:true,awaitPromise:true},sid);
  browser.close();
  return result.result?.result?.value;
}

// ── Commands ──

async function cmdGet(path) {
  const prefs = readPrefs();
  const parts = path.split('.');
  let val = prefs;
  for (const p of parts) {
    if (val && typeof val === 'object') val = val[p];
    else { console.log(JSON.stringify({error:`path not found: ${path}`, missing: p})); return; }
  }
  console.log(JSON.stringify({ path, value: val }));
}

async function cmdSet(path, valueStr) {
  let value;
  try { value = JSON.parse(valueStr); } catch { value = valueStr; }

  // Read old value from disk
  let oldVal;
  try {
    const prefs = readPrefs();
    const parts = path.split('.');
    let v = prefs;
    for (const p of parts) { v = v[p]; }
    oldVal = v;
  } catch {}

  ensureVivaldiCDP();

  // Call Vivaldi's own API — same as clicking in settings UI
  const valJson = JSON.stringify(value);
  const code = `(async()=>{self.vivaldi.prefs.set({path:"${path}",value:${valJson}});await new Promise(r=>setTimeout(r,400));const v=await new Promise(r=>self.vivaldi.prefs.get("${path}",r));return v.value;})()`;
  const result = await cdpEval(code);

  const changed = String(result) === String(value);
  console.log(JSON.stringify({
    path, old: oldVal, new: result,
    applied: changed ? '✓ live' : '⚠ value reverted — run "prefs.mjs probe ' + path + '" to see valid options'
  }));
}

async function cmdProbe(path) {
  ensureVivaldiCDP();

  // 1. Read current state via CDP
  const infoCode = `(async()=>{const v=await new Promise(r=>self.vivaldi.prefs.get("${path}",r));return {current:v.value,default:v.defaultValue,store:v.store};})()`;
  const info = await cdpEval(infoCode);

  console.log(JSON.stringify({ path, current: info.current, default: info.default }));

  // 2. Generate candidate values to test
  const candidates = new Set();

  // From default
  if (info.default !== undefined && info.default !== null) {
    candidates.add(String(info.default));
  }

  // From common enum patterns based on path keywords
  const pathLower = path.toLowerCase();
  const candidateLists = {
    position: ['top','bottom','left','right','none','hidden'],
    mode: ['off','on','compact','accordion','two_level','substrip','dotted','dense','normal','comfortable'],
    display: ['shown','hidden','minimized','overlay','horizontal','vertical'],
    placement: ['after_related','after_active','end','beginning'],
    size: ['small','medium','large'],
    color: ['theme','custom','default'],
    activation: ['neighbor','related','last_active','order'],
    click: ['none','close','new_tab','reload','mute','toggle'],
    sorting: ['manual','alpha','by_date'],
    density: ['compact','regular','comfortable'],
    layout: ['horizontal','vertical','grid','list'],
    button_style: ['icon_only','text_only','icon_and_text'],
  };

  for (const [keyword, values] of Object.entries(candidateLists)) {
    if (pathLower.includes(keyword)) {
      values.forEach(v => candidates.add(v));
    }
  }

  // Add current value
  if (info.current !== undefined && info.current !== null) {
    candidates.add(String(info.current));
  }

  // Also try integers 0-4
  for (let i = 0; i <= 4; i++) candidates.add(String(i));

  // Boolean
  candidates.add('true');
  candidates.add('false');

  // 3. Test each candidate
  const valid = [];
  const original = info.current;
  const testedValues = new Set();

  for (const candidate of candidates) {
    if (testedValues.has(candidate)) continue;
    testedValues.add(candidate);

    if (candidate === String(original)) {
      valid.push({ value: candidate, type: 'current' });
      continue;
    }

    // Try setting this candidate
    const cJson = JSON.stringify(isNaN(candidate) ? candidate : Number(candidate));
    try {
      const testResult = await cdpEval(
        `(async()=>{` +
        `self.vivaldi.prefs.set({path:"${path}",value:${cJson}});` +
        `await new Promise(r=>setTimeout(r,200));` +
        `const v=await new Promise(r=>self.vivaldi.prefs.get("${path}",r));` +
        `return v.value;` +
        `})()`
      );
      if (String(testResult) === String(candidate)) {
        valid.push({ value: candidate, type: 'valid' });
      }
    } catch {}
  }

  // 4. Restore original value
  const origJson = JSON.stringify(original);
  await cdpEval(
    `(async()=>{self.vivaldi.prefs.set({path:"${path}",value:${origJson}});await new Promise(r=>setTimeout(r,100));return "ok";})()`
  );

  // 5. Report
  const validValues = valid.map(v => v.value);
  const currentStr = String(original);
  console.error(`\n[prefs] Valid options for ${path}:`);
  valid.forEach(v => {
    const marker = v.value === currentStr ? ' ← current' : (v.value === String(info.default) ? ' (default)' : '');
    console.error(`  ${v.value}${marker}`);
  });
  console.log(JSON.stringify({ path, valid: validValues, current: currentStr, default: info.default }));
}

async function cmdSearch(keyword) {
  const prefs = readPrefs();
  const results = [];
  (function search(obj, prefix) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const key of Object.keys(obj)) {
      const p = prefix ? prefix + '.' + key : key;
      if (p.toLowerCase().includes(keyword.toLowerCase())) {
        results.push({ path: p, value: obj[key] });
      }
      if (!Array.isArray(obj[key]) && typeof obj[key] === 'object') search(obj[key], p);
    }
  })(prefs, '');
  results.forEach(r => {
    const d = typeof r.value === 'object' ? JSON.stringify(r.value).substring(0, 80) : String(r.value);
    console.log(`${r.path} = ${d}`);
  });
  console.error(`\n[prefs] ${results.length} results for "${keyword}"`);
}

async function cmdList(category) {
  const prefs = readPrefs();
  const fullKey = `vivaldi.${category}`;
  const parts = fullKey.split('.');
  let obj = prefs;
  for (const p of parts) {
    if (obj && typeof obj === 'object') obj = obj[p];
    else { console.error(`Category not found: ${fullKey}`); return; }
  }
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const d = typeof v === 'object' ? JSON.stringify(v).substring(0, 80) : String(v);
      console.log(`${fullKey}.${k} = ${d}`);
    }
    console.error(`\n[prefs] ${Object.keys(obj).length} keys in ${fullKey}`);
  } else {
    console.log(`${fullKey} = ${JSON.stringify(obj)}`);
  }
}

async function cmdSnapshot() {
  const cats = {
    'Tab Bar': ['vivaldi.tabs.bar.position', 'vivaldi.tabs.visible'],
    'Tab Stacks': ['vivaldi.tabs.stacking.mode', 'vivaldi.tabs.stacking.allow_dnd'],
    'Address Bar': ['vivaldi.address_bar.visible', 'vivaldi.address_bar.show_full_url'],
    'Panels': ['vivaldi.panels.position', 'vivaldi.panels.as_overlay.enabled'],
    'Status Bar': ['vivaldi.status_bar.display'],
    'Bookmarks': ['vivaldi.bookmarks.bar.visible'],
    'Appearance': ['vivaldi.appearance.density'],
    'Theme': ['vivaldi.theme.schedule.enabled', 'vivaldi.theme.prefer_system_accent'],
    'Gestures': ['vivaldi.mouse_gestures.enabled'],
    'Workspaces': ['vivaldi.workspaces.enabled'],
    'Auto-hide': ['vivaldi.auto_hide.enabled', 'vivaldi.auto_hide.tab_bar']
  };
  const prefs = readPrefs();
  const snap = {};
  for (const [cat, paths] of Object.entries(cats)) {
    snap[cat] = {};
    for (const p of paths) {
      const parts = p.split('.');
      let v = prefs;
      for (const k of parts) { if (v && typeof v === 'object') v = v[k]; else { v = undefined; break; } }
      snap[cat][p] = v;
    }
  }
  console.log(JSON.stringify(snap, null, 2));
}

// ── CLI ──

const [,, cmd, ...args] = process.argv;

async function main() {
  switch (cmd) {
    case 'get':
      if (!args[0]) { console.error('Usage: prefs.mjs get <path>'); process.exit(1); }
      await cmdGet(args[0]);
      break;
    case 'set':
      if (!args[0] || args[1] === undefined) { console.error('Usage: prefs.mjs set <path> <value>'); process.exit(1); }
      await cmdSet(args[0], args[1]);
      break;
    case 'probe':
      if (!args[0]) { console.error('Usage: prefs.mjs probe <path>'); process.exit(1); }
      await cmdProbe(args[0]);
      break;
    case 'search':
      if (!args[0]) { console.error('Usage: prefs.mjs search <keyword>'); process.exit(1); }
      await cmdSearch(args[0]);
      break;
    case 'list':
      if (!args[0]) { console.error('Usage: prefs.mjs list <category>'); process.exit(1); }
      await cmdList(args[0]);
      break;
    case 'snapshot':
      await cmdSnapshot();
      break;
    default:
      console.error(`Vivaldi Prefs Manager

Usage:
  node prefs.mjs get <path>            Read (instant, from disk)
  node prefs.mjs set <path> <value>    Set (live via Vivaldi API)
  node prefs.mjs search <keyword>      Search preferences
  node prefs.mjs list <category>       List category
  node prefs.mjs snapshot              Overview

Set examples:
  node prefs.mjs set vivaldi.tabs.bar.position '"left"'
  node prefs.mjs set vivaldi.tabs.stacking.mode '"accordion"'
  node prefs.mjs set vivaldi.status_bar.display '"hidden"'
  node prefs.mjs set vivaldi.panels.position '"right"'
  node prefs.mjs set vivaldi.bookmarks.bar.visible false
  node prefs.mjs set vivaldi.mouse_gestures.enabled true

NOTE: set applies live via Vivaldi's own prefs API.
      Some values may be rejected if not valid for your Vivaldi version.
      If 'applied: ⚠ value reverted', try a different value string.
`);
      process.exit(1);
  }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
