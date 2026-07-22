---
name: github-base-finder
description: >
  Analyze a PRD (Product Requirements Document) and systematically search GitHub for mature open-source
  projects suitable as a development base. MUST use this skill whenever: a user mentions finding existing
  GitHub projects for secondary development (二开), evaluating open-source alternatives before building,
  searching for boilerplates/starter kits/frameworks to fork or extend, or wants to minimize reinventing
  the wheel for a new project. Also trigger when the user says "find a base project", "search GitHub for
  existing solutions", "is there an open-source project that...", "evaluate repos for this feature set",
  "compare GitHub projects", or describes requirements and asks whether something already exists.
  Covers the full pipeline: PRD decomposition → multi-strategy GitHub search → candidate evaluation →
  recommendation report with comparison matrix.
---

# GitHub Base Finder

Find the best GitHub project to use as a foundation for secondary development, based on a PRD or feature
description. The goal is to minimize wheel-reinventing by discovering mature, well-maintained projects
that already cover a significant portion of the required functionality.

## When to use this skill

- User has a PRD and wants to find an existing GitHub project to build on
- User asks "is there an open-source project for X?" where X is a complex feature set
- User wants to compare multiple GitHub projects before choosing a base
- User describes a product idea and wants to avoid building from scratch
- User says "找基座项目", "二开选型", "GitHub上有没有现成的"

## Workflow overview

```
1. DECOMPOSE  → Parse PRD into features, tech constraints, and search queries
2. DISCOVER   → Multi-strategy GitHub search using gh CLI
3. ENRICH     → Fetch detailed repo metadata for top candidates
4. EVALUATE   → Score candidates against PRD requirements
5. REPORT     → Comparison matrix + recommendation with justification
```

## Phase 1: DECOMPOSE — Parse the PRD

Read the PRD (from file, URL, or inline description) and extract:

### 1.1 Core features
List each distinct functional module. For a "project management SaaS" PRD:
```
- User authentication (OAuth, email/password)
- Project boards (Kanban, list view)
- Task management (CRUD, assign, label, due date)
- Team collaboration (comments, mentions, notifications)
- File attachments
- REST API
```

### 1.2 Technology constraints
Identify any hard requirements:
- Programming language(s)
- Framework (React, Vue, Django, etc.)
- Database (PostgreSQL, MongoDB, etc.)
- Deployment target (Docker, K8s, serverless)
- License requirements (MIT, Apache, GPL-compatible)

### 1.3 Search query generation
For each core feature module, generate 2-3 search queries that an existing project might match.
Combine feature terms with technology terms. Think about what the README or topics of a matching
project would contain.

Example for "project management with Kanban":
```
"project management kanban" + language:TypeScript
"task board" "team collaboration" language:TypeScript
"project management" topic:project-management stars:>100
```

### 1.4 Search filters
Decide on filters based on the PRD context:
- `--stars`: minimum star count (default 50, raise to 200+ for mature needs)
- `--language`: primary language
- `--updated`: last updated within (default: last year)
- `--limit`: max results per query (default 10)
- `--license`: license filter if specified

## Phase 2: DISCOVER — Search GitHub

Use the bundled `search.py` script to run all search queries.

```bash
# Single query search
python scripts/search.py search "project management kanban" --lang TypeScript --stars 100 --limit 10

# Batch search from a JSON file
python scripts/search.py batch queries.json --stars 50 --limit 10

# Find repos related to a known repo (by shared topics)
python scripts/search.py related OWNER/REPO --limit 10

# Awesome-list mining — find curated lists then extract mentioned repos
python scripts/search.py awesome "project management" --limit 5
```

### Search strategy

Run searches in this order, deduplicating results by repo full_name:

1. **Direct feature search** — Query each core feature with technology filters
2. **Topic search** — Use GitHub topics that match the domain (`topic:project-management`, `topic:kanban`)
3. **Related repos** — If a strong candidate is found, search for repos sharing its topics
4. **Awesome-list mining** — Search `awesome-<domain>` repos and extract linked projects

### Batch search file format

Save generated queries to a JSON file for batch execution:

```json
[
  {"query": "project management kanban", "label": "kanban feature"},
  {"query": "task board team collaboration", "label": "collaboration"},
  {"query": "project management", "label": "general PM", "topics": ["project-management"]}
]
```

Run with:
```bash
python scripts/search.py batch queries.json --lang TypeScript --stars 100 --limit 10
```

## Phase 3: ENRICH — Fetch detailed metadata

For the top candidates (typically 5-10 repos after deduplication), fetch detailed information:

```bash
python scripts/search.py detail OWNER/REPO
```

This returns:
- Description, homepage, topics
- Stars, forks, open issues count
- Last push date, creation date, release info
- Primary language, license
- Whether it's archived or a fork
- README excerpt (first 2000 chars)

### Disqualifying criteria

Immediately exclude repos that are:
- Archived
- Forks (unless the fork is more active than the original)
- Last updated > 18 months ago
- README is empty or < 200 chars (unless it's a well-known project)
- License incompatible with user's requirements

## Phase 4: EVALUATE — Score candidates

For each surviving candidate, produce a structured evaluation.

### Evaluation dimensions

| Dimension | Weight | What to check |
|-----------|--------|---------------|
| Feature coverage | 35% | How many PRD features does this cover out of the box? |
| Code quality | 15% | README quality, test presence, CI/CD, code organization |
| Community health | 15% | Stars, forks, contributor count, issue activity |
| Maintenance activity | 15% | Recent commits, release cadence, response to issues |
| Extensibility | 10% | Plugin system, modular architecture, documented API |
| Documentation | 10% | Docs site, examples, getting-started guide |

### Feature coverage scoring

For each PRD feature, rate:
- **3 (Full)** — Covered out of the box
- **2 (Partial)** — Partially covered or requires minor extension
- **1 (Extendable)** — Architecture supports it, needs custom development
- **0 (Missing)** — Not supported, would need fundamental changes

Coverage score = (sum of ratings) / (number of features × 3) × 100

### Output format

Save evaluations to `evaluations.md`:

```markdown
## OWNER/REPO — [Name]

**URL**: https://github.com/OWNER/REPO
**Stars**: X,XXX | **Forks**: XXX | **License**: MIT
**Last active**: 2 weeks ago | **Language**: TypeScript

### Feature coverage: XX%
| PRD Feature | Score | Notes |
|---|---|---|
| User auth (OAuth) | 3 | Full OAuth2 + email/password |
| Kanban boards | 3 | Built-in drag-and-drop |
| Task management | 2 | Basic CRUD, needs custom fields |
| Team collaboration | 1 | Comments only, no mentions |
| REST API | 3 | Full REST + GraphQL |

### Scores
| Dimension | Score | Notes |
|---|---|---|
| Feature coverage | 80% | 13/15 feature points |
| Code quality | 8/10 | Good README, tests present, CI |
| Community health | 7/10 | 2.5K stars, active issues |
| Maintenance | 9/10 | Commits this week, monthly releases |
| Extensibility | 6/10 | Plugin system but limited docs |
| Documentation | 7/10 | Docs site exists, some examples |

### Weighted total: XX/100
### Pros
- ...
### Cons
- ...
### Extension plan
- What needs to be built for secondary development
```

## Phase 5: REPORT — Final recommendation

After evaluating all candidates, produce a final report.

### Comparison matrix

```markdown
| Repo | Coverage | Quality | Community | Maintenance | Extensibility | Docs | **Total** |
|---|---|---|---|---|---|---|---|
| projectA/projectA | 80% | 8 | 7 | 9 | 6 | 7 | **78** |
| projectB/projectB | 65% | 9 | 9 | 8 | 8 | 9 | **77** |
| projectC/projectC | 55% | 7 | 6 | 5 | 7 | 6 | **60** |
```

### Recommendation

Pick the top candidate and explain:
1. **Why this one** — Specific strengths for secondary development
2. **What's already done** — Which PRD features are covered
3. **What needs building** — Gap analysis with estimated effort
4. **Extension strategy** — How to approach secondary development (fork vs plugin vs wrapper)
5. **Risks** — What could go wrong (bus factor, breaking changes, license issues)

### Alternative picks

If there are close contenders, note:
- When to pick #2 instead (different tradeoff)
- Hybrid approach (combine #1's core with #2's module)

## Script reference

The bundled `scripts/search.py` supports these commands:

| Command | Purpose | Example |
|---|---|---|
| `search` | Single query search | `search.py search "kanban board" --lang TS --stars 100` |
| `batch` | Multiple queries from JSON | `search.py batch queries.json --stars 50` |
| `detail` | Detailed repo metadata | `search.py detail OWNER/REPO` |
| `related` | Find repos with shared topics | `search.py related OWNER/REPO` |
| `awesome` | Mine awesome-lists | `search.py awesome "project management"` |

All commands output JSON to stdout. Use `--format markdown` for human-readable output.

Common flags:
- `--lang LANG` — Filter by language
- `--stars N` — Minimum star count
- `--limit N` — Max results (default 10)
- `--updated DAYS` — Updated within N days (default 365)
- `--license NAME` — Filter by license (mit, apache-2.0, gpl-3.0, etc.)
- `--format json|markdown` — Output format (default: json)
