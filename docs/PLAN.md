# PLAN.md — Phased Roadmap

**Complements `PROJECT_SPEC.md` v3.4.** Design is complete (that document and its companions); this is the build sequence. Each phase should reach a genuinely working, demoable state before the next begins — not a hard gate, but the intent. `TASKS.md` breaks the current and next phase into granular checkboxes; phases further out stay at this level of detail until they're actually next.

---

### Phase 0 — Scaffolding & infrastructure
Standard framework CLI installs (`laravel new backend`, `create-next-app frontend` — see the scaffolding note in `ARCHITECTURE.md` section 2 before touching folder structure by hand), full `docker-compose.yml` with all services from `ARCHITECTURE.md` section 4 running locally, GitHub repo created with branch protection on `main`, CI skeleton (lint + empty test run) green on a trivial commit.

### Phase 1 — Data layer & auth
Every migration from `DATA_MODEL.md`, in dependency order. Spatie Permission roles seeded. Sanctum configured. OAuth (Google/GitHub/Facebook) working end to end, including avatar import. 2FA for the admin role. This phase's exit test: a user can register, log in three different ways, and land in an empty dashboard.

### Phase 2 — Quote engine
The centerpiece feature. `service_categories`/`product_types`/`modifier_groups`/`modifiers` seeded with real data (all five categories from `PROJECT_SPEC.md` section 9, including the WordPress option and Technical Support). The calculation service, the real-time `/quotes/calculate` endpoint, the wizard UI, save/compare for registered users, the "next available start date" display, and the full admin CRUD for the quote structure itself (section 18). Exit test: a visitor can configure and see a live price/time range for every category without an account.

### Phase 3 — Contracts & payments
`PaymentProvider` implementations for all four methods, each webhook with signature verification and idempotency from day one (never added "later"). Documenso integration and the fixed draft → approve → sign → payment order. Partial payment support. Exit test: a full contract-to-paid-deposit cycle works in each provider's sandbox mode.

### Phase 4 — Client dashboard & admin panel
Project pipeline and milestones, client-facing progress view, admin project/lead/contract management, the deleted-accounts view, site `settings` management, CV upload. BI dashboard with precomputed metrics, including the quarterly feedback-loop suggestion view. Exit test: an admin can run the business end to end without touching the database directly.

### Phase 5 — Content & i18n
Blog (admin CRUD, translations, comments), portfolio (including this platform itself as a case study once far enough along to describe), testimonials. Full `next-intl` wiring across every page, not just the pages built so far — this is also the point to audit Phases 1-4's UI for hardcoded strings that should have been in `messages/`.

### Phase 6 — Chatbot & escalation
Groq integration via the Laravel AI SDK, streamed responses via Reverb. WhatsApp/Telegram/email escalation with the summarization step and the parallel admin email alert (`PROJECT_SPEC.md` section 14).

### Phase 7 — Design pass
This is deliberately its own phase, not something assumed to happen inline during Phases 1-6: full Liquid Glass application per `STYLEGUIDE.md`, light/dark mode across every screen built so far, the "vidrio liviano" performance fallback, and the full accessibility checklist — done as a dedicated pass so it doesn't get diluted piecemeal across six other phases' worth of feature pressure.

### Phase 8 — Launch readiness
SEO implementation (`PROJECT_SPEC.md` section 24), the full launch checklist (section 26), staging environment validation with seeded test data (`is_test` flag exercised end to end), and the quarterly feedback-loop reminder/alert confirmed working before the first real quarter can even complete.

---

**Deferred past this plan entirely** (per `PROJECT_SPEC.md` section 27): OpenCode multi-agent configuration specifics, final selection of any additional working documents beyond this set, chatbot backup providers, and loading real credentials — all explicitly reserved for the dedicated final pre-development session.
