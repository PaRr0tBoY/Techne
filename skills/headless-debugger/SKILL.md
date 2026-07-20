---
name: headless-debugger
description: >
  Add headless (non-interactive) mode to any script and systematically debug every user flow without human interaction.
  MUST use this skill whenever: a user asks to debug a script, add headless/auto/non-interactive/batch mode, test a
  CLI or TUI tool without typing input, validate all code paths automatically, fix parse or runtime errors in scripts
  with interactive prompts, or prepare a script for CI/CD pipelines. Also trigger when the user says "run non-interactively",
  "add --headless flag", "test every flow", "make it work in CI", or mentions Read-Host/input()/read prompts that block execution.
  Works with PowerShell, Bash, Python, Node.js, Go, and Ruby. If headless mode already exists, skip to debugging.
  If not, inject one first, then debug every flow.
---

# Headless Debugger

Turn any interactive script into a self-testable artifact by injecting a headless mode parameter, then
traversing every user flow automatically to find and fix bugs — all without human interaction.

## When to use this skill

- User says "debug this script", "add headless mode", "test without interaction", "run non-interactively"
- User pastes a script with interactive prompts and wants it validated
- User has a TUI/CLI installer, configurator, or menu-driven tool that needs automated testing
- A script has parse errors and the user wants them fixed by running it

## Overview

The workflow has 3 phases:

```
1. ANALYZE   → Map script structure: language, entry points, user flows, interactive points
2. INJECT    → Add --headless parameter that bypasses all interactive prompts
3. DEBUG     → Run headless, traverse each flow, fix errors iteratively
```

## Phase 1: ANALYZE — Map the script

Read the script and produce a structural map. Focus on:

### Language detection
Identify language from extension, shebang, or content. This determines:
- How to invoke the script (`powershell`, `bash`, `python`, `node`, `go run`, `ruby`)
- What the headless parameter syntax looks like
- What the interactive primitives are

### Interactive primitives by language

| Language   | Interactive calls to find |
|------------|--------------------------|
| PowerShell | `Read-Host`, `ReadKey`, `$host.UI.RawUI.ReadKey`, `Write-Host -Prompt`, `[Console]::ReadKey()` |
| Bash       | `read`, `read -p`, `select`, `dialog`, `whiptail`, `fzf` (interactive mode) |
| Python     | `input()`, `getpass.getpass()`, `click.prompt()`, `inquirer`, `curses`, `keyboard.read_key()` |
| Node.js    | `readline`, `prompt()`, `inquirer`, `ora` (interactive spinners), `keypress` events |
| Go         | `fmt.Scan*`, `bufio.Scanner`, `promptui`, `survey` |
| Ruby       | `gets`, `gets.chomp`, `STDIN.gets`, `highline`, `tty-prompt` |

### Flow discovery

Find all entry points and branching paths. A "flow" is a user-facing action:
- In a menu system: each menu option is a flow
- In a CLI tool: each subcommand is a flow
- In an installer: install, update, uninstall, manage are separate flows

Document each flow as:
```
Flow: <name>
  Entry: <how to reach it>
  Interactive points: <line numbers with Read-Host/input/etc>
  Sub-steps: <sequential operations>
```

### Output of Phase 1

Produce a summary (not a separate file — just in your working context):
- Language + invocation command
- List of flows with their entry conditions
- All interactive primitives with line numbers
- Whether headless mode already exists (and if so, how it works)

## Phase 2: INJECT — Add headless parameter

If the script already has a working headless/auto mode (check for `--headless`, `-Auto`, `HEADLESS`
env var, `--non-interactive`, `--batch`, `--yes`, `-y`), verify it covers all flows, then skip to Phase 3.

Otherwise, inject headless mode. The design principles:

### Parameter injection pattern

Add a CLI parameter at the script's parameter declaration point:

**PowerShell:**
```powershell
param([switch]$Headless)
# Or if $Auto already exists, alias it
```

**Bash:**
```bash
HEADLESS=false
while [[ $# -gt 0 ]]; do
  case "$1" in --headless|-y|--non-interactive) HEADLESS=true; shift ;; esac
done
```

**Python:**
```python
parser.add_argument('--headless', action='store_true', help='Run non-interactively')
```

**Node.js:**
```javascript
const headless = process.argv.includes('--headless');
```

### Interactive bypass pattern

For each interactive primitive found in Phase 1, create a bypass. The general approach:

**Interactive prompt → headless default:**
Instead of removing the interactive call, wrap it so headless mode picks the default/first option:

```powershell
# PowerShell example
function Prompt-Choice($options, $default = 0) {
    if ($Headless) { return $options[$default] }
    # original interactive logic
}
```

```bash
# Bash example
prompt_choice() {
    if $HEADLESS; then echo "$1"; return; fi
    # original interactive logic
}
```

**Key input (TUI) → headless simulate:**
For TUI apps that read individual keystrokes:

```powershell
# PowerShell
function Read-TuiKey {
    if ($Headless) { return 'ENTER' }  # or cycle through UP/DOWN/ENTER
    # original key reading
}
```

```bash
# Bash
read_key() {
    if $HEADLESS; then echo "ENTER"; return; fi
    # original read -rsn1
}
```

### Guard rails for injection

- **Never remove original interactive code** — only wrap/bypass it
- **Preserve all existing functionality** — headless is additive
- **Use the script's existing conventions** — match indentation, naming, comment style
- **Add a `# Headless mode` section comment** near the parameter declaration explaining what it does

### Validation after injection

Run a syntax check appropriate to the language:

| Language   | Check command |
|------------|--------------|
| PowerShell | `[System.Management.Automation.Language.Parser]::ParseFile(path, [ref]$null, [ref]$errors)` |
| Bash       | `bash -n script.sh` |
| Python     | `python -c "import ast; ast.parse(open('script.py').read())"` |
| Node.js    | `node --check script.js` |
| Go         | `go build ./...` (or `go vet`) |
| Ruby       | `ruby -c script.rb` |

Fix any parse errors before proceeding.

## Phase 3: DEBUG — Run headless and fix

This is the iterative loop. Run the script headless, observe errors, fix, repeat.

### Step 3.1: Smoke test

Run the script with `--headless` (or equivalent). Capture both stdout and stderr.

```
<power-shell-or-shell-command> script.ext --headless 2>&1
```

If it crashes on startup, fix the immediate error (usually a parse error or missing dependency).

### Step 3.2: Flow traversal

For each flow discovered in Phase 1, craft a run that exercises it. This might mean:

- **Menu-driven scripts**: The headless mode should auto-select each menu option in sequence
- **CLI tools**: Run each subcommand
- **Installers**: Run install flow, then manage flow, then uninstall flow
- **Scripts with branches**: Set up conditions that trigger each branch

Run each flow and capture output. Common error categories:

1. **Parse errors** — syntax issues from injection. Fix immediately.
2. **Missing function/variable** — headless path references something not defined. Fix the reference.
3. **Scope issues** — variable not visible across functions. Fix scoping.
4. **Encoding issues** — Unicode/string problems. Fix encoding declarations.
5. **Logic errors** — the headless path produces wrong results. Fix the logic.

### Step 3.3: Iterative fix loop

```
while errors found:
    1. Identify the error (parse error, runtime exception, wrong output)
    2. Locate in source (use line numbers from stack trace / error output)
    3. Apply fix
    4. Re-run the specific flow that failed
    5. Verify no regression in other flows
```

Stop when:
- All flows complete without errors
- The script has been running clean for 2 consecutive passes

### Step 3.4: Report

After all flows pass, produce a summary:

```
## Debug Report

**Script**: <name> (<language>, <N> lines)
**Headless mode**: Added / Already existed

### Changes made:
- <file>:<line> — <what changed and why>

### Flows verified:
- ✅ <flow 1> — completed successfully
- ✅ <flow 2> — completed successfully
- ❌ <flow 3> — skipped (requires <specific hardware/network/etc>)

### Remaining notes:
- <any caveats, edge cases, or things to watch>
```

## Edge cases and notes

- **Network-dependent scripts**: If a flow requires downloading, and you're in a sandboxed environment,
  mark it as "skipped — requires network" rather than failing. Mock what you can.
- **GUI scripts**: If the script launches a GUI (WinForms, tkinter, browser), the headless mode should
  skip the GUI launch and exercise the logic directly where possible.
- **Scripts that modify system state**: In headless mode, use dry-run or temp directory patterns.
  Never actually install/uninstall system packages during debugging.
- **Multi-file projects**: If the script sources/imports other files, analyze the dependency chain too.
  The headless parameter needs to propagate to sourced scripts if they have their own interactive calls.
- **Already-headless scripts**: Some scripts (build tools, CI scripts) are already non-interactive.
  If the analysis shows zero interactive primitives, report "already headless" and skip to direct debugging.
