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
### Summarize your work day in browser

```
Give me a summary of what I worked on in the past 24h, in first person. Only include items related to work.

Keep it short and simple. Use this exact format:

**What I got done yesterday?**
-
-

**What I am planning to do today?**
-

-

**Blockers**
-
-

Keep it bullet-pointed and under 200 words total.​​​
```

### AI-powered browser workspace management

```

Analyze my current browser tabs and organize them into meaningful workspaces.

Understand the context of each tab, group related pages together, and suggest workspace names.

Only include tabs related to active projects, research, or learning.

For each workspace:

* Give it a short name.
* List the related tabs.
* Explain the purpose of this workspace.

Do not include personal browsing, shopping, or entertainment tabs.
Keep the result concise.

```

### Recover my previous work context

```

Help me continue the work I was doing previously.

Analyze my browser history, open tabs, bookmarks, and recent activity.

Identify unfinished tasks and restore the relevant browser state.

Return:

## **Previous task**

*

## **Related resources**

*

## **Suggested next steps**

*

Only include productive activities. Ignore casual browsing.
Keep it short.

```

### Clean up my browser tabs

```

Analyze all my open browser tabs and help me clean them up.

For each tab, decide whether it should be:

* Keep: actively needed for current work
* Archive: useful but not needed now
* Close: no longer valuable

Consider:

* Last accessed time
* Duplicate URLs
* Page type
* Relationship with current projects

Return:

## **Keep**

*

## **Archive**

*

## **Close**

*

Keep the recommendation concise.

```

### Find forgotten ideas from my browsing history

```

Analyze my browser history from the past month.

Find useful ideas, research topics, and unfinished explorations that I may have forgotten.

Only include:

* Technical research
* Product ideas
* Learning materials
* Important references

Return:

## **Forgotten ideas**

*

## **Potential follow-ups**

*

Do not include ordinary browsing activity.

```

### Configure my browser for my workflow

```

Analyze my current Vivaldi configuration and optimize it for my workflow.

Check:

* Browser settings
* Keyboard shortcuts
* Tab management
* Workspace organization
* UI layout

Suggest improvements and explain the reason for each change.

Prioritize:

* Faster navigation
* Less context switching
* Better focus

Do not change anything without confirmation.

```

### AI browser assistant for debugging

```

Help me debug my Vivaldi customization.

Monitor browser console output and analyze errors.

For each issue:

## **Error**

*

## **Possible cause**

*

## **Suggested fix**

*

Focus on:

* JavaScript errors
* UI problems
* Extension conflicts
* Browser customization issues

Keep the analysis technical and concise.

```

## Requirements

- [Vivaldi Browser](https://vivaldi.com/) installed
- Node.js ≥ 18

## License

MIT
