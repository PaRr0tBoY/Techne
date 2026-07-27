---
name: sync-upstream
description: "Synchronize a personal fork with upstream changes. Use when the user wants to sync upstream, pull upstream updates, check what changed in the original repo, merge upstream, or generate a conflict report for their fork. Triggers on phrases like \"sync upstream\", \"pull upstream\", \"merge upstream changes\", \"更新上游\", \"同步上游\"."
---

# sync-upstream

Use this skill whenever the user wants to synchronize their personal fork with upstream changes from a source repository. Trigger phrases include "sync upstream", "pull upstream", "check upstream updates", "merge upstream changes", "更新上游", "同步上游", "合并上游", or when they mention wanting to see what changed in the original repo.

## What this skill does

Analyzes upstream changes, detects conflicts, and generates an interactive HTML report. The report lets the user inspect each changed file, see conflict markers, and make per-file decisions (take upstream, keep local, accept merged result, or reject). After the user reviews and saves their decisions, the skill executes the merge.

## Workflow

### Phase 1: Dry-run analysis (--dry-run)
1. Fetch the upstream remote (`git fetch upstream` by default)
2. Find the merge base between the user's branch and upstream
3. List all files changed upstream since the merge base
4. Detect conflicts via `git merge-tree` or a temporary merge
5. Generate a standalone HTML report at the path the user specifies (default: `sync-report.html`)

### Phase 2: Serve & submit (--serve)
1. Render the HTML report with server mode enabled
2. Start a local HTTP server on a random port (or specified port)
3. Open the user's browser to `http://localhost:{port}/`
4. Block until the user fills in decisions and clicks "Submit Decisions"
5. Output the received decisions as JSON to stdout

### Phase 3: Interactive one-step (--interactive)
1. Runs Phase 1 + Phase 2 (dry-run + serve)
2. After user submits decisions, automatically executes the merge
3. Leaves merge uncommitted for user review

### Phase 4: Execute from file (--execute decisions.json)
1. Read the `decisions.json` file (from dry-run + download, or from --serve output)
2. Checkout the target branch
3. Execute `git merge --no-commit`
4. For each conflicted file, resolve per the user's decisions
5. Stage resolved files with `git add`
6. Report remaining files that need manual editing

## Usage

```bash
py <skill-dir>/scripts/sync_upstream.py --interactive --branch fix/my-feature
```

```bash
# Or step by step:

# Step 1: dry-run to generate report
py <skill-dir>/scripts/sync_upstream.py --dry-run --branch fix/my-feature --output report.html

# Step 2: serve report, block until user submits decisions
py <skill-dir>/scripts/sync_upstream.py --serve --output report.html

# Step 3: execute merge from decisions
py <skill-dir>/scripts/sync_upstream.py --execute decisions.json
```
**Options:**
**Options:**
- `--dry-run`: Analyze changes and generate HTML report
- `--serve [PORT]`: Start local server, open browser, block until user submits decisions
- `--interactive`: --dry-run + --serve + --execute in one step
- `--execute DECISIONS_JSON`: Execute merge from a decisions.json file
- `--branch`: branch to sync (default: current branch)
- `--upstream-remote`: remote name (default: `upstream`)
- `--upstream-branch`: upstream branch (default: `master`)
- `--output`: HTML report path (default: `sync-report.html`)

## HTML Report

The report is a standalone HTML page. In `--serve`/`--interactive` mode, the script starts a local HTTP server and opens the browser automatically. The "Submit Decisions" button POSTs data back to the server; the script unblocks on receipt and either outputs JSON (--serve) or executes the merge (--interactive).

In `--dry-run` mode (no serve), the same HTML page shows a "Submit Decisions" button that downloads `decisions.json` for later use with `--execute`.

Per-file controls:
- **Conflicts**: radio buttons (take upstream / keep local / review manually)
- **Both modified**: checkbox to accept merged result or reject with reason
- **Clean upstream-only changes**: checkbox to accept or reject with reason
- Comment field for each item

## Important notes

- The script uses only Python stdlib + git CLI. No pip install needed.
- Works on both Windows (`py` launcher) and Unix (`python3`).
- The dry-run does NOT modify the working tree. It uses `git merge-tree` when a valid result is produced, or creates a temporary branch for conflict detection, then cleans up.
- The execute phase DOES modify the working tree. It leaves the merge uncommitted so the user can review before `git commit`.
- If the user has a non-standard upstream remote name (not `upstream`), ask before running.
- If the user hasn't added an upstream remote yet, help them do it first: `git remote add upstream <url>`
