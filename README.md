# Techne

[![skills.sh](https://skills.sh/b/PaRr0tBoY/vivaldi-browser-skill)](https://skills.sh/PaRr0tBoY/vivaldi-browser-skill)

A modular repository of skills for AI coding agents. Each skill is a self-contained directory with a `SKILL.md` definition and supporting scripts — drop it into your agent's skill folder and it works immediately.

Currently ships three skills; the structure is designed for you to add more.

## Available Skills

| Skill | What it controls | Key capabilities |
|-------|-----------------|------------------|
| **[vivaldi-browser](skills/vivaldi-browser/)** | Vivaldi browser | 600+ preference paths with live CDP apply · keyboard shortcut management · tab/bookmark/history/download queries · live console capture |
| **[headless-debugger](skills/headless-debugger/)** | Any script | Inject headless mode into interactive scripts (PS/Bash/Python/Node/Go/Ruby) · traverse every user flow · fix parse/runtime errors · CI-ready |
| **[github-base-finder](skills/github-base-finder/)** | GitHub search | PRD decomposition · multi-strategy repo search · candidate evaluation · comparison matrix · batch search · awesome-list mining |

### vivaldi-browser

The flagship skill. Four parameterized scripts — no manual JS coding needed.

```bash
# Preferences: read, write, search 600+ paths with instant live-apply
node scripts/prefs.mjs get vivaldi.tabs.bar.position
node scripts/prefs.mjs set vivaldi.tabs.bar.position '"left"'
node scripts/prefs.mjs search theme

# Shortcuts: get, set, list keyboard shortcuts (auto-handles Vivaldi restart)
node scripts/shortcuts.mjs set COMMAND_BREAKMODE_TOGGLE alt+,

# Data: query open tabs, bookmarks, history, downloads
node scripts/data.mjs tabs
node scripts/data.mjs bookmarks github
node scripts/data.mjs history today

# Console: capture live browser output with keyword filter
node scripts/cdp-client.mjs --console -d 10 -f ERROR
```

**How changes apply:** `prefs.mjs set` writes to disk and pushes live via CDP — instant effect, survives restart. `shortcuts.mjs set` auto-closes Vivaldi, modifies, and restarts. `data.mjs` and console auto-launch Vivaldi with debug port if not running.

### headless-debugger

Turn any interactive script into a self-testable artifact. Injects a `--headless` / `-Headless` parameter that bypasses all interactive prompts, then traverses every user flow to find and fix bugs — no human interaction needed.

```bash
npx skills add PaRr0tBoY/vivaldi-browser-skill/skills/headless-debugger
```

**Supported languages:** PowerShell, Bash, Python, Node.js, Go, Ruby

### github-base-finder

Find the best GitHub project to use as a foundation for secondary development, based on a PRD.
Decomposes requirements into search queries, runs multi-strategy GitHub search, evaluates candidates
across 6 dimensions, and produces a comparison matrix with recommendations.

```bash
# Single repo search
py scripts/search.py search "project management kanban" --lang TypeScript --stars 500 --limit 10 --format markdown

# Batch search from JSON file
py scripts/search.py batch queries.json --stars 100 --limit 10 --format markdown

# Detailed repo metadata (README excerpt, release info, topics)
py scripts/search.py detail makeplane/plane --format markdown

# Find repos with shared topics
py scripts/search.py related makeplane/plane --limit 10 --format markdown

# Mine awesome-lists for domain
py scripts/search.py awesome "project management" --limit 5 --format markdown
```

**Workflow:** PRD → decompose features → generate queries → search → enrich → evaluate → compare → recommend

## Install

```bash
npx skills add PaRr0tBoY/vivaldi-browser-skill/skills/vivaldi-browser
npx skills add PaRr0tBoY/vivaldi-browser-skill/skills/headless-debugger
npx skills add PaRr0tBoY/vivaldi-browser-skill/skills/github-base-finder
```

**Requirements:** Node.js >= 18 · Python >= 3.10 · [gh CLI](https://cli.github.com/) (for github-base-finder) · [Vivaldi Browser](https://vivaldi.com/) (for vivaldi-browser only)

## Repository structure

```
vivaldi-browser-skill/
├── skills/
│   ├── vivaldi-browser/
│   │   ├── SKILL.md
│   │   └── scripts/
│   │       ├── prefs.mjs
│   │       ├── shortcuts.mjs
│   │       ├── data.mjs
│   │       └── cdp-client.mjs
│   ├── headless-debugger/
│   │   ├── SKILL.md
│   │   └── scripts/
│   │       └── debug-headless.*.ps1|.sh|.py|.mjs|.go|.rb
│   └── github-base-finder/
│       ├── SKILL.md
│       └── scripts/
│           └── search.py
└── README.md
```

## License

MIT
