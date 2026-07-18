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

All pref paths follow `vivaldi.<category>.<subcategory>.<key>`. Operates on the Preferences file directly — instantaneous, no CDP needed.

```bash
# Read a preference
node .claude/skills/vivaldi-browser/scripts/prefs.mjs get vivaldi.tabs.bar.position

# Set a preference (value must be valid JSON or plain string)
node .claude/skills/vivaldi-browser/scripts/prefs.mjs set vivaldi.tabs.visible false
node .claude/skills/vivaldi-browser/scripts/prefs.mjs set vivaldi.tabs.bar.position '"left"'
node .claude/skills/vivaldi-browser/scripts/prefs.mjs set vivaldi.panels.position '"right"'

# Search for preferences by keyword
node .claude/skills/vivaldi-browser/scripts/prefs.mjs search break

# List all preferences in a category
node .claude/skills/vivaldi-browser/scripts/prefs.mjs list tabs
node .claude/skills/vivaldi-browser/scripts/prefs.mjs list address_bar

# Full overview of important settings
node .claude/skills/vivaldi-browser/scripts/prefs.mjs snapshot
```

**Pref path reference** — key categories and paths:
- `vivaldi.tabs.bar.position` — `"top"` / `"bottom"` / `"left"` / `"right"` / `"none"`
- `vivaldi.tabs.visible` — boolean
- `vivaldi.tabs.stacking.mode` — `"compact"` / `"accordion"` / `"two_level"`
- `vivaldi.tabs.stacking.allow_dnd` — boolean
- `vivaldi.address_bar.visible` — boolean
- `vivaldi.address_bar.show_full_url` — boolean
- `vivaldi.panels.position` — `"left"` / `"right"`
- `vivaldi.panels.as_overlay.enabled` — boolean
- `vivaldi.status_bar.display` — `"shown"` / `"hidden"` / `"minimized"`
- `vivaldi.bookmarks.bar.visible` — boolean
- `vivaldi.appearance.density` — string
- `vivaldi.appearance.disable_title_bar` — boolean
- `vivaldi.theme.schedule.enabled` — boolean
- `vivaldi.theme.prefer_system_accent` — boolean
- `vivaldi.mouse_gestures.enabled` — boolean
- `vivaldi.mouse_gestures.rocker_gestures.enabled` — boolean
- `vivaldi.workspaces.enabled` — boolean
- `vivaldi.auto_hide.enabled` / `vivaldi.auto_hide.tab_bar` / `.address_bar` / `.panel` / `.status_bar` / `.bookmarks_bar` — boolean
- `vivaldi.downloads.open_panel_on_new` — boolean
- `vivaldi.downloads.notify_on_complete` — boolean
- `vivaldi.webpages.smooth_scrolling.enabled` — boolean
- `vivaldi.translate.enabled` — boolean
- `vivaldi.menu.display` — `"horizontal"` / `"vertical"`
- `vivaldi.keyboard.shortcuts.enable` — boolean
- `vivaldi.keyboard.shortcuts.enable_single_key` — boolean

To discover paths not listed: `prefs.mjs search <keyword>` or `prefs.mjs list <category>`.

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

## Enum Preferences (real-time supported)

These use internal integer enums in the Preferences file. The script accepts either the string name or integer — e.g. both `set ... position '"left"'` and `set ... position 1` work. **All changes are applied live** via CDP.

| Preference | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| `tabs.bar.position` | top | **left** | right | bottom | none |
| `panels.position` | left | right | — | — | — |
| `status_bar.display` | shown | hidden | minimized | — | — |
| `tabs.stacking.mode` | compact | accordion | two_level | — | — |
| `menu.display` | horizontal | vertical | — | — | — |
| `tabs.activation.on_close` | neighbor | related | last_active | order | — |
| `tabs.double_click` | none | close | new_tab | reload | mute |
| `startpage.speed_dial.size` | small | medium | large | — | — |
| `tabs.new_placement` | after_related | after_active | end | — | — |

## ⚠️ Safety Rules for Preferences

1. **Read before write** — always `get` first to show current value
2. **Know the value type** — booleans need `true`/`false`, strings need `'"quoted"'`, numbers are bare
3. **Layout changes need restart** — changing `tabs.bar.position`, `panels.position`, `status_bar.display` may need Vivaldi restart
4. **Shortcuts need Vivaldi closed** — `shortcuts.mjs set` auto-handles this
