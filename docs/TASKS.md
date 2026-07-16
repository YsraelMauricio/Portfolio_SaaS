# TASKS.md — Live Task Checklist

**Complements `PLAN.md`.** This is a working document — agents update it as tasks complete, don't wait for a human to do it. Each task ID is `P{phase}-{number}`. A task is checked only when its commit has actually landed and passed review (`TESTS.md` Definition of Done) — never marked done in anticipation.

> **For any agent starting a new session:** read this file, `DECISIONS.md`, and `PLAN.md` before assuming anything about project state from conversation history, which may not exist in your context. This is the project's real persistent memory (`PROJECT_SPEC.md` section 25).

---

## Phase 0 — Scaffolding & infrastructure

- [x] P0-1: `laravel new backend` — PHP 8.5.8 confirmed, Laravel 13.20.0 installed via `composer create-project` (`feat(backend): scaffold Laravel project v13.20.0`)
- [x] P0-2: `create-next-app frontend` — Next.js 16.2.10, App Router, TypeScript, Tailwind, ESLint flat config, npm (`feat(frontend): scaffold Next.js project v16.2.10 with App Router / TypeScript / Tailwind`)
- [x] P0-3: `infra/docker-compose.yml` with all services from `ARCHITECTURE.md` §4 — `frontend`, `backend`, `postgres`, `redis`, `reverb`, `queue-worker`, `scheduler`, `nginx`. `postgres` uses `POSTGRES_USER=portfolio_saas`, not `postgres`. Dockerfiles for backend (php:8.3-fpm) and frontend (node:22-alpine) created. (`feat(infra): add docker-compose.yml with core services`)
- [x] P0-4: Add support-service containers with their own isolated databases — `umami`, `listmonk`, `glitchtip`, `documenso`, `mailpit`
- [x] P0-5: Root-level `.gitignore` for monorepo-wide concerns only (`ARCHITECTURE.md` §2) — confirmed each subfolder's own `.gitignore` from scaffolding is untouched
- [x] P0-6: `.env.example` in both `frontend/` and `backend/` with every variable name this project will eventually need, no real values
- [x] P0-7a: GitHub repo created (private) at `github.com/YsraelMauricio/Portfolio_SaaS`, local folder connected via SSH remote — done, no commits yet
- [x] P0-7b: Branch protection on `main` requiring PR + passing CI (`fix(infra): resolve docker-compose port conflicts, SELinux mount, nginx upstream, reverb dep, and CI PHP version`)
- [x] P0-8: CI skeleton (`.github/workflows/`) — backend (Pint + PHPUnit) and frontend (ESLint + TypeScript + build) jobs, green on merge to main
- [x] P0-9: `docker-compose up` brings all 17 services without error — port conflicts (nginx/reverb both on 8080) resolved, SELinux bind-mount permissions fixed, nginx upstream config fixed, Reverb dependency installed, PHP 8.4 aligned across Docker/CI/composer (`feat/p0-9-fixes` → PR #7 merged)

## Phase 1 — Data layer & auth

- [x] P1-1: Migration for `users` + `oauth_providers` (`DATA_MODEL.md` §1)
- [x] P1-2: Spatie Permission installed, migrated, three roles seeded (`visitor` implicit, `client`, `admin`)
- [x] P1-3: Spatie Media Library installed, migrated
- [x] P1-4: Migrations for the quote-engine tables (`service_categories` through `price_change_history`, `DATA_MODEL.md` §2)
- [x] P1-5: Migrations for `projects` → `contracts` → `payments`, **in that exact order** (`DATA_MODEL.md` §3)
- [x] P1-6: Migrations for maintenance, content, config, chatbot tables (`DATA_MODEL.md` §4-7)
- [x] P1-7: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/user`
- [x] P1-8: OAuth for Google, GitHub, Facebook — redirect + callback, avatar import into `media`
- [x] P1-9: Email/password fallback avatar — initials-based generation (`PROJECT_SPEC.md` §8)
- [x] P1-10: 2FA enrollment + verification, enforced via middleware on `/admin/*` — rate limiting on login, CORS config, OAuth state validation, SSRF protection on avatar import
- [x] P1-11: `DELETE /account` (soft-delete) + the scheduled anonymization job (`anonymized_at`) — 5 tests covering deletion and anonymization pipeline
- [x] P1-12: `GET /account/export`
- [x] Exit check: 28 tests covering register, login (with rate limit), logout, 2FA, account deletion, anonymization (`feat/phase-1-data-layer-auth` → PR #9 merged)

## Phase 2 — Quote engine

- [x] Seed all five categories with real product types and modifiers (Web incl. WordPress, Mobile, Desktop, Maintenance & modifications, Technical Support)
- [x] `Services/Quotes/` calculation engine + `POST /quotes/calculate`
- [x] Quote wizard UI, real-time price/time display
- [x] Save/compare, next-available-date display
- [x] Full admin CRUD for categories/product-types/modifier-groups/modifiers (`feat/phase-2-quote-engine` → PR #11 merged)

## Phase 3 — Contracts & payments

- [x] P3-1: Create `Payment` Eloquent model with fillable fields, casts, and relationships
- [x] P3-2: Create `Services/Payments/PaymentProvider.php` interface
- [x] P3-3/4/5/6: Implement OpenBcbProvider, BinancePayProvider, PaypalProvider, BankTransferProvider
- [x] P3-7: Create `ContractController` — draft, approve-send, cancel, view
- [x] P3-8: Create `ProjectController` — list, view, update, milestones, pause-clock
- [x] P3-9: Create `PaymentController` — initiate, proof upload, confirm
- [x] P3-10: Create Documenso webhook handler + `POST /webhooks/documenso`
- [x] P3-11: Add all Phase 3 routes to `api.php`
- [x] P3-12/13: 41 tests covering contracts, payments, projects, webhooks (115 total, 836 assertions)
- [x] **Exit check:** All webhooks verify signature before processing; idempotency via `provider_transaction_id` unique constraint; contract→pay order is fixed (never inverted); bank transfer confirmation is manual-only

## Phase 4 — Client dashboard & admin panel
*(High-level only)*

## Phase 5 — Content & i18n
*(High-level only)*

## Phase 6 — Chatbot & escalation
*(High-level only)*

## Phase 7 — Design pass
*(High-level only)*

## Phase 8 — Launch readiness
*(High-level only)*

---

*Phases 2-8 stay at this level of detail — deliberately not fully broken down yet, per `PLAN.md`'s own note that granular detail gets added when a phase is actually next, not months in advance.*
