---
name: vivaldi-browser
description: >
  Read/write Vivaldi browser settings and data — change preferences (600+ paths), configure
  keyboard shortcuts, query tabs/bookmarks/history/downloads, capture live console output.
  Use when the user wants to change a Vivaldi setting, remap a shortcut, check browser state,
  or debug mod console output. Requires Vivaldi.
---

# Vivaldi Browser Control Skill

Three parameterized scripts. No manual JS coding needed.

## Scripts

| Script | Purpose | Vivaldi needed | Notes |
|--------|---------|---------------|-------|
| `scripts/prefs.mjs` | Read/write/search preferences | **Auto-started** for live apply | Disk write always works; auto-launches Vivaldi for instant effect |
| `scripts/shortcuts.mjs` | Get/set/list keyboard shortcuts | **Auto-restarted** after change | Kills Vivaldi → modifies → restarts |
| `scripts/data.mjs` | Query tabs/bookmarks/history/downloads | **Auto-started** if not running | Launches Vivaldi with debug port automatically |
| `scripts/cdp-client.mjs --console` | Capture live console output | **Auto-started** if not running | Same auto-launch as data.mjs |

**No manual `--remote-debugging-port` needed.** Scripts auto-launch Vivaldi with the flag automatically. Just close Vivaldi normally and run any script — it handles the rest.

## Preference Operations (`prefs.mjs`)

```bash
# Read a preference (instant, from disk)
node .claude/skills/vivaldi-browser/scripts/prefs.mjs get vivaldi.tabs.bar.position

# Set a preference (live, via Vivaldi's own API)
node .claude/skills/vivaldi-browser/scripts/prefs.mjs set vivaldi.tabs.bar.position '"left"'

# ⭐ BEFORE setting an enum pref, ALWAYS probe valid values first:
node .claude/skills/vivaldi-browser/scripts/prefs.mjs probe vivaldi.tabs.stacking.mode

# Search for preferences by keyword
node .claude/skills/vivaldi-browser/scripts/prefs.mjs search break

# List all preferences in a category
node .claude/skills/vivaldi-browser/scripts/prefs.mjs list tabs

# Full overview
node .claude/skills/vivaldi-browser/scripts/prefs.mjs snapshot
```

### `probe` — auto-discover valid values

When setting an enum preference (position, mode, display, etc.), **always run `probe` first** to get the actual valid values for this Vivaldi version. Do NOT guess from hardcoded docs — Vivaldi changes enum names between versions.

```bash
node .claude/skills/vivaldi-browser/scripts/prefs.mjs probe vivaldi.tabs.stacking.mode
# → valid: ["substrip","off","accordion","dotted"], current: "substrip", default: "substrip"

node .claude/skills/vivaldi-browser/scripts/prefs.mjs probe vivaldi.tabs.bar.position
# → valid: ["top","bottom","left","right"], current: "right", default: "top"
```

The probe command:
1. Reads the current value and default from Vivaldi
2. Tests candidate values (generated from path keywords like "mode", "position", "display")
3. Returns only values that Vivaldi actually accepts
4. Restores the original value (no side effects)

### Common preference paths

| Path | Category |
|------|----------|
| `vivaldi.tabs.bar.position` | Tab bar position |
| `vivaldi.tabs.visible` | Show tab bar |
| `vivaldi.tabs.stacking.mode` | Stack style |
| `vivaldi.tabs.stacking.allow_dnd` | Drag to stack |
| `vivaldi.tabs.open_new_in_background` | Background tabs |
| `vivaldi.tabs.cycle_by_recent_order` | Tab cycling |
| `vivaldi.tabs.activation.on_close` | Activate after close |
| `vivaldi.address_bar.visible` | Show address bar |
| `vivaldi.address_bar.show_full_url` | Full URL |
| `vivaldi.panels.position` | Panel side |
| `vivaldi.panels.as_overlay.enabled` | Floating panels |
| `vivaldi.status_bar.display` | Status bar |
| `vivaldi.bookmarks.bar.visible` | Bookmarks bar |
| `vivaldi.appearance.density` | UI density |
| `vivaldi.theme.schedule.enabled` | Theme schedule |
| `vivaldi.theme.prefer_system_accent` | System accent |
| `vivaldi.mouse_gestures.enabled` | Mouse gestures |
| `vivaldi.workspaces.enabled` | Workspaces |
| `vivaldi.auto_hide.enabled` | Auto-hide UI |
| `vivaldi.auto_hide.tab_bar` | Auto-hide tab bar |
| `vivaldi.webpages.smooth_scrolling.enabled` | Smooth scroll |
| `vivaldi.downloads.open_panel_on_new` | Download panel |
| `vivaldi.keyboard.shortcuts.enable` | Keyboard shortcuts |

For any path not listed: `prefs.mjs search <keyword>` or `prefs.mjs list <category>`.

## Shortcut Operations (`shortcuts.mjs`)

Operates on `vivaldi.actions` in Preferences. **Vivaldi must be closed** when modifying — the script auto-handles closing and restarting.

```bash
# Get current shortcut for a command
node .claude/skills/vivaldi-browser/scripts/shortcuts.mjs get COMMAND_BREAKMODE_TOGGLE

# Set shortcut (closes Vivaldi, modifies, restarts)
node .claude/skills/vivaldi-browser/scripts/shortcuts.mjs set COMMAND_BREAKMODE_TOGGLE alt+,

# Search commands by keyword
node .claude/skills/vivaldi-browser/scripts/shortcuts.mjs search BREAK

# List all shortcuts (optional filter)
node .claude/skills/vivaldi-browser/scripts/shortcuts.mjs list
node .claude/skills/vivaldi-browser/scripts/shortcuts.mjs list TILING
```

**Key format**: `ctrl+t`, `alt+,`, `ctrl+shift+n`, `ctrl+shift+tab`. Combine with `+`.

## Data Operations (`data.mjs`)

Requires Vivaldi running with `--remote-debugging-port=9222`.

```bash
# Tabs
node .claude/skills/vivaldi-browser/scripts/data.mjs tabs

# Bookmarks
node .claude/skills/vivaldi-browser/scripts/data.mjs bookmarks
node .claude/skills/vivaldi-browser/scripts/data.mjs bookmarks github

# History
node .claude/skills/vivaldi-browser/scripts/data.mjs history today
node .claude/skills/vivaldi-browser/scripts/data.mjs history yesterday
node .claude/skills/vivaldi-browser/scripts/data.mjs history week
node .claude/skills/vivaldi-browser/scripts/data.mjs history-search "keyword"

# Downloads
node .claude/skills/vivaldi-browser/scripts/data.mjs downloads

# Full snapshot
node .claude/skills/vivaldi-browser/scripts/data.mjs snapshot
```

## Console Monitoring

```bash
# Capture all console for 10s
node .claude/skills/vivaldi-browser/scripts/cdp-client.mjs --console -d 10

# Filter by keyword
node .claude/skills/vivaldi-browser/scripts/cdp-client.mjs --console -d 5 -f ERROR
```

Captures: `log`, `warn`, `error`, `info`, `debug`, `trace`, `dir` + uncaught exceptions with stack traces.

## How Changes Apply

**`prefs.mjs set` applies changes immediately:**
1. Writes to disk (always succeeds)
2. Auto-starts Vivaldi with debug port if not running
3. Pushes the value live via CDP → instant effect in the running browser
4. Both disk + live: change survives restart AND is visible now

**`shortcuts.mjs set` requires Vivaldi restart** (auto-handled):
1. Kills Vivaldi if running → modifies disk → restarts Vivaldi

**`data.mjs` and `console`** auto-start Vivaldi if needed.

## How Changes Apply

**`prefs.mjs set`**: calls `self.vivaldi.prefs.set({path, value})` via CDP — the exact same API Vivaldi's own settings page uses. Changes are instant and persist across restarts.

**`shortcuts.mjs set`**: requires Vivaldi restart (auto-handled by the script).

**`data.mjs` and `console`**: auto-start Vivaldi with debug port if not running.

## Workflow when changing a setting

1. **If the preference is an enum** (position, mode, display, etc.): run `probe` first to get valid values
2. **Read current value**: `prefs.mjs get <path>`
3. **Set**: `prefs.mjs set <path> '"value"'`
4. **If set fails** (value reverted): run `probe <path>` to discover actual valid options

## ⚠️ Safety Rules

1. **Read before write** — always `get` first to show current value
2. **Know the value type** — booleans need `true`/`false`, strings need `'"quoted"'`, numbers are bare
3. **Layout changes need restart** — changing `tabs.bar.position`, `panels.position`, `status_bar.display` may need Vivaldi restart
4. **Shortcuts need Vivaldi closed** — `shortcuts.mjs set` auto-handles this
