# Vivaldi Browser Skill

[![skills.sh](https://skills.sh/b/PaRr0tBoY/vivaldi-browser-skill)](https://skills.sh/PaRr0tBoY/vivaldi-browser-skill)

AI agent skill for reading and writing Vivaldi browser settings and data — change 600+ preferences, configure keyboard shortcuts, query tabs/bookmarks/history/downloads, capture live console output.

## Install

```bash
npx skills add PaRr0tBoY/vivaldi-browser-skill
```

## Features

- **Preferences** — read/write/search 600+ Vivaldi preference paths with live-apply via CDP
- **Keyboard Shortcuts** — get/set/list Vivaldi keyboard shortcuts
- **Browser Data** — query open tabs, bookmarks, history, and downloads
- **Console Monitor** — capture live browser console output with keyword filtering

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/prefs.mjs` | Read/write/search Vivaldi preferences |
| `scripts/shortcuts.mjs` | Get/set/list keyboard shortcuts |
| `scripts/data.mjs` | Query tabs, bookmarks, history, downloads |
| `scripts/cdp-client.mjs` | CDP client — console capture, live apply |

## Usage

Once installed as a skill, the agent reads `SKILL.md` and executes the scripts automatically. Examples of what you can ask:

- "Show me my current tab bar position"
- "Move the tab bar to the left side"
- "Enable mouse gestures"
- "List all my open tabs"
- "Set Ctrl+Shift+B as the bookmark toggle shortcut"
- "Capture console errors for 10 seconds"

## Requirements

- [Vivaldi Browser](https://vivaldi.com/) installed
- Node.js ≥ 18

## License

MIT
