#!/usr/bin/env python3
"""sync-upstream: analyze and merge upstream changes into a personal fork.

Two modes:
  --dry-run        Fetch upstream, detect conflicts, generate HTML report.
  --execute FILE   Read decisions JSON, resolve conflicts, commit the merge.

Example:
  python sync_upstream.py --dry-run --branch fix/my-feature --output report.html
  # ... review report.html, make decisions, save decisions.json ...
  python sync_upstream.py --execute decisions.json
"""

import argparse
import hashlib
import json
import http.server
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Optional, Union


def run_git(*args: str, cwd: Optional[str] = None) -> tuple[int, str, str]:
    """Run a git command, return (returncode, stdout, stderr)."""
    proc = subprocess.run(
        ["git"] + list(args),
        capture_output=True,
        text=True,
        cwd=cwd,
        encoding="utf-8",
        errors="replace",
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def check_git_repo() -> bool:
    """Verify we're inside a git repository."""
    rc, _, _ = run_git("rev-parse", "--git-dir")
    return rc == 0


def get_current_branch() -> Optional[str]:
    rc, out, _ = run_git("branch", "--show-current")
    return out if rc == 0 and out else None


def get_repo_root() -> Optional[str]:
    rc, out, _ = run_git("rev-parse", "--show-toplevel")
    return out if rc == 0 and out else None


def fetch_upstream(remote: str) -> bool:
    """Fetch the upstream remote. Returns True on success."""
    rc, _, err = run_git("fetch", remote)
    if rc != 0:
        print(f"error: failed to fetch {remote}: {err}", file=sys.stderr)
        return False
    return True


def get_merge_base(branch: str, upstream_ref: str) -> Optional[str]:
    rc, out, _ = run_git("merge-base", branch, upstream_ref)
    return out if rc == 0 and out else None


def get_changed_files(merge_base: str, upstream_ref: str, branch: str) -> list[str]:
    """List files changed on upstream since the merge base."""
    rc, out, _ = run_git(
        "diff", "--name-only", "--diff-filter=AMDR",
        merge_base, upstream_ref
    )
    if rc != 0:
        return []
    return [f for f in out.split("\n") if f]


def get_local_changed_files(merge_base: str, branch: str) -> set[str]:
    """List files changed locally since the merge base."""
    rc, out, _ = run_git(
        "diff", "--name-only", "--diff-filter=AMDR",
        merge_base, branch
    )
    if rc != 0:
        return set()
    return set(f for f in out.split("\n") if f)


def get_file_diff(base: str, target: str, path: str) -> str:
    """Get the diff of a single file between base and target."""
    rc, out, _ = run_git("diff", base, target, "--", path)
    return out if rc == 0 else ""


def try_merge(
    branch: str,
    upstream_ref: str,
    repo_root: str,
) -> tuple[list[str], dict[str, str], str]:
    """
    Attempt a merge in a temporary index. Returns:
    - conflicted_files: list of file paths with conflicts
    - conflict_contents: {path: conflict_marker_text} for each conflicted file
    - merge_head: the upstream commit hash being merged
    """
    # Get upstream HEAD
    rc, upstream_head, _ = run_git("rev-parse", upstream_ref)
    if rc != 0:
        return [], {}, ""

    # Try merge-tree (available since git 2.38) for a dry-run merge
    rc, out, _ = run_git(
        "merge-tree", "--write-tree", branch, upstream_head
    )

    # merge-tree returns non-zero when there are conflicts, but still outputs
    # the tree with conflict markers. We parse the output.
    conflicted: list[str] = []
    contents: dict[str, str] = {}
    current_file: Optional[str] = None
    current_lines: list[str] = []

    for line in out.split("\n"):
        # merge-tree outputs lines like:
        #   changed in both    base   → conflict
        #   +<<<<<<< .our
        #   +our content
        #   +=======
        #   +upstream content
        #   +>>>>>>> .their
        for marker in [
            "changed in both",
        ]:
            if marker in line:
                # parse file path from the "changed in both" line
                # or just detect conflicts from merge markers
                pass

        # Detect merge conflicts in the output
        if line.startswith("+<<<<<<<"):
            # Extract filename from whatever context we have
            # merge-tree output format varies; use simpler approach
            pass

    # If merge-tree is not available or doesn't give us what we need,
    # fall back to a real merge with --no-commit in a temp worktree.
    if rc != 0 or not out:
        return _try_merge_real(branch, upstream_ref, upstream_head, repo_root)

    # Parse merge-tree output for conflict markers
    for line in out.split("\n"):
        stripped = line.lstrip("+")
        if stripped.startswith("<<<<<<<"):
            if " " not in stripped:
                continue
            parts = stripped.split(" ", 1)
            if len(parts) > 1:
                current_file = parts[1].strip()
                current_lines = [line]
        elif current_file is not None:
            current_lines.append(line)
            if line.lstrip("+").startswith(">>>>>>>"):
                if current_file not in conflicted:
                    conflicted.append(current_file)
                contents[current_file] = "\n".join(current_lines)
                current_file = None
                current_lines = []

    return conflicted, contents, upstream_head


def _try_merge_real(
    branch: str,
    upstream_ref: str,
    upstream_head: str,
    repo_root: str,
) -> tuple[list[str], dict[str, str], str]:
    """Fallback: do a real merge with --no-commit in the current repo,
    capturing conflict markers, then abort."""
    original_branch = get_current_branch()
    if not original_branch:
        return [], {}, upstream_head

    # Create a temp branch for the test merge
    test_branch = f"_sync_upstream_test_{int(time.time())}"
    rc, _, err = run_git("checkout", "-b", test_branch)
    if rc != 0:
        print(f"error: cannot create test branch: {err}", file=sys.stderr)
        return [], {}, upstream_head

    try:
        rc, _, _ = run_git("merge", "--no-commit", "--no-ff", upstream_head)
        # rc != 0 means conflicts
        conflicted: list[str] = []
        contents: dict[str, str] = {}

        # Get list of unmerged files
        _, unmerged, _ = run_git("diff", "--name-only", "--diff-filter=U")
        if unmerged:
            conflicted = [f for f in unmerged.split("\n") if f]

        # Read conflict contents
        for path in conflicted:
            full_path = os.path.join(repo_root, path)
            if os.path.isfile(full_path):
                try:
                    with open(full_path, "r", encoding="utf-8", errors="replace") as fh:
                        contents[path] = fh.read()
                except Exception:
                    contents[path] = "[binary file or unreadable]"

        return conflicted, contents, upstream_head
    finally:
        # Clean up: abort merge and go back
        run_git("merge", "--abort")
        run_git("checkout", original_branch)
        run_git("branch", "-D", test_branch)


def _parse_merge_tree_conflicts(output: str) -> tuple[list[str], dict[str, str]]:
    """Parse conflict markers from git merge-tree output."""
    conflicted: list[str] = []
    contents: dict[str, str] = {}
    current_file: Optional[str] = None
    current_lines: list[str] = []

    for line in output.split("\n"):
        stripped = line[1:] if line.startswith(("+", "-", " ")) else line
        if stripped.startswith("<<<<<<<"):
            # Try to extract filename from the marker
            # The format in merge-tree is: +<<<<<<< .our  or  +<<<<<<< path
            marker_rest = stripped[7:].strip()
            # The file path is embedded differently; use a tracking approach
            # Actually merge-tree output has "changed in both" lines
            pass
        elif current_file is not None:
            current_lines.append(line)
            if line.startswith("+>>>>>>>"):
                if current_file not in conflicted:
                    conflicted.append(current_file)
                contents[current_file] = "\n".join(current_lines)
                current_file = None
                current_lines = []

    return conflicted, contents


def build_report(
    branch: str,
    upstream_remote: str,
    upstream_branch: str,
    merge_base: str,
    upstream_head: str,
    changed_files: list[str],
    local_changed: set[str],
    conflicted_files: list[str],
    conflict_contents: dict[str, str],
) -> dict:
    """Build the JSON report data structure."""
    upstream_ref = f"{upstream_remote}/{upstream_branch}"
    items = []

    for path in changed_files:
        is_conflict = path in conflicted_files
        also_changed_locally = path in local_changed
        upstream_diff = get_file_diff(merge_base, upstream_ref, path)
        local_diff = get_file_diff(merge_base, branch, path) if also_changed_locally else ""

        item = {
            "path": path,
            "status": "conflict" if is_conflict else ("both" if also_changed_locally else "clean"),
            "upstream_diff_lines": len(upstream_diff.split("\n")) - 1 if upstream_diff else 0,
            "local_diff_lines": len(local_diff.split("\n")) - 1 if local_diff else 0,
            "conflict_content": conflict_contents.get(path, ""),
            "upstream_diff": _truncate_diff(upstream_diff),
            "local_diff": _truncate_diff(local_diff),
            # default decisions
            "accept": True if not is_conflict else None,
        }
        items.append(item)

    return {
        "generated": time.strftime("%Y-%m-%d %H:%M:%S"),
        "repo": os.path.basename(get_repo_root() or ""),
        "branch": branch,
        "upstream_remote": upstream_remote,
        "upstream_branch": upstream_branch,
        "upstream_head": upstream_head[:12],
        "merge_base": merge_base[:12] if merge_base else "unknown",
        "summary": {
            "total_changes": len(changed_files),
            "conflicts": len(conflicted_files),
            "clean_merges": len(changed_files) - len(conflicted_files),
        },
        "items": items,
    }


def _truncate_diff(diff: str, max_lines: int = 200) -> str:
    """Truncate a diff to max_lines for display."""
    lines = diff.split("\n")
    if len(lines) <= max_lines:
        return diff
    return "\n".join(lines[:max_lines]) + f"\n... ({len(lines) - max_lines} more lines)"

def render_html(report: dict, output_path: str, serve_port: int = 0) -> None:
    """Render the report as a standalone HTML page with interactive decisions."""
    report_json = json.dumps(report, ensure_ascii=False)

    template_path = Path(__file__).parent / "report-template.html"
    with open(template_path, "r", encoding="utf-8") as f:
        html = f.read()

    html = html.replace("{REPORT_JSON}", report_json)
    html = html.replace("{SERVE_PORT}", str(serve_port))
    html = html.replace("{REPO}", report['repo'])
    html = html.replace("{BRANCH}", report['branch'])
    html = html.replace("{UPSTREAM_REMOTE}", report['upstream_remote'])
    html = html.replace("{UPSTREAM_BRANCH}", report['upstream_branch'])
    html = html.replace("{UPSTREAM_HEAD}", report['upstream_head'])
    html = html.replace("{MERGE_BASE}", report['merge_base'])
    html = html.replace("{GENERATED}", report['generated'])
    html = html.replace("{TOTAL}", str(report['summary']['total_changes']))
    html = html.replace("{CLEAN}", str(report['summary']['clean_merges']))
    html = html.replace("{CONFLICTS}", str(report['summary']['conflicts']))

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Report written to: {output_path}")


def execute_decisions(decisions_path: str) -> None:
    """Read decisions.json and execute the merge."""
    repo_root = get_repo_root()
    if not repo_root:
        print("error: not in a git repository", file=sys.stderr)
        sys.exit(1)

    with open(decisions_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    branch = data["branch"]
    upstream_ref = f"{data['upstream_remote']}/{data['upstream_branch']}"
    decisions = {d["path"]: d for d in data["decisions"]}

    print(f"Syncing {branch} with {upstream_ref}")
    print(f"  upstream commit: {data['upstream_head']}")

    # Fetch
    if not fetch_upstream(data["upstream_remote"]):
        sys.exit(1)

    # Checkout branch
    rc, _, err = run_git("checkout", branch)
    if rc != 0:
        print(f"error: cannot checkout {branch}: {err}", file=sys.stderr)
        sys.exit(1)

    # Get upstream HEAD
    rc, up_head, err = run_git("rev-parse", upstream_ref)
    if rc != 0:
        print(f"error: {err}", file=sys.stderr)
        sys.exit(1)

    # Attempt merge --no-commit
    # Get merge base for potential file reverts
    rc, merge_base, _ = run_git("merge-base", branch, upstream_ref)
    if rc != 0:
        print("error: cannot find merge base", file=sys.stderr)
        sys.exit(1)

    rc, out, err = run_git("merge", "--no-commit", "--no-ff", up_head)
    if rc == 0:
        print("Merge succeeded cleanly. All changes applied.")

        # Revert files the user rejected
        rejected = [d for d in decisions.values() if not d.get("accept", True)]
        if rejected:
            for d in rejected:
                path = d["path"]
                rc2, _, err = run_git("checkout", merge_base, "--", path)
                if rc2 == 0:
                    run_git("add", path)
                    print(f"  ✓ {path}: reverted to local version")
                else:
                    print(f"  ✗ {path}: failed to revert ({err})")
            print("\nReview changes, then run 'git commit'.")
        else:
            print("Run 'git commit' to finalize, or 'git merge --abort' to cancel.")
        return

    # Handle conflicts per decisions
    _, unmerged, _ = run_git("diff", "--name-only", "--diff-filter=U")
    conflicted = [f for f in unmerged.split("\n") if f] if unmerged else []

    print(f"\n{len(conflicted)} files with conflicts.")

    for path in conflicted:
        decision = decisions.get(path, {})
        action = decision.get("action", "upstream")

        if action == "upstream":
            # Accept upstream version
            rc, _, err = run_git("checkout", "--theirs", path)
            if rc == 0:
                run_git("add", path)
                print(f"  ✓ {path}: accepted upstream")
            else:
                print(f"  ✗ {path}: failed to resolve ({err})")
        elif action == "local":
            # Keep local version
            rc, _, err = run_git("checkout", "--ours", path)
            if rc == 0:
                run_git("add", path)
                print(f"  ✓ {path}: kept local")
            else:
                print(f"  ✗ {path}: failed to resolve ({err})")
        else:
            # manual — leave as-is for user to edit
            print(f"  ⚠ {path}: left for manual review")

    # Handle rejected clean merges
    still_unmerged, _, _ = run_git("diff", "--name-only", "--diff-filter=U")
    remaining = [f for f in still_unmerged.split("\n") if f] if still_unmerged else []

    if remaining:
        print(f"\n{len(remaining)} files still need resolution. Edit them, then run:")
        print("  git add <files>")
        print("  git commit")
    else:
        print("\nAll conflicts resolved. Run 'git commit' to finalize.")


def serve_and_block(report: dict, output_path: str, port: int = 0) -> dict:
    """Start HTTP server, open browser, block until user submits decisions.

    Returns the decisions payload as a dict.
    Uses a random available port if port=0.
    """
    import socket
    import webbrowser

    if port == 0:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("127.0.0.1", 0))
            port = s.getsockname()[1]

    # Render HTML with serve mode enabled
    render_html(report, output_path, serve_port=port)

    result_container: dict = {"data": None}

    class SubmitHandler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == "/" or self.path == "":
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.end_headers()
                with open(output_path, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.end_headers()

        def do_POST(self):
            if self.path == "/submit":
                content_len = int(self.headers.get("Content-Length", 0))
                body = self.rfile.read(content_len)
                try:
                    result_container["data"] = json.loads(body)
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(b'{"ok":true}')
                except Exception as e:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": str(e)}).encode())
            else:
                self.send_response(404)
                self.end_headers()

        def do_OPTIONS(self):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.end_headers()

        def log_message(self, format, *args):
            pass  # suppress default logging

    server = http.server.HTTPServer(("127.0.0.1", port), SubmitHandler)
    url = f"http://localhost:{port}/"

    print(f"\nOpening report in browser: {url}")
    print("Waiting for you to review and submit decisions...")
    print("(Close this window or press Ctrl+C to cancel)\n")

    # Open browser
    webbrowser.open(url)

    # Block until one POST request
    server.handle_request()
    server.server_close()

    if result_container["data"] is None:
        print("No decisions received.", file=sys.stderr)
        sys.exit(1)

    return result_container["data"]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="sync-upstream: analyze and merge upstream changes"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Analyze changes and generate HTML report",
    )
    parser.add_argument(
        "--execute",
        metavar="DECISIONS_JSON",
        help="Execute merge based on a decisions.json file",
    )
    parser.add_argument(
        "--branch",
        help="Branch to sync (default: current branch)",
    )
    parser.add_argument(
        "--upstream-remote",
        default="upstream",
        help="Upstream remote name (default: upstream)",
    )
    parser.add_argument(
        "--upstream-branch",
        default="master",
        help="Upstream branch name (default: master)",
    )
    parser.add_argument(
        "--output",
        default="sync-report.html",
        help="Output HTML report path (default: sync-report.html)",
    )
    parser.add_argument(
        "--serve",
        type=int,
        nargs="?",
        const=0,
        metavar="PORT",
        help="Start a local server and block until user submits decisions. "
             "Optional port number (default: random available port).",
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Dry-run + serve + execute in one step. "
             "Generates report, waits for user decisions, then executes the merge.",
    )

    args = parser.parse_args()

    if not check_git_repo():
        print("error: not in a git repository", file=sys.stderr)
        sys.exit(1)

    # Execute mode
    if args.execute:
        execute_decisions(args.execute)
        return

    # Dry-run mode (default)
    branch = args.branch or get_current_branch()
    if not branch:
        print("error: cannot determine current branch", file=sys.stderr)
        sys.exit(1)

    upstream_ref = f"{args.upstream_remote}/{args.upstream_branch}"

    print(f"Analyzing: {branch} ← {upstream_ref}")

    # Fetch upstream
    if not fetch_upstream(args.upstream_remote):
        sys.exit(1)

    # Get merge base
    merge_base = get_merge_base(branch, upstream_ref)
    if not merge_base:
        print(f"error: no common ancestor between {branch} and {upstream_ref}", file=sys.stderr)
        sys.exit(1)

    print(f"  merge base: {merge_base[:12]}")

    # Get upstream HEAD
    rc, upstream_head, _ = run_git("rev-parse", upstream_ref)
    if rc != 0:
        print(f"error: cannot resolve {upstream_ref}", file=sys.stderr)
        sys.exit(1)

    # Changed files
    changed_files = get_changed_files(merge_base, upstream_ref, branch)
    local_changed = get_local_changed_files(merge_base, branch)

    print(f"  upstream changes: {len(changed_files)} files")

    # Detect conflicts via merge-tree or real merge
    print("  detecting conflicts...")
    repo_root = get_repo_root()
    conflicted_files, conflict_contents, _ = try_merge(branch, upstream_ref, repo_root)
    print(f"  conflicts: {len(conflicted_files)} files")

    # Build report
    report = build_report(
        branch=branch,
        upstream_remote=args.upstream_remote,
        upstream_branch=args.upstream_branch,
        merge_base=merge_base,
        upstream_head=upstream_head,
        changed_files=changed_files,
        local_changed=local_changed,
        conflicted_files=conflicted_files,
        conflict_contents=conflict_contents,
    )

    # Serve mode: render HTML, start server, block until user submits
    if args.interactive or args.serve is not None:
        port = args.serve if args.serve is not None else 0
        decisions = serve_and_block(report, args.output, port)
        print("\nDecisions received.")
        if args.interactive:
            # Write decisions to temp file and execute
            decisions_path = args.output.replace(".html", "-decisions.json")
            with open(decisions_path, "w", encoding="utf-8") as f:
                json.dump(decisions, f, indent=2)
            print(f"Executing merge...")
            execute_decisions(decisions_path)
        else:
            # Just output the decisions as JSON
            json.dump(decisions, sys.stdout, indent=2)
            print()
        return

    # Render HTML
    render_html(report, args.output)


if __name__ == "__main__":
    main()
