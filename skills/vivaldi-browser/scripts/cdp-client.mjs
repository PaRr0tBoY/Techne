#!/usr/bin/env node
/**
 * Vivaldi CDP Client — connects to Vivaldi's window.html via Chrome DevTools Protocol.
 *
 * Modes:
 *   Evaluate:  node cdp-client.mjs -e '<JS code>'
 *   Console:   node cdp-client.mjs --console [-d <seconds>] [-f <filter>]
 *
 * Prerequisite: Vivaldi must be started with --remote-debugging-port=9222
 */

import net from 'node:net';
import crypto from 'node:crypto';
import http from 'node:http';
import fs from 'node:fs';

// ═══════════════════════════════════════════════════════════════
// WebSocket client (RFC 6455)
// ═══════════════════════════════════════════════════════════════

function wsConnect(urlStr) {
  const url = new URL(urlStr);
  const host = url.hostname;
  const port = parseInt(url.port) || 9222;
  const path = url.pathname + url.search;

  return new Promise((resolve, reject) => {
    const wkey = crypto.randomBytes(16).toString('base64');
    const req = [
      `GET ${path} HTTP/1.1`, `Host: ${host}:${port}`,
      'Upgrade: websocket', 'Connection: Upgrade',
      `Sec-WebSocket-Key: ${wkey}`, 'Sec-WebSocket-Version: 13',
      '', ''
    ].join('\r\n');

    const socket = net.createConnection({ host, port });
    let hsDone = false, hsData = '';
    let buf = Buffer.alloc(0);
    const handlers = [];
    const eventHandlers = [];
    let msgId = 0;

    function sendFrame(jsonStr) {
      const payload = Buffer.from(jsonStr, 'utf8');
      const maskKey = crypto.randomBytes(4);
      const len = payload.length;
      let header;
      if (len < 126) {
        header = Buffer.allocUnsafe(2);
        header[0] = 0x81; header[1] = 0x80 | len;
      } else if (len < 65536) {
        header = Buffer.allocUnsafe(4);
        header[0] = 0x81; header[1] = 0x80 | 126;
        header.writeUInt16BE(len, 2);
      } else {
        header = Buffer.allocUnsafe(10);
        header[0] = 0x81; header[1] = 0x80 | 127;
        header.writeBigUInt64BE(BigInt(len), 2);
      }
      const masked = Buffer.allocUnsafe(len);
      for (let i = 0; i < len; i++) masked[i] = payload[i] ^ maskKey[i % 4];
      socket.write(Buffer.concat([header, maskKey, masked]));
    }

    function processBuf() {
      while (buf.length >= 2) {
        const op = buf[0] & 0x0f;
        let len = buf[1] & 0x7f;
        let off = 2;
        if (len === 126) { if (buf.length < 4) break; len = buf.readUInt16BE(2); off = 4; }
        else if (len === 127) { if (buf.length < 10) break; len = Number(buf.readBigUInt64BE(2)); off = 10; }
        if (buf.length < off + len) break;
        if (op === 0x8) { socket.end(); return; }
        if (op === 0x9) {
          const pong = Buffer.concat([Buffer.from([0x8a, len]), buf.subarray(off, off + len)]);
          socket.write(pong); buf = buf.subarray(off + len); continue;
        }
        const payloadStr = buf.subarray(off, off + len).toString('utf8');
        buf = buf.subarray(off + len);
        try {
          const msg = JSON.parse(payloadStr);
          // Response to a command
          if (msg.id) {
            for (let i = handlers.length - 1; i >= 0; i--) {
              if (handlers[i].pred(msg)) { handlers[i].resolve(msg); handlers.splice(i, 1); break; }
            }
          }
          // Server-pushed event
          if (msg.method) {
            for (const eh of eventHandlers) { try { eh(msg); } catch {} }
          }
        } catch { /* ignore */ }
      }
    }

    socket.on('connect', () => socket.write(req));
    socket.on('data', (d) => {
      if (!hsDone) {
        hsData += d.toString('utf8');
        if (hsData.includes('\r\n\r\n')) {
          const idx = hsData.indexOf('\r\n\r\n') + 4;
          buf = Buffer.from(hsData.substring(idx), 'binary');
          hsDone = true;
          if (buf.length > 0) processBuf();
          resolve(sender);
        }
        return;
      }
      buf = Buffer.concat([buf, d]);
      processBuf();
    });
    socket.on('error', reject);

    const sender = {
      send(method, params = {}, sessionId) {
        const id = ++msgId;
        sendFrame(JSON.stringify(sessionId ? { id, method, params, sessionId } : { id, method, params }));
        return new Promise((res, rej) => {
          handlers.push({ pred: (m) => m.id === id, resolve: res, reject: rej });
          setTimeout(() => {
            const i = handlers.findIndex(h => h.resolve === res);
            if (i >= 0) { handlers.splice(i, 1); rej(new Error(`Timeout: ${method}`)); }
          }, 20000);
        });
      },
      /** Register a listener for server-pushed events (no id field) */
      onEvent(fn) { eventHandlers.push(fn); },
      close: () => socket.end()
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// Connection helper
// ═══════════════════════════════════════════════════════════════

async function connectToVivaldi(port = 9222) {
  const ver = await httpGet(`http://localhost:${port}/json/version`);
  const browser = await wsConnect(ver.webSocketDebuggerUrl);
  const targets = await httpGet(`http://localhost:${port}/json/list`);
  const win = targets.find(t => t.url && t.url.includes('window.html'));
  if (!win) throw new Error('window.html target not found');
  const attachResult = await browser.send('Target.attachToTarget', { targetId: win.id, flatten: true });
  const sid = attachResult.result?.sessionId;
  if (!sid) throw new Error('Failed to attach: ' + JSON.stringify(attachResult));
  return { browser, sessionId: sid };
}

function httpGet(urlStr) {
  return new Promise((res, rej) => {
    http.get(urlStr, (resp) => {
      let d = '';
      resp.on('data', c => d += c);
      resp.on('end', () => { try { res(JSON.parse(d)); } catch { res(d); } });
    }).on('error', rej);
  });
}

// ═══════════════════════════════════════════════════════════════
// Evaluate mode
// ═══════════════════════════════════════════════════════════════

async function evaluateMode(jsCode, port) {
  const { browser, sessionId: sid } = await connectToVivaldi(port);
  try {
    await browser.send('Runtime.enable', {}, sid);
    const result = await browser.send('Runtime.evaluate', {
      expression: jsCode, returnByValue: true, awaitPromise: true
    }, sid);
    if (result.result?.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(result.result.exceptionDetails)}`);
    }
    return result.result?.result?.value;
  } finally {
    browser.close();
  }
}

// ═══════════════════════════════════════════════════════════════
// Console mode — capture all console output + exceptions
// ═══════════════════════════════════════════════════════════════

const LEVEL_MAP = {
  log: 'LOG', info: 'INFO', warning: 'WARN', error: 'ERROR',
  debug: 'DEBUG', trace: 'TRACE', dir: 'DIR', assert: 'ASSERT',
  table: 'TABLE', count: 'COUNT', timeEnd: 'TIME', group: 'GROUP',
  startGroup: 'GROUP', startGroupCollapsed: 'GROUP'
};

const LEVEL_COLORS = {
  LOG: '\x1b[37m', INFO: '\x1b[36m', WARN: '\x1b[33m', ERROR: '\x1b[31m',
  DEBUG: '\x1b[35m', TRACE: '\x1b[90m', EXCEPTION: '\x1b[41m\x1b[37m',
  RESULT: '\x1b[32m', DIR: '\x1b[37m', TABLE: '\x1b[37m'
};
const RESET = '\x1b[0m';
const TIMESTAMP = () => new Date().toISOString().split('T')[1].split('.')[0];

function formatArg(arg) {
  if (arg.type === 'string') return arg.value;
  if (arg.type === 'undefined') return 'undefined';
  if (arg.type === 'null') return 'null';
  if (arg.value !== undefined) return JSON.stringify(arg.value);
  if (arg.description) return arg.description;
  if (arg.objectId) return `<${arg.className || arg.subtype || 'object'} #${arg.objectId}>`;
  return JSON.stringify(arg);
}

async function consoleMode(durationSec, filter, port) {
  const { browser, sessionId: sid } = await connectToVivaldi(port);

  let eventCount = 0;

  // Listen for all console events and exceptions
  browser.onEvent(msg => {
    if (msg.sessionId !== sid) return;

    // console.log / warn / error / info / debug / trace / dir / table / assert ...
    if (msg.method === 'Runtime.consoleAPICalled') {
      const p = msg.params;
      const level = LEVEL_MAP[p.type] || p.type.toUpperCase();
      const text = (p.args || []).map(formatArg).join(' ');

      if (filter && !text.includes(filter)) return;
      eventCount++;

      const color = LEVEL_COLORS[level] || '';
      process.stdout.write(`${color}[${TIMESTAMP()} ${level}]${RESET} ${text}\n`);
    }

    // Uncaught exceptions
    if (msg.method === 'Runtime.exceptionThrown') {
      const ed = msg.params.exceptionDetails;
      const text = ed.exception?.description || ed.text || JSON.stringify(ed.exception);
      const url = ed.url ? ` (${ed.url}:${ed.lineNumber}:${ed.columnNumber})` : '';
      if (filter && !text.includes(filter) && !url.includes(filter)) return;
      eventCount++;

      const color = LEVEL_COLORS.EXCEPTION;
      process.stdout.write(`${color}[${TIMESTAMP()} EXCEPTION]${RESET} ${text}${url}\n`);
      if (ed.stackTrace) {
        const frames = ed.stackTrace.callFrames || [];
        frames.forEach(f => {
          process.stdout.write(`  at ${f.functionName || '<anonymous>'} (${f.url}:${f.lineNumber}:${f.columnNumber})\n`);
        });
      }
    }
  });

  // Enable Runtime to receive console events
  await browser.send('Runtime.enable', {}, sid);

  process.stderr.write(`[vivaldi-cdp] Listening for console output (${durationSec}s, filter: ${filter || 'none'})...\n`);
  process.stderr.write(`[vivaldi-cdp] Capturing: console.log/warn/error/info/debug/trace/dir/table + exceptions\n\n`);

  // If duration specified, auto-stop after that time
  if (durationSec > 0) {
    await new Promise(r => setTimeout(r, durationSec * 1000));
    browser.close();
    process.stderr.write(`\n[vivaldi-cdp] Stopped. ${eventCount} events captured.\n`);
  } else {
    // Run indefinitely until stdin closes or SIGINT
    process.on('SIGINT', () => { browser.close(); process.exit(0); });
    process.stdin.on('end', () => { browser.close(); process.exit(0); });
    // Keep alive
    await new Promise(() => {}); // never resolves
  }
}

// ═══════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════

function printUsage() {
  console.error(`Vivaldi CDP Client

  Evaluate mode:
    node cdp-client.mjs -e '<JS code>'
    node cdp-client.mjs -f <file.js>
    echo '<JS code>' | node cdp-client.mjs

  Console mode (capture all console output + exceptions):
    node cdp-client.mjs --console [-d <seconds>] [-f <filter>]

  Examples:
    # Run a query
    node cdp-client.mjs -e 'return (await chrome.tabs.query({})).length'

    # Capture all console for 10 seconds
    node cdp-client.mjs --console -d 10

    # Capture only TidyTabs logs
    node cdp-client.mjs --console -d 5 -f TidyTabs

    # Stream console until Ctrl+C
    node cdp-client.mjs --console
`);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);

  // Console mode
  if (args.includes('--console') || args.includes('-c')) {
    const dIdx = args.indexOf('-d');
    const fIdx = args.indexOf('-f');
    const duration = dIdx >= 0 ? parseFloat(args[dIdx + 1]) || 0 : 0;
    const filter = fIdx >= 0 ? args[fIdx + 1] : null;
    const port = parseInt(process.env.VIVALDI_CDP_PORT || '9222');
    return await consoleMode(duration, filter, port);
  }

  // Evaluate mode
  let jsCode = '';
  if (args.length === 0) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    jsCode = Buffer.concat(chunks).toString('utf8').trim();
  } else if (args[0] === '-e' && args[1]) {
    jsCode = args[1];
  } else if (args[0] === '-f' && args[1]) {
    jsCode = fs.readFileSync(args[1], 'utf8');
  } else if (args[0] === '-h' || args[0] === '--help') {
    printUsage();
  } else {
    jsCode = args.join(' ');
  }

  if (!jsCode) printUsage();

  // Auto-wrap
  if (!jsCode.includes('__out(')) {
    jsCode = `(async () => {
      try {
        const result = await (async () => { ${jsCode} })();
        return JSON.stringify(result, null, 2);
      } catch(e) {
        return JSON.stringify({error: e.message || String(e)});
      }
    })()`;
  } else {
    jsCode = `(async () => { ${jsCode} })()`;
  }

  const port = parseInt(process.env.VIVALDI_CDP_PORT || '9222');

  try {
    const result = await evaluateMode(jsCode, port);
    if (typeof result === 'string') {
      console.log(result);
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}

main();
