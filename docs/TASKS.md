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

- [ ] P4-1: Create `SettingsController` — `GET /settings/public`, `GET/PATCH /admin/settings`
- [ ] P4-2: Create `CVController` — `GET /cv`, `GET /cv/download`, `POST /admin/cv`
- [ ] P4-3: Create `ProfileLinksController` — `GET /profile-links`, `PATCH /admin/profile-links`
- [ ] P4-4: Create `DeletedUsersController` — `GET /admin/deleted-users`
- [ ] P4-5: Create `DashboardController` — `GET /admin/dashboard/metrics`, `GET /admin/dashboard/recalibration`
- [ ] P4-6: Add all Phase 4 routes to `api.php`
- [ ] P4-7: Write backend tests for all Phase 4 endpoints
- [ ] P4-8: Frontend — client dashboard (project list, project detail with milestones/contracts)
- [ ] P4-9: Frontend — admin panel (projects, contracts, payments management)
- [ ] P4-10: Frontend — admin settings, CV upload, profile links
- [ ] P4-11: Frontend — admin BI dashboard (metrics, recalibration)

## Phase 5 — Content & i18n

- [x] P5-1: Create models: BlogPost, BlogPostTranslation, BlogComment, PortfolioProject, PortfolioProjectTranslation, Testimonial
- [x] P5-2: Create `BlogController` — public `GET /blog/posts`, `GET /blog/posts/{slug}`
- [x] P5-3: Create `BlogAdminController` — full CRUD, featured_image upload, comment moderation
- [x] P5-4: Create `PortfolioController` — public `GET /portfolio`, `GET /portfolio/{slug}`
- [x] P5-5: Create `PortfolioAdminController` — full CRUD with translations
- [x] P5-6: Create `TestimonialController` — public `GET /testimonials`, `POST /testimonials`
- [x] P5-7: Create `TestimonialAdminController` — approve/reject actions
- [x] P5-8: Add all Phase 5 routes to `api.php`
- [x] P5-9: Write backend tests for blog, portfolio, testimonials
- [ ] P5-10: Frontend — set up `next-intl`, restructure pages under `[locale]`, create `messages/en.json` and `messages/es.json`
- [ ] P5-11: Frontend — public blog pages (list + detail)
- [ ] P5-12: Frontend — public portfolio pages (list + detail)
- [ ] P5-13: Frontend — testimonials component on public pages
- [ ] P5-14: Frontend — admin blog/portfolio/testimonial CRUD UI
- [ ] P5-15: Audit Phases 1-4 frontend for hardcoded strings, move to messages/

## Phase 6 — Chatbot & escalation

- [x] P6-1: Install `laravel/ai` package via Composer, publish config, configure Groq as an `openai-compatible` provider in `config/ai.php` with `GROQ_API_KEY`
- [x] P6-2: Run `php artisan install:broadcasting --reverb` to generate `config/broadcasting.php`, `routes/channels.php`, and update `.env.example` with Reverb variables
- [x] P6-3: Create `ChatbotConversation` and `ChatbotMessage` Eloquent models with relationships, casts, and fillable fields
- [x] P6-4: Create `Services/Chatbot/ChatbotService` — orchestrates Groq via `agent()` helper, manages conversation history, supports streaming
- [x] P6-5: Create `Events/ChatbotMessageStreamed.php` — `ShouldBroadcast` event with public channel per conversation, carries partial message chunks
- [x] P6-6: Create `ChatbotController` with `POST /chatbot/message` — creates conversation if needed (with `session_id` for anonymous), saves user message, calls AI SDK, broadcasts streamed response chunk by chunk via Reverb, saves assistant message
- [x] P6-7: Create `ChatbotController` with `POST /chatbot/escalate` — calls AI SDK to summarize conversation, saves `escalation_summary`/`escalation_channel`, sets `status = escalated`, returns `{ link }` (wa.me / t.me/username / mailto: with URL-encoded summary), fires `AdminEscalationNotification` regardless of channel
- [x] P6-8: Create `Notifications/AdminEscalationNotification.php` — mail notification to admin with conversation summary, client info, and escalation channel
- [x] P6-9: Create scheduled job `CloseStaleConversations` — marks conversations with no activity for N days as `closed`
- [x] P6-10: Add all Phase 6 routes to `api.php` (chatbot group)
- [x] P6-11: Add Reverb broadcasting environment variables to backend `.env.example` and frontend `.env.example`
- [x] P6-12: Frontend — install `laravel-echo` and `pusher-js`, configure Echo for Reverb, set `VITE_REVERB_*` in frontend `.env.example`
- [x] P6-13: Frontend — create ChatWidget component (floating button → chat panel → conversation display → message input), with Reverb event listener for streaming responses
- [x] P6-14: Frontend — create escalation channel picker UI (WhatsApp/Telegram/email buttons after bot can't help), editable summary text before sending
- [x] P6-15: Add chatbot i18n messages to `messages/en.json` and `messages/es.json`
- [x] P6-16: Write backend tests for chatbot message, escalation, stale conversation closing
- [x] P6-17: **Exit check:** 16 tests passing (53 assertions), 197 total (1072 assertions), `tsc --noEmit` clean, `npm run lint` 0 errors — visitor can start a chat session, receive streamed AI responses, and escalate to a human channel with prefilled summary; admin receives email notification on escalation

## Phase 7 — Design pass

- [x] P7-1: Configure CSS custom properties for all color tokens (dark + light mode per `STYLEGUIDE.md` §1), set up Tailwind v4 theme extension with `@theme` directive mapping to custom properties
- [x] P7-2: Load Space Grotesk, Inter, and JetBrains Mono via `next/font` (self-hosted) in root layout
- [x] P7-3: Create `glass-card` utility (full blur + gradient) and `glass-card--light` (vidrio liviano) as Tailwind-compatible class layers
- [x] P7-4: Add fixed-position mesh gradient background layer (multiple soft radial-gradients in palette hues) to the root layout
- [x] P7-5: Implement device-capability check (low-end Android detection) that auto-switches heavy glass → vidrio liviano
- [x] P7-6: Create light/dark mode toggle component with `prefers-color-scheme` detection, persisted preference (`localStorage`), and 0.5s CSS transitions on `background`/`border`/`box-shadow`
- [x] P7-7: Audit every existing page and component — apply glass surface tokens to cards/modals/panels, apply button/badge/form styles from `STYLEGUIDE.md` §4, ensure no hardcoded colors remain outside the token system
- [x] P7-8: Restyle the quote wizard specifically — each step as its own glass card, price/time numbers in JetBrains Mono, responsive container-query layout
- [x] P7-9: Apply `prefers-reduced-motion` (disable transitions entirely) and `forced-colors` fallback (solid background behind every `backdrop-filter`) across all components
- [x] P7-10: Verify WCAG AA contrast for every text/background pairing, especially glass surfaces; fix any failures
- [x] P7-11: Add `aria-label`/`sr-only` labels to every icon-only control (ChatWidget floating button, escalation channel icons, theme toggle)
- [x] P7-12: Full responsive pass — `dvh` units for full-height sections, container queries on service/category cards, fluid type verified across breakpoints
- [x] P7-13: E2E verify — toggle light/dark persists on reload, glass surfaces render in both modes, reduced-motion respected, keyboard-navigable

## Phase 8 — Launch readiness
*(High-level only)*

---

*Phases 2-8 stay at this level of detail — deliberately not fully broken down yet, per `PLAN.md`'s own note that granular detail gets added when a phase is actually next, not months in advance.*
