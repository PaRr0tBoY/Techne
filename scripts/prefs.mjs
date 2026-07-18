#!/usr/bin/env node
/**
 * Vivaldi Preferences — read/write/search settings.
 * Writes to disk FIRST (always works), then applies live via CDP if Vivaldi is reachable.
 *
 * Usage:
 *   node prefs.mjs get <path>           Read a preference
 *   node prefs.mjs set <path> <value>   Set a preference (JSON values supported)
 *   node prefs.mjs search <keyword>     Search preference paths by keyword
 *   node prefs.mjs list <category>      List all prefs under a category
 *   node prefs.mjs snapshot             Full categorized snapshot
 *
 * Examples:
 *   node prefs.mjs get vivaldi.tabs.bar.position
 *   node prefs.mjs set vivaldi.tabs.bar.position '"left"'
 *   node prefs.mjs set vivaldi.auto_hide.tab_bar false
 *   node prefs.mjs search break
 *   node prefs.mjs list tabs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { createConnection } from 'node:net';
import { randomBytes } from 'node:crypto';
import { get } from 'node:http';

const PREF_PATH = 'C:/Users/Acid/AppData/Local/Vivaldi/User Data/Default/Preferences';
const VIVALDI_EXE = 'D:/Package/软件/Application/vivaldi.exe';
const CDP_PORT = parseInt(process.env.VIVALDI_CDP_PORT || '9222');

// ── Helpers ──

function readPrefs() {
  if (!existsSync(PREF_PATH)) throw new Error(`Preferences not found: ${PREF_PATH}`);
  return JSON.parse(readFileSync(PREF_PATH, 'utf8'));
}

function writePrefs(prefs) {
  writeFileSync(PREF_PATH, JSON.stringify(prefs, null, 2), 'utf8');
}

function vivaldiRunning() {
  try { execSync('tasklist /fi "imagename eq vivaldi.exe" 2>nul | find /i "vivaldi"', { stdio: 'pipe' }); return true; }
  catch { return false; }
}

async function isCDPAlive() {
  return new Promise(resolve => {
    get(`http://localhost:${CDP_PORT}/json/version`, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(true));
    }).on('error', () => resolve(false));
  });
}

function ensureVivaldiCDP() {
  if (!vivaldiRunning()) {
    console.error('[prefs] Vivaldi not running — starting with debug port...');
    spawnSync('powershell', ['-Command', `Start-Process '${VIVALDI_EXE}' -ArgumentList '--remote-debugging-port=${CDP_PORT}'`], { stdio: 'pipe', shell: true });
    // Wait for CDP to be ready
    for (let i = 0; i < 15; i++) {
      const start = Date.now(); while (Date.now() - start < 1000) {} // sleep 1s
      try {
        execSync(`node -e "require('http').get('http://localhost:${CDP_PORT}/json/version',r=>{r.resume();process.exit(0)}).on('error',()=>process.exit(1))"`, { stdio: 'pipe', timeout: 2000 });
        console.error('[prefs] Vivaldi CDP ready');
        return true;
      } catch {}
    }
    console.error('[prefs] CDP startup timeout — disk write applied, restart manually to see changes');
    return false;
  }
  return true;
}

// ── WebSocket CDP client ──

function wsConnect(urlStr) {
  const url = new URL(urlStr);
  return new Promise((resolve, reject) => {
    const wkey = randomBytes(16).toString('base64');
    const req = `GET ${url.pathname}${url.search} HTTP/1.1\r\nHost: ${url.hostname}:${parseInt(url.port)||9222}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${wkey}\r\nSec-WebSocket-Version: 13\r\n\r\n`;
    const sock = createConnection({host: url.hostname, port: parseInt(url.port)||9222});
    let hs=false, hsD='', buf=Buffer.alloc(0), h=[], mid=0;
    function sendFrame(s) {
      const pl=Buffer.from(s,'utf8'), mk=randomBytes(4), len=pl.length;
      let hdr; if(len<126){hdr=Buffer.allocUnsafe(2);hdr[0]=0x81;hdr[1]=0x80|len;}
      else{hdr=Buffer.allocUnsafe(4);hdr[0]=0x81;hdr[1]=0x80|126;hdr.writeUInt16BE(len,2);}
      const m=Buffer.allocUnsafe(len); for(let i=0;i<len;i++)m[i]=pl[i]^mk[i%4];
      sock.write(Buffer.concat([hdr,mk,m]));
    }
    function proc() {while(buf.length>=2){const op=buf[0]&0xf;let len=buf[1]&0x7f,off=2;
      if(len===126){if(buf.length<4)break;len=buf.readUInt16BE(2);off=4;}
      else if(len===127){if(buf.length<10)break;len=Number(buf.readBigUInt64BE(2));off=10;}
      if(buf.length<off+len)break; if(op===0x8){sock.end();return;}
      if(op===0x9){const p=Buffer.concat([Buffer.from([0x8a,len]),buf.subarray(off,off+len)]);sock.write(p);buf=buf.subarray(off+len);continue;}
      const ps=buf.subarray(off,off+len).toString('utf8');buf=buf.subarray(off+len);
      try{const m=JSON.parse(ps);if(m.id){for(let i=h.length-1;i>=0;i--){if(h[i].pred(m)){h[i].resolve(m);h.splice(i,1);break;}}}}catch{}}}
    sock.on('connect',()=>sock.write(req));
    sock.on('data',(d)=>{if(!hs){hsD+=d.toString('utf8');if(hsD.includes('\r\n\r\n')){buf=Buffer.from(hsD.substring(hsD.indexOf('\r\n\r\n')+4),'binary');hs=true;if(buf.length>0)proc();resolve({send(method,params,sid){const id=++mid;sendFrame(JSON.stringify(sid?{id,method,params,sessionId:sid}:{id,method,params}));return new Promise((res,rej)=>{h.push({pred:m=>m.id===id,resolve:res,reject:rej});setTimeout(()=>{const i=h.findIndex(x=>x.resolve===res);if(i>=0){h.splice(i,1);rej(new Error('Timeout'))}},10000);});},close:()=>sock.end()});}return;}buf=Buffer.concat([buf,d]);proc();});
    sock.on('error',reject);
  });
}

async function cdpApply(path, value) {
  const ver = await new Promise((r,j)=>get(`http://localhost:${CDP_PORT}/json/version`,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>r(JSON.parse(d)));}).on('error',j));
  const browser = await wsConnect(ver.webSocketDebuggerUrl);
  const targets = await new Promise((r,j)=>get(`http://localhost:${CDP_PORT}/json/list`,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>r(JSON.parse(d)));}).on('error',j));
  const win = targets.find(t=>t.url?.includes('window.html'));
  if(!win) throw new Error('window.html not found');
  const ar = await browser.send('Target.attachToTarget',{targetId:win.id,flatten:true});
  const sid = ar.result.sessionId;
  await browser.send('Runtime.enable',{},sid);
  const valJson = JSON.stringify(value);
  // Correct signature: prefs.set({path, value})
  const result = await browser.send('Runtime.evaluate',{
    expression: `(async()=>{self.vivaldi.prefs.set({path:"${path}",value:${valJson}});return "ok"})()`,
    returnByValue: true, awaitPromise: true
  }, sid);
  browser.close();
  return true;
}

// ── Recursive key search ──

function searchKeys(obj, prefix, keyword, results) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
  for (const key of Object.keys(obj)) {
    const path = prefix ? prefix + '.' + key : key;
    if (path.toLowerCase().includes(keyword.toLowerCase())) {
      results.push({ path, value: obj[key] });
    }
    if (!Array.isArray(obj[key]) && typeof obj[key] === 'object' && obj[key] !== null) {
      searchKeys(obj[key], path, keyword, results);
    }
  }
}

// ── Known enum preferences (must be integers, need restart) ──
const ENUM_PREFS = {
  'vivaldi.tabs.bar.position': { 0:'top', 1:'left', 2:'right', 3:'bottom', 4:'none' },
  'vivaldi.panels.position': { 0:'left', 1:'right' },
  'vivaldi.status_bar.display': { 0:'shown', 1:'hidden', 2:'minimized' },
  'vivaldi.tabs.stacking.mode': { 0:'compact', 1:'accordion', 2:'two_level' },
  'vivaldi.menu.display': { 0:'horizontal', 1:'vertical' },
  'vivaldi.tabs.new_placement': { 0:'after_related', 1:'after_active', 2:'end' },
  'vivaldi.tabs.activation.on_close': { 0:'neighbor', 1:'related', 2:'last_active', 3:'order' },
  'vivaldi.tabs.double_click': { 0:'none', 1:'close', 2:'new_tab', 3:'reload', 4:'mute' },
  'vivaldi.startpage.speed_dial.size': { 0:'small', 1:'medium', 2:'large' },
  'vivaldi.startpage.background.color': { 0:'theme', 1:'custom' },
};

const NEEDS_RESTART = Object.keys(ENUM_PREFS);

function resolveEnumValue(path, value) {
  const map = ENUM_PREFS[path];
  if (!map) return null;
  // If value is a string, find the integer
  if (typeof value === 'string') {
    const entry = Object.entries(map).find(([k, v]) => v === value);
    return entry ? parseInt(entry[0]) : null;
  }
  // If value is an integer, verify it
  if (typeof value === 'number' && map[value]) return value;
  return null;
}

function displayEnumValue(path, value) {
  const map = ENUM_PREFS[path];
  if (!map) return String(value);
  return `${value} (${map[value] || 'unknown'})`;
}

async function cmdGet(path) {
  const prefs = readPrefs();
  const parts = path.split('.');
  let val = prefs;
  for (const p of parts) {
    if (val && typeof val === 'object') val = val[p];
    else { console.log(JSON.stringify({error:`path not found: ${path}`, missing: p})); return; }
  }
  const display = ENUM_PREFS[path] ? displayEnumValue(path, val) : val;
  console.log(JSON.stringify({ path, value: val, display }));
}

async function cmdSet(path, valueStr) {
  let value;
  try { value = JSON.parse(valueStr); } catch { value = valueStr; }

  // Check if this is an enum pref (for display + value resolution)
  const enumVal = resolveEnumValue(path, value);
  const finalValue = enumVal !== null ? enumVal : value;
  const oldDisplay = ENUM_PREFS[path] ? displayEnumValue(path, (readPrefsPath(path))) : null;

  // 1. Write to disk (persistence)
  const prefs = readPrefs();
  const parts = path.split('.');
  let obj = prefs;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!obj[parts[i]]) obj[parts[i]] = {};
    obj = obj[parts[i]];
  }
  const old = obj[parts[parts.length - 1]];
  obj[parts[parts.length - 1]] = finalValue;
  writePrefs(prefs);

  console.log(JSON.stringify({
    path,
    old: enumVal !== null ? displayEnumValue(path, old) : old,
    new: enumVal !== null ? displayEnumValue(path, finalValue) : finalValue,
    wrote: 'disk'
  }));

  // 2. Apply live via CDP (auto-starts Vivaldi if needed)
  if (ensureVivaldiCDP()) {
    try {
      await cdpApply(path, finalValue);
      console.error('[prefs] ✓ Live applied');
    } catch(e) {
      console.error(`[prefs] CDP live failed: ${e.message}`);
      console.error('[prefs] Disk write OK — restart Vivaldi to apply');
    }
  }
}

function readPrefsPath(path) {
  const prefs = readPrefs();
  const parts = path.split('.');
  let val = prefs;
  for (const p of parts) {
    if (val && typeof val === 'object') val = val[p];
    else return undefined;
  }
  return val;
}

async function cmdSearch(keyword) {
  const prefs = readPrefs();
  const results = [];
  searchKeys(prefs, '', keyword, results);
  results.forEach(r => {
    const display = typeof r.value === 'object' ? JSON.stringify(r.value).substring(0, 80) : String(r.value);
    console.log(`${r.path} = ${display}`);
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
      const display = typeof v === 'object' ? JSON.stringify(v).substring(0, 80) : String(v);
      console.log(`${fullKey}.${k} = ${display}`);
    }
    console.error(`\n[prefs] ${Object.keys(obj).length} keys in ${fullKey}`);
  } else {
    console.log(`${fullKey} = ${JSON.stringify(obj)}`);
  }
}

async function cmdSnapshot() {
  const categories = {
    'Tab Bar': ['vivaldi.tabs.bar.position', 'vivaldi.tabs.visible'],
    'Tab Behavior': ['vivaldi.tabs.open_new_in_background', 'vivaldi.tabs.cycle_by_recent_order'],
    'Address Bar': ['vivaldi.address_bar.visible', 'vivaldi.address_bar.show_full_url'],
    'Panels': ['vivaldi.panels.position', 'vivaldi.panels.as_overlay.enabled'],
    'Status Bar': ['vivaldi.status_bar.display'],
    'Bookmarks Bar': ['vivaldi.bookmarks.bar.visible'],
    'Appearance': ['vivaldi.appearance.density', 'vivaldi.appearance.disable_title_bar'],
    'Theme': ['vivaldi.theme.schedule.enabled', 'vivaldi.theme.prefer_system_accent'],
    'Gestures': ['vivaldi.mouse_gestures.enabled'],
    'Workspaces': ['vivaldi.workspaces.enabled'],
    'Auto-hide': ['vivaldi.auto_hide.enabled', 'vivaldi.auto_hide.tab_bar', 'vivaldi.auto_hide.address_bar']
  };
  const prefs = readPrefs();
  const snap = {};
  for (const [cat, paths] of Object.entries(categories)) {
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
  node prefs.mjs get <path>            Read preference
  node prefs.mjs set <path> <value>    Set preference (auto-applies live)
  node prefs.mjs search <keyword>      Search preferences
  node prefs.mjs list <category>       List all keys in category
  node prefs.mjs snapshot              Full overview

Read (instant, no Vivaldi needed):
  node prefs.mjs get vivaldi.tabs.bar.position

Write (disk + live CDP):
  node prefs.mjs set vivaldi.tabs.bar.position '"left"'
  node prefs.mjs set vivaldi.auto_hide.tab_bar false
  node prefs.mjs set vivaldi.mouse_gestures.enabled true

Search (find paths by keyword):
  node prefs.mjs search break
  node prefs.mjs search auto_hide

List:
  node prefs.mjs list tabs
  node prefs.mjs list address_bar
`);
      process.exit(1);
  }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
