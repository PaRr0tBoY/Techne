#!/usr/bin/env python3
"""GitHub repository search and evaluation tool for github-base-finder skill.

Usage:
    python search.py search "query" --lang TypeScript --stars 100
    python search.py batch queries.json --stars 50 --limit 10
    python search.py detail OWNER/REPO
    python search.py related OWNER/REPO --limit 10
    python search.py awesome "domain" --limit 5
"""

import argparse
import base64
import json
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone


def run_gh(args: list[str], timeout: int = 30) -> str:
    """Run a gh CLI command and return stdout."""
    cmd = ["gh"] + args
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True,
            timeout=timeout, encoding="utf-8", errors="replace",
        )
        if result.returncode != 0:
            raise RuntimeError(f"gh {args[0]} failed: {result.stderr.strip()}")
        return result.stdout
    except FileNotFoundError:
        raise RuntimeError("gh CLI not found. Install from https://cli.github.com/")
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"gh {args[0]} timed out after {timeout}s")


def _normalize_search_repo(r: dict) -> dict:
    """Normalize gh search repos fields to a common format."""
    lang = r.get("language")
    lic = r.get("license")
    return {
        "fullName": r.get("fullName", ""),
        "description": r.get("description", ""),
        "stars": r.get("stargazersCount", 0),
        "forks": r.get("forksCount", 0),
        "language": lang if isinstance(lang, str) else (lang or {}).get("name", ""),
        "updatedAt": r.get("updatedAt", ""),
        "createdAt": r.get("createdAt", ""),
        "url": r.get("url", ""),
        "license": lic.get("name", "") if isinstance(lic, dict) else (lic or ""),
        "isArchived": r.get("isArchived", False),
        "isFork": r.get("isFork", False),
    }


def _normalize_view_repo(r: dict) -> dict:
    """Normalize gh repo view fields to a common format."""
    lang = r.get("primaryLanguage")
    lic = r.get("licenseInfo")
    topics = r.get("repositoryTopics", [])
    topic_names = [t.get("name", "") for t in topics if isinstance(t, dict)]
    watchers = r.get("watchers")
    return {
        "fullName": r.get("nameWithOwner", ""),
        "description": r.get("description", ""),
        "stars": r.get("stargazerCount", 0),
        "forks": r.get("forkCount", 0),
        "language": (lang or {}).get("name", "") if isinstance(lang, dict) else "",
        "updatedAt": r.get("updatedAt", ""),
        "createdAt": r.get("createdAt", ""),
        "url": r.get("url", ""),
        "homepageUrl": r.get("homepageUrl", ""),
        "license": (lic or {}).get("name", "") if isinstance(lic, dict) else "",
        "isArchived": r.get("isArchived", False),
        "isFork": r.get("isFork", False),
        "topics": topic_names,
        "watchers": (watchers or {}).get("totalCount", 0) if isinstance(watchers, dict) else 0,
    }


def search_repos(query: str, lang: str = None, stars: int = None,
                 limit: int = 10, updated_days: int = 365,
                 license_name: str = None) -> list[dict]:
    """Search GitHub repositories with filters."""
    parts = [query]
    if lang:
        parts.append(f"language:{lang}")
    if stars:
        parts.append(f"stars:>={stars}")
    if updated_days:
        cutoff = datetime.now(timezone.utc) - timedelta(days=updated_days)
        parts.append(f"pushed:>={cutoff.strftime('%Y-%m-%d')}")
    if license_name:
        parts.append(f"license:{license_name}")

    full_query = " ".join(parts)
    args = [
        "search", "repos", full_query,
        "--limit", str(limit),
        "--json", "fullName,description,stargazersCount,forksCount,"
                   "language,updatedAt,createdAt,url,license,"
                   "isArchived,isFork",
        "--sort", "stars",
        "--order", "desc",
    ]
    output = run_gh(args)
    repos = json.loads(output)
    return [_normalize_search_repo(r) for r in repos
            if not r.get("isArchived") and not r.get("isFork")]


def get_detail(owner_repo: str) -> dict:
    """Get detailed metadata for a repository."""
    output = run_gh([
        "repo", "view", owner_repo,
        "--json", "nameWithOwner,description,stargazerCount,forkCount,"
                   "primaryLanguage,updatedAt,createdAt,url,licenseInfo,"
                   "isArchived,isFork,repositoryTopics,homepageUrl,"
                   "watchers,defaultBranchRef",
    ])
    raw = json.loads(output)
    repo = _normalize_view_repo(raw)

    # Get README excerpt
    try:
        readme_b64 = run_gh([
            "api", f"repos/{owner_repo}/readme", "--jq", ".content",
        ], timeout=10)
        readme_text = base64.b64decode(readme_b64.strip()).decode("utf-8", errors="replace")
        repo["readme_excerpt"] = readme_text[:2000]
        repo["readme_length"] = len(readme_text)
    except Exception:
        repo["readme_excerpt"] = ""
        repo["readme_length"] = 0

    # Get latest release
    try:
        release = run_gh([
            "api", f"repos/{owner_repo}/releases/latest",
            "--jq", "{tag: .tag_name, date: .published_at, name: .name}",
        ], timeout=10)
        repo["latest_release"] = json.loads(release)
    except Exception:
        repo["latest_release"] = None

    # Get open issues count via API
    try:
        issues_json = run_gh([
            "api", f"repos/{owner_repo}", "--jq", ".open_issues_count",
        ], timeout=10)
        repo["openIssues"] = int(issues_json.strip())
    except Exception:
        repo["openIssues"] = None

    return repo


def find_related(owner_repo: str, limit: int = 10) -> list[dict]:
    """Find repos sharing topics with the given repo."""
    output = run_gh([
        "repo", "view", owner_repo, "--json", "repositoryTopics",
    ])
    data = json.loads(output)
    topics = [t.get("name", "") for t in data.get("repositoryTopics", [])
              if isinstance(t, dict)]

    if not topics:
        return []

    topic_query = " ".join(f"topic:{t}" for t in topics[:3])
    args = [
        "search", "repos", topic_query,
        "--limit", str(limit + 5),
        "--json", "fullName,description,stargazersCount,forksCount,"
                   "language,updatedAt,url,license,isArchived,isFork",
        "--sort", "stars",
        "--order", "desc",
    ]
    output = run_gh(args)
    repos = json.loads(output)
    return [_normalize_search_repo(r) for r in repos
            if not r.get("isArchived")
            and not r.get("isFork")
            and r.get("fullName") != owner_repo][:limit]


def mine_awesome(domain: str, limit: int = 5) -> list[dict]:
    """Find awesome-list repos for a domain and extract mentioned repos."""
    query = f"awesome {domain} in:name,readme topic:awesome"
    awesome_repos = search_repos(query, limit=limit, stars=50)

    results = []
    for repo in awesome_repos:
        name = repo.get("fullName", "")
        try:
            readme_b64 = run_gh([
                "api", f"repos/{name}/readme", "--jq", ".content",
            ], timeout=10)
            text = base64.b64decode(readme_b64.strip()).decode("utf-8", errors="replace")
            pattern = r'https?://github\.com/([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)'
            links = list(set(re.findall(pattern, text)))
            results.append({
                "awesome_list": name,
                "awesome_stars": repo.get("stars", 0),
                "linked_repos": links[:30],
            })
        except Exception:
            continue

    return results


def batch_search(queries_file: str, lang: str = None, stars: int = None,
                 limit: int = 10, updated_days: int = 365,
                 license_name: str = None) -> dict:
    """Run multiple search queries and aggregate results."""
    with open(queries_file, "r", encoding="utf-8") as f:
        queries = json.load(f)

    seen = set()
    all_results = []

    for q in queries:
        query_text = q.get("query", "")
        label = q.get("label", query_text)
        extra_topics = q.get("topics", [])
        topic_part = " ".join(f"topic:{t}" for t in extra_topics)
        full_query = f"{query_text} {topic_part}".strip()

        try:
            results = search_repos(
                full_query, lang=lang, stars=stars,
                limit=limit, updated_days=updated_days,
                license_name=license_name,
            )
            for r in results:
                name = r.get("fullName", "")
                if name and name not in seen:
                    seen.add(name)
                    r["_search_label"] = label
                    all_results.append(r)
        except Exception as e:
            all_results.append({"error": str(e), "query": query_text, "_search_label": label})

    all_results.sort(key=lambda r: r.get("stars", 0), reverse=True)
    return {
        "total_unique": len([r for r in all_results if "fullName" in r]),
        "queries_run": len(queries),
        "results": all_results,
    }


def format_markdown(data, title: str = "Search Results") -> str:
    """Format results as markdown."""
    # List of repos (search/related results)
    if isinstance(data, list) and data and "fullName" in data[0]:
        lines = [f"# {title}\n"]
        for i, r in enumerate(data, 1):
            name = r.get("fullName", "?")
            stars = r.get("stars", 0)
            desc = r.get("description", "No description")
            lang = r.get("language", "?")
            url = r.get("url", "")
            updated = r.get("updatedAt", "")
            label = r.get("_search_label", "")

            lines.append(f"## {i}. {name}")
            if label:
                lines.append(f"**Search**: {label}")
            lines.append(f"**URL**: {url}")
            lines.append(f"**Stars**: {stars:,} | **Language**: {lang} | **Updated**: {updated[:10] if updated else '?'}")
            lines.append(f"**Description**: {desc}")
            topics = r.get("topics", [])
            if topics:
                lines.append(f"**Topics**: {', '.join(topics)}")
            lic = r.get("license", "")
            if lic:
                lines.append(f"**License**: {lic}")
            lines.append("")
        return "\n".join(lines)

    # Single repo detail
    elif isinstance(data, dict) and "fullName" in data and "readme_excerpt" in data:
        r = data
        lines = [f"# {r['fullName']}\n"]
        lines.append(f"**URL**: {r.get('url', '')}")
        lines.append(f"**Description**: {r.get('description', 'No description')}")
        lines.append(f"**Stars**: {r.get('stars', 0):,} | **Forks**: {r.get('forks', 0):,}")
        lines.append(f"**Language**: {r.get('language', '?')}")
        if r.get("openIssues") is not None:
            lines.append(f"**Open issues**: {r['openIssues']}")
        if r.get("license"):
            lines.append(f"**License**: {r['license']}")
        lines.append(f"**Created**: {(r.get('createdAt') or '')[:10]}")
        lines.append(f"**Last push**: {(r.get('updatedAt') or '')[:10]}")
        if r.get("homepageUrl"):
            lines.append(f"**Homepage**: {r['homepageUrl']}")
        rel = r.get("latest_release")
        if rel:
            lines.append(f"**Latest release**: {rel.get('tag', '?')} ({(rel.get('date') or '')[:10]})")
        if r.get("topics"):
            lines.append(f"**Topics**: {', '.join(r['topics'])}")
        if r.get("readme_excerpt"):
            lines.append(f"\n## README excerpt\n```\n{r['readme_excerpt'][:1000]}\n```")
        return "\n".join(lines)

    # Batch results
    elif isinstance(data, dict) and "total_unique" in data:
        lines = [f"# {title}\n"]
        lines.append(f"**Queries run**: {data['queries_run']}")
        lines.append(f"**Unique repos found**: {data['total_unique']}\n")
        for i, r in enumerate(data.get("results", []), 1):
            if "error" in r:
                lines.append(f"**Error** ({r.get('_search_label', '?')}): {r['error']}")
                continue
            name = r.get("fullName", "?")
            stars = r.get("stars", 0)
            desc = (r.get("description") or "")[:100]
            lang = r.get("language", "?")
            label = r.get("_search_label", "")
            lines.append(f"{i}. **{name}** ({stars:,} stars, {lang}) — {desc}")
            if label:
                lines.append(f"   Search: {label}")
        return "\n".join(lines)

    return json.dumps(data, indent=2, ensure_ascii=False)


def main():
    parser = argparse.ArgumentParser(description="GitHub repo search tool")
    sub = parser.add_subparsers(dest="command")

    p = sub.add_parser("search", help="Search repos")
    p.add_argument("query", help="Search query")
    p.add_argument("--lang", help="Language filter")
    p.add_argument("--stars", type=int, help="Minimum stars")
    p.add_argument("--limit", type=int, default=10, help="Max results")
    p.add_argument("--updated", type=int, default=365, help="Updated within N days")
    p.add_argument("--license", help="License filter")
    p.add_argument("--format", choices=["json", "markdown"], default="json")

    p = sub.add_parser("batch", help="Batch search from JSON file")
    p.add_argument("file", help="JSON file with queries")
    p.add_argument("--lang", help="Language filter")
    p.add_argument("--stars", type=int, help="Minimum stars")
    p.add_argument("--limit", type=int, default=10, help="Max results per query")
    p.add_argument("--updated", type=int, default=365, help="Updated within N days")
    p.add_argument("--license", help="License filter")
    p.add_argument("--format", choices=["json", "markdown"], default="json")

    p = sub.add_parser("detail", help="Get repo details")
    p.add_argument("repo", help="owner/repo")
    p.add_argument("--format", choices=["json", "markdown"], default="json")

    p = sub.add_parser("related", help="Find related repos")
    p.add_argument("repo", help="owner/repo")
    p.add_argument("--limit", type=int, default=10, help="Max results")
    p.add_argument("--format", choices=["json", "markdown"], default="json")

    p = sub.add_parser("awesome", help="Mine awesome-lists")
    p.add_argument("domain", help="Domain to search")
    p.add_argument("--limit", type=int, default=5, help="Max awesome-lists")
    p.add_argument("--format", choices=["json", "markdown"], default="json")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        sys.exit(1)

    try:
        if args.command == "search":
            results = search_repos(
                args.query, lang=args.lang, stars=args.stars,
                limit=args.limit, updated_days=args.updated,
                license_name=args.license,
            )
            out = format_markdown(results, f'Search: {args.query}') if args.format == "markdown" else json.dumps(results, indent=2, ensure_ascii=False)
            print(out)

        elif args.command == "batch":
            results = batch_search(
                args.file, lang=args.lang, stars=args.stars,
                limit=args.limit, updated_days=args.updated,
                license_name=args.license,
            )
            out = format_markdown(results, "Batch Search Results") if args.format == "markdown" else json.dumps(results, indent=2, ensure_ascii=False)
            print(out)

        elif args.command == "detail":
            result = get_detail(args.repo)
            out = format_markdown(result) if args.format == "markdown" else json.dumps(result, indent=2, ensure_ascii=False)
            print(out)

        elif args.command == "related":
            results = find_related(args.repo, limit=args.limit)
            out = format_markdown(results, f'Related to {args.repo}') if args.format == "markdown" else json.dumps(results, indent=2, ensure_ascii=False)
            print(out)

        elif args.command == "awesome":
            results = mine_awesome(args.domain, limit=args.limit)
            if args.format == "markdown":
                lines = [f"# Awesome lists: {args.domain}\n"]
                for r in results:
                    lines.append(f"## {r['awesome_list']} ({r['awesome_stars']:,} stars)")
                    for link in r.get("linked_repos", [])[:15]:
                        lines.append(f"- https://github.com/{link}")
                    lines.append("")
                print("\n".join(lines))
            else:
                print(json.dumps(results, indent=2, ensure_ascii=False))

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
