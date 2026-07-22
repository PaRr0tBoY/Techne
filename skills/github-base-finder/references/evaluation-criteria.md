# Evaluation Criteria Reference

How to score GitHub repositories as candidates for secondary development.

## Scoring dimensions

### 1. Feature coverage (35% weight)

The single most important factor. Map each PRD feature against the repo's actual capabilities.

| Score | Meaning | How to verify |
|-------|---------|---------------|
| 3 | Covered out of the box | Feature exists in README/docs, demo, or source |
| 2 | Partially covered | Foundation exists, needs configuration or minor extension |
| 1 | Extendable | Architecture supports it (plugin system, hook points), needs custom code |
| 0 | Missing | No support; would require fundamental changes |

Coverage % = (sum of scores) / (number of features × 3) × 100

**Common traps:**
- README claims a feature that's actually a stub or TODO — check the source
- Feature exists but is tightly coupled and hard to extend
- Feature exists in a fork/branch but not the main branch

### 2. Code quality (15% weight)

| Indicator | How to check |
|-----------|-------------|
| README quality | Length, structure, badges, screenshots, getting-started |
| Tests | Look for `test/`, `tests/`, `__tests__/`, `*_test.*`, `*.spec.*`, CI config |
| CI/CD | `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, etc. |
| Code organization | Clear directory structure, separation of concerns |
| Linting | `.eslintrc`, `.prettierrc`, `pyproject.toml` with lint config |

Score 1-10 based on overall impression. 8+ means production-ready quality.

### 3. Community health (15% weight)

| Indicator | Good sign | Warning sign |
|-----------|-----------|-------------|
| Stars | 1K+ for niche, 5K+ for general | <100 for established domain |
| Forks | >5% of stars | 0 or very few |
| Open issues | Active discussion, maintained | Hundreds of stale issues |
| Contributors | Multiple contributors | Single author, no response to PRs |
| Discussions | Active Q&A | No community interaction |

### 4. Maintenance activity (15% weight)

| Indicator | Good sign | Warning sign |
|-----------|-----------|-------------|
| Last commit | Within 3 months | >12 months ago |
| Release cadence | Regular releases | No releases or very old |
| Issue response | Maintainer responds within days | Issues ignored for months |
| Dependencies | Updated, no known CVEs | Outdated, security warnings |

### 5. Extensibility (10% weight)

Critical for secondary development. A project that covers 60% of features but is
easily extensible is often better than one covering 80% but with rigid architecture.

| Pattern | Score | Why |
|---------|-------|-----|
| Plugin/extension system | 3 | Designed for extension |
| Hook points / event system | 2 | Can intercept and customize |
| Modular architecture | 2 | Clean separation allows modification |
| Monolithic but clean code | 1 | Can refactor, but more work |
| Spaghetti / god objects | 0 | Hard to modify without breaking |

### 6. Documentation (10% weight)

| Indicator | Good sign | Warning sign |
|-----------|-----------|-------------|
| Docs site | Dedicated docs (Docusaurus, MkDocs, etc.) | Only README |
| API reference | Generated or hand-written API docs | No API docs |
| Examples | Working example projects | No examples |
| Getting started | Clear setup guide | Missing or broken setup instructions |
| Architecture docs | Design decisions documented | No architecture context |

## Red flags (automatic disqualification)

Any of these should exclude a repo immediately:

- **Archived** — No future maintenance
- **License incompatible** — Can't legally use as base
- **Abandoned** — No commits in 18+ months AND no active fork
- **Single-commit** — Proof of concept, not a real project
- **Empty README** — No documentation = no intent for others to use
- **Fork that's less active than original** — Use the original instead

## Green flags (bonus points)

These indicate a project is particularly well-suited for secondary development:

- Explicitly supports plugins/extensions (documented plugin API)
- Has "good first issue" labels and contributing guide
- Uses semantic versioning (breaking changes are predictable)
- Has migration guides between versions
- Monorepo with publishable packages (can cherry-pick modules)
- Has a Discord/Slack community for support
- Provides Docker images or Helm charts for easy deployment
