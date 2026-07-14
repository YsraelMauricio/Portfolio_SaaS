# Portfolio_SaaS — Portfolio & Services Platform

**Repository/technical name:** `Portfolio_SaaS`. **Public-facing identity:** the author's own name, not this repo name (`PROJECT_SPEC.md` §22 — no separate brand) — this title is for developers and agents working in the codebase, it is not what a site visitor sees.

A full-stack platform combining a technical portfolio, blog, and an interactive quoting/contracting system for web, mobile, desktop, and technical support services — built by Ysrael Mauricio Lopez Rossel as both a working business and the flagship demonstration piece of that same business.

## Stack

Next.js 16 (frontend) · Laravel 13 (backend) · PostgreSQL · Redis · Docker Compose. Full list and rationale in `docs/PROJECT_SPEC.md` §3.

## Getting started

```bash
git clone git@github.com:YsraelMauricio/Portfolio_SaaS.git && cd Portfolio_SaaS
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
docker compose -f infra/docker-compose.yml up -d
docker compose exec backend php artisan migrate --seed
```

Frontend: `http://localhost:3000` · Backend API: `http://localhost:8000/api/v1` · Mailpit UI: `http://localhost:8025`.

See `docs/ARCHITECTURE.md` §2 before adding or reorganizing folders — the structure shown there is additive on top of each framework's own scaffolding, not a replacement for it.

## Documentation

Everything beyond this quick start lives in `docs/`, each file scoped to one concern:

| Document | What it covers |
|---|---|
| `PROJECT_SPEC.md` | The master specification — every product and architecture decision, start here for *what* this is |
| `ARCHITECTURE.md` | Folder structure, Docker services, code conventions, the `PaymentProvider` pattern |
| `DATA_MODEL.md` | Every table, field, and relationship — the source of truth for naming |
| `API_SPEC.md` | Every endpoint, grouped by domain |
| `STYLEGUIDE.md` | The "Índigo Profundo" design system — colors, type, the glass-surface recipe |
| `CONSTRAINTS.md` | The short list of things that are never up for reinterpretation |
| `DECISIONS.md` | Why things are the way they are — alternatives considered, reasoning |
| `SECURITY.md` | Implementation detail behind `PROJECT_SPEC.md`'s security section |
| `TESTS.md` | Testing strategy and Definition of Done |
| `PLAN.md` | The phased build roadmap |
| `TASKS.md` | The live, granular task checklist — check here for current project state |
| `AGENTS.md` | Multi-agent roles and handoff protocol |

If you're an agent picking up this project cold, read `AGENTS.md` §1 for the exact order.

## Status

Design phase complete. Repository created and connected via SSH (`git@github.com:YsraelMauricio/Portfolio_SaaS.git`), local folder in place — no commits yet. Build starts at `TASKS.md` P0-1.

## License / ownership

Proprietary. All rights reserved by the author.
