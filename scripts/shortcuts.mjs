#!/usr/bin/env node
/**
 * Vivaldi Keyboard Shortcuts — get/set/list command shortcuts.
 *
 * Usage:
 *   node shortcuts.mjs get <command>          Get shortcut for a command
 *   node shortcuts.mjs set <command> <key>    Set shortcut (closes Vivaldi if needed)
 *   node shortcuts.mjs list [filter]          List all commands and shortcuts
 *   node shortcuts.mjs search <keyword>       Search commands by keyword
 *
 * Command format: COMMAND_BREAKMODE_TOGGLE, COMMAND_NEW_TAB, etc.
 * Key format: alt+,, ctrl+shift+t, etc.
 *
 * Examples:
 *   node shortcuts.mjs get COMMAND_BREAKMODE_TOGGLE
 *   node shortcuts.mjs set COMMAND_BREAKMODE_TOGGLE alt+,
 *   node shortcuts.mjs search BREAK
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';

const PREF_PATH = 'C:/Users/Acid/AppData/Local/Vivaldi/User Data/Default/Preferences';
const VIVALDI_EXE = 'D:/Package/软件/Application/vivaldi.exe';

// ── Helpers ──

function readPrefs() {
  if (!existsSync(PREF_PATH)) throw new Error(`Preferences not found: ${PREF_PATH}`);
  return JSON.parse(readFileSync(PREF_PATH, 'utf8'));
}

function writePrefs(prefs) {
  writeFileSync(PREF_PATH, JSON.stringify(prefs, null, 2), 'utf8');
}

function getActions() {
  const prefs = readPrefs();
  return prefs.vivaldi.actions['0'];
}

function vivaldiRunning() {
  try { execSync('tasklist /fi "imagename eq vivaldi.exe" 2>nul | find /i "vivaldi"', { stdio: 'pipe' }); return true; }
  catch { return false; }
}

function killVivaldi() {
  try { execSync('taskkill /f /im vivaldi.exe 2>nul', { stdio: 'pipe' }); }
  catch {}
  // Wait for process to actually die
  for (let i = 0; i < 10; i++) {
    if (!vivaldiRunning()) return true;
    const start = Date.now(); while (Date.now() - start < 1000) {} // sleep 1s
  }
  return !vivaldiRunning();
}

function startVivaldi() {
  spawnSync('powershell', ['-Command', `Start-Process '${VIVALDI_EXE}' -ArgumentList '--remote-debugging-port=9222'`], { stdio: 'pipe', shell: true });
}

// ── Commands ──

function cmdGet(command) {
  const actions = getActions();
  const entry = actions[command];
  if (!entry) {
    console.log(JSON.stringify({ error: `Command not found: ${command}` }));
    return;
  }
  console.log(JSON.stringify({ command, shortcuts: entry.shortcuts || [] }));
}

function cmdSet(command, shortcut) {
  const wasRunning = vivaldiRunning();

  if (wasRunning) {
    console.error(`Vivaldi is running — closing to safely modify shortcuts...`);
    const killed = killVivaldi();
    if (!killed) { console.error('Failed to close Vivaldi'); process.exit(1); }
    console.error('Vivaldi closed.');
  }

  // Read fresh after closing
  const prefs = readPrefs();
  const actions = prefs.vivaldi.actions['0'];

  const old = actions[command];
  if (!old) {
    console.log(JSON.stringify({ error: `Command not found: ${command}` }));
    if (wasRunning) startVivaldi();
    return;
  }

  const oldShortcut = old.shortcuts?.[0] || '(none)';
  actions[command].shortcuts = [shortcut];
  writePrefs(prefs);

  // Verify
  const verify = readPrefs();
  const verified = verify.vivaldi.actions['0'][command].shortcuts?.[0];

  console.log(JSON.stringify({
    command,
    old: oldShortcut,
    new: verified,
    verified: verified === shortcut
  }));

  if (wasRunning) {
    console.error('Restarting Vivaldi...');
    startVivaldi();
    console.error('Vivaldi restarted — press Alt+, to test Break Mode.');
  } else {
    console.error('Vivaldi is not running. Start it to test the new shortcut.');
  }
}

function cmdList(filter) {
  const actions = getActions();
  const entries = Object.entries(actions)
    .filter(([k]) => !filter || k.toLowerCase().includes(filter.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b));

  for (const [cmd, config] of entries) {
    const sc = config.shortcuts?.join(', ') || '(none)';
    console.log(`${cmd}  →  ${sc}`);
  }
  console.error(`\n[shortcuts] ${entries.length} commands${filter ? ` matching "${filter}"` : ''}`);
}

function cmdSearch(keyword) {
  const actions = getActions();
  const matches = Object.entries(actions)
    .filter(([k]) => k.toLowerCase().includes(keyword.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b));

  if (matches.length === 0) {
    console.error(`No commands matching "${keyword}"`);
    return;
  }
  for (const [cmd, config] of matches) {
    const sc = config.shortcuts?.join(', ') || '(none)';
    console.log(`${cmd}  →  ${sc}`);
  }
  console.error(`\n[shortcuts] ${matches.length} matches for "${keyword}"`);
}

// ── CLI ──

const [,, cmd, ...args] = process.argv;

function main() {
  switch (cmd) {
    case 'get':
      if (!args[0]) { console.error('Usage: shortcuts.mjs get <COMMAND>'); process.exit(1); }
      cmdGet(args[0]);
      break;
    case 'set':
      if (!args[0] || !args[1]) { console.error('Usage: shortcuts.mjs set <COMMAND> <shortcut>'); process.exit(1); }
      cmdSet(args[0], args[1]);
      break;
    case 'list':
      cmdList(args[0] || null);
      break;
    case 'search':
      if (!args[0]) { console.error('Usage: shortcuts.mjs search <keyword>'); process.exit(1); }
      cmdSearch(args[0]);
      break;
    default:
      console.error(`Vivaldi Shortcuts Manager

Usage:
  node shortcuts.mjs get <COMMAND>           Get shortcut
  node shortcuts.mjs set <COMMAND> <key>     Set shortcut (auto-handles Vivaldi restart)
  node shortcuts.mjs list [filter]           List all shortcuts
  node shortcuts.mjs search <keyword>        Search commands

Examples:
  node shortcuts.mjs get COMMAND_BREAKMODE_TOGGLE
  node shortcuts.mjs set COMMAND_BREAKMODE_TOGGLE alt+,
  node shortcuts.mjs search TILING
`);
      process.exit(1);
  }
}

main();
