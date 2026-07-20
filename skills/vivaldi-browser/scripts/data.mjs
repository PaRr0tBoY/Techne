#!/usr/bin/env node
/**
 * Vivaldi Browser Data — query tabs, bookmarks, history, downloads, etc.
 *
 * Usage:
 *   node data.mjs tabs
 *   node data.mjs bookmarks [search]
 *   node data.mjs history [today|yesterday|week]
 *   node data.mjs history-search <keyword>
 *   node data.mjs downloads
 *   node data.mjs snapshot
 *
 * Requires Vivaldi running with --remote-debugging-port=9222
 */

import { randomBytes } from 'node:crypto';
import { createConnection } from 'node:net';
import { get } from 'node:http';
import { execSync, spawnSync } from 'node:child_process';

const CDP_PORT = parseInt(process.env.VIVALDI_CDP_PORT || '9222');
const VIVALDI_EXE = 'D:/Package/软件/Application/vivaldi.exe';

function ensureVivaldiCDP() {
  // Check if running
  try { execSync('tasklist /fi "imagename eq vivaldi.exe" 2>nul | find /i "vivaldi"', { stdio: 'pipe' }); }
  catch {
    console.error('[data] Vivaldi not running — starting with debug port...');
    spawnSync('powershell', ['-Command', `Start-Process '${VIVALDI_EXE}' -ArgumentList '--remote-debugging-port=${CDP_PORT}'`], { stdio: 'pipe', shell: true });
    for (let i = 0; i < 15; i++) {
      const start = Date.now(); while (Date.now() - start < 1000) {} // sleep 1s
      try {
        execSync(`node -e "require('http').get('http://localhost:${CDP_PORT}/json/version',r=>{r.resume();process.exit(0)}).on('error',()=>process.exit(1))"`, { stdio: 'pipe', timeout: 2000 });
        console.error('[data] Vivaldi CDP ready');
        return true;
      } catch {}
    }
    throw new Error('Vivaldi CDP startup timeout');
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
    sock.on('data',(d)=>{if(!hs){hsD+=d.toString('utf8');if(hsD.includes('\r\n\r\n')){buf=Buffer.from(hsD.substring(hsD.indexOf('\r\n\r\n')+4),'binary');hs=true;if(buf.length>0)proc();resolve({send(method,params,sid){const id=++mid;sendFrame(JSON.stringify(sid?{id,method,params,sessionId:sid}:{id,method,params}));return new Promise((res,rej)=>{h.push({pred:m=>m.id===id,resolve:res,reject:rej});setTimeout(()=>{const i=h.findIndex(x=>x.resolve===res);if(i>=0){h.splice(i,1);rej(new Error('Timeout'))}},15000);});},close:()=>sock.end()});}return;}buf=Buffer.concat([buf,d]);proc();});
    sock.on('error',reject);
  });
}

async function evalInVivaldi(code) {
  const wrapped = `(async () => { try { ${code} } catch(e) { return JSON.stringify({error: e.message || String(e)}); } })()`;
  const ver = await new Promise((r,j)=>get(`http://localhost:${CDP_PORT}/json/version`,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>r(JSON.parse(d)));}).on('error',j));
  const browser = await wsConnect(ver.webSocketDebuggerUrl);
  const targets = await new Promise((r,j)=>get(`http://localhost:${CDP_PORT}/json/list`,res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>r(JSON.parse(d)));}).on('error',j));
  const win = targets.find(t=>t.url?.includes('window.html'));
  if(!win) throw new Error('window.html not found');
  const ar = await browser.send('Target.attachToTarget',{targetId:win.id,flatten:true});
  const sid = ar.result.sessionId;
  await browser.send('Runtime.enable',{},sid);
  const result = await browser.send('Runtime.evaluate',{expression:wrapped,returnByValue:true,awaitPromise:true},sid);
  browser.close();
  if(result.result?.exceptionDetails) throw new Error(JSON.stringify(result.result.exceptionDetails));
  return result.result?.result?.value;
}

// ── Queries ──

async function queryTabs() {
  return evalInVivaldi(`const tabs=await chrome.tabs.query({}); return tabs.map(t=>({id:t.id,title:t.title,url:t.url,active:t.active,pinned:t.pinned,index:t.index,status:t.status}))`);
}

async function queryBookmarks(search) {
  if (search) {
    return evalInVivaldi(`const results=await chrome.bookmarks.search("${search.replace(/"/g,'\\"')}"); return results.map(b=>({id:b.id,title:b.title,url:b.url}))`);
  }
  return evalInVivaldi(`const tree=await chrome.bookmarks.getTree();function flatten(n){let r=[];for(const x of n){if(x.url)r.push({title:x.title,url:x.url,id:x.id});if(x.children)r=r.concat(flatten(x.children));}return r;}return flatten(tree);`);
}

async function queryHistory(range) {
  const ranges = { today: 24, yesterday: 48, week: 168 };
  const hours = ranges[range] || 24;
  const startH = range === 'yesterday' ? 48 : hours;
  const endH = range === 'yesterday' ? 24 : 0;
  const start = Date.now() - startH * 3600000;
  const end = Date.now() - endH * 3600000;

  return evalInVivaldi(`const results=await new Promise(r=>chrome.history.search({text:'',startTime:${start},endTime:${end},maxResults:500},results=>{r(results.map(h=>({title:h.title,url:h.url,count:h.visitCount,time:new Date(h.lastVisitTime).toISOString()})))})); return results;`);
}

async function queryHistorySearch(keyword) {
  return evalInVivaldi(`const results=await new Promise(r=>chrome.history.search({text:"${keyword.replace(/"/g,'\\"')}",startTime:Date.now()-7*86400000,maxResults:100},results=>{r(results.map(h=>({title:h.title,url:h.url,count:h.visitCount,time:new Date(h.lastVisitTime).toISOString()})))})); return results;`);
}

async function queryDownloads() {
  return evalInVivaldi(`const results=await new Promise(r=>chrome.downloads.search({limit:50,orderBy:['-startTime']},results=>{r(results.map(d=>({id:d.id,filename:d.filename,state:d.state,fileSize:d.fileSize,startTime:new Date(d.startTime).toISOString()})))})); return results;`);
}

async function querySnapshot() {
  return evalInVivaldi(`const[t,b,h]=await Promise.all([
    chrome.tabs.query({}),
    chrome.bookmarks.getTree().then(tree=>{let t=0;function c(n){for(const x of n){if(x.url)t++;if(x.children)c(x.children);}}c(tree);return t;}),
    new Promise(r=>chrome.history.search({text:'',startTime:Date.now()-86400000,maxResults:1},res=>r(res.length))),
    new Promise(r=>chrome.downloads.search({limit:1,orderBy:['-startTime']},res=>r(res.length)))
  ]);
  return {tabs:{total:t.length,active:t.filter(x=>x.active).length,pinned:t.filter(x=>x.pinned).length},bookmarks:b,recentHistory24h:h.length};`);
}

// ── CLI ──

const [,, cmd, ...args] = process.argv;

async function main() {
  ensureVivaldiCDP();
  switch (cmd) {
    case 'tabs':
      console.log(JSON.stringify(await queryTabs(), null, 2));
      break;
    case 'bookmarks':
      console.log(JSON.stringify(await queryBookmarks(args[0] || null), null, 2));
      break;
    case 'history':
      console.log(JSON.stringify(await queryHistory(args[0] || 'today'), null, 2));
      break;
    case 'history-search':
      if (!args[0]) { console.error('Usage: data.mjs history-search <keyword>'); process.exit(1); }
      console.log(JSON.stringify(await queryHistorySearch(args[0]), null, 2));
      break;
    case 'downloads':
      console.log(JSON.stringify(await queryDownloads(), null, 2));
      break;
    case 'snapshot':
      console.log(JSON.stringify(await querySnapshot(), null, 2));
      break;
    default:
      console.error(`Vivaldi Data Query

Usage:
  node data.mjs tabs                     List all tabs
  node data.mjs bookmarks [search]       List bookmarks (optional search)
  node data.mjs history [today|yesterday|week]  Browsing history
  node data.mjs history-search <keyword> Search history
  node data.mjs downloads                Recent downloads
  node data.mjs snapshot                 Full browser overview

Requires Vivaldi running with --remote-debugging-port=9222
`);
      process.exit(1);
  }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
