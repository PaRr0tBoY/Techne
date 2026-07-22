<p align="center">
  <img src="./assets/readme/hero.svg" width="100%"
       alt="Techne — A modular collection of self-contained AI agent skills">
</p>
<p align="center">
  <a href="https://skills.sh/PaRr0tBoY/Techne"><img src="https://skills.sh/b/PaRr0tBoY/Techne" alt="skills.sh"></a>
  <img src="https://img.shields.io/github/license/PaRr0tBoY/Techne" alt="License">
  <img src="https://img.shields.io/github/stars/PaRr0tBoY/Techne" alt="GitHub Stars">
  <img src="https://img.shields.io/badge/skills-3-blue" alt="Skills">
  <img src="https://img.shields.io/badge/node.js-%3E%3D18-green" alt="Node.js">
</p>


## Quick start

```bash
# Install any skill individually
npx skills add -y -g PaRr0tBoY/Techne/skills/vivaldi-browser
npx skills add -y -g PaRr0tBoY/Techne/skills/headless-debugger
npx skills add -y -g PaRr0tBoY/Techne/skills/github-base-finder
```

**Requirements:** Node.js >= 18 · Python >= 3.10 (for github-base-finder) · [gh CLI](https://cli.github.com/) (for github-base-finder) · [Vivaldi Browser](https://vivaldi.com/) (for vivaldi-browser only)

---

## What is Techne?

A modular repository of skills for AI coding agents. Each skill is a self-contained directory with a `SKILL.md` definition and supporting scripts — drop it into your agent's skill folder and it works immediately.

Three skills ship today; the structure is designed for you to add more.

---

## Available skills

<p align="center">
  <img src="./assets/readme/section-skills.svg" width="100%"
       alt="Available Skills — Install individually or compose into agent workflows">
</p>

| Skill | What it controls | Key capabilities |
|-------|-----------------|------------------|
| **[vivaldi-browser](skills/vivaldi-browser/)** | Vivaldi browser | 600+ preference paths with live CDP apply · keyboard shortcut management · tab/bookmark/history/download queries · live console capture |
| **[headless-debugger](skills/headless-debugger/)** | Any script | Inject headless mode into interactive scripts (PS/Bash/Python/Node/Go/Ruby) · traverse every user flow · fix parse/runtime errors · CI-ready |
| **[github-base-finder](skills/github-base-finder/)** | GitHub search | PRD decomposition · multi-strategy repo search · candidate evaluation · comparison matrix · batch search · awesome-list mining |

---

## How it works

Each skill follows the same structure:

```
skills/
└── skill-name/
    ├── SKILL.md          # Agent instructions
    └── scripts/          # Executable scripts
```

The agent reads `SKILL.md` and executes the scripts automatically. No manual configuration needed.

---

## vivaldi-browser

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

---

## headless-debugger

Turn any interactive script into a self-testable artifact. Injects a `--headless` / `-Headless` parameter that bypasses all interactive prompts, then traverses every user flow to find and fix bugs — no human interaction needed.

**Supported languages:** PowerShell, Bash, Python, Node.js, Go, Ruby

---

## github-base-finder

Find the best GitHub project to use as a foundation for secondary development, based on a PRD.
Decomposes requirements into search queries, runs multi-strategy GitHub search, evaluates candidates
across 6 dimensions, and produces a comparison matrix with recommendations.

```bash
# Single repo search
python scripts/search.py search "project management kanban" --lang TypeScript --stars 500 --limit 10 --format markdown

# Batch search from JSON file
python scripts/search.py batch queries.json --stars 100 --limit 10 --format markdown

# Detailed repo metadata (README excerpt, release info, topics)
python scripts/search.py detail makeplane/plane --format markdown

# Find repos with shared topics
python scripts/search.py related makeplane/plane --limit 10 --format markdown

# Mine awesome-lists for domain
python scripts/search.py awesome "project management" --limit 5 --format markdown
```

**Workflow:** PRD → decompose features → generate queries → search → enrich → evaluate → compare → recommend

---

## Repository structure

```
techne/
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
├── assets/
│   └── readme/
│       ├── hero.svg
│       └── section-skills.svg
└── README.md
```

---

## License

MIT
