# CONSTRAINTS.md — Non-negotiables

**Complements `PROJECT_SPEC.md` v3.4.** This is the short list every agent checks against before merging anything. If a task seems to require violating one of these, stop and flag it in `DECISIONS.md` rather than proceeding — none of these are style preferences, each one exists for a reason recorded in this project's planning.

## Architecture
- No paid SaaS or paid third-party API during development. Self-hosted/free/open-source only, until deployment.
- Laravel is the platform's own backend by default. Another technology (e.g. Node/Nest.js) is only introduced with a demonstrated, specific technical need — never for variety.
- Frontend and backend communicate exclusively through the versioned API (`/api/v1/...`). Never import code across that boundary.
- All table, field, and API route names are in **English** — no exceptions, even for business-domain concepts. See `DATA_MODEL.md`'s naming convention note.
- The quote engine's categories, product types, and modifiers live in the database, never hardcoded in application code — the whole point is that the admin can add a category like a future "AI Solutions" line without a deploy.

## Money and legal
- Every payment webhook must verify the provider's cryptographic signature **before** touching `Services/Payments/`, and check `provider_transaction_id` doesn't already exist before processing (idempotency). No exceptions, no "just for now."
- Fixed order, never inverted: quote accepted → contract generated as draft → admin approves send → client signs → **only then** is payment requested.
- Contracts store a frozen snapshot of price/scope/timeline at generation time. Never live-reference `quotes` or `product_types` after a contract exists.
- Source code is always included in the delivered price. Never a paid add-on.
- Never install, distribute, or facilitate access to unlicensed/pirated software as part of any service — the "Technical Support" category's software installation product assumes the client's own license, full stop. See `DECISIONS.md` for why this was explicitly rejected once already.
- Account deletion is soft-delete with a retention window read from `settings.account_retention_days` (default 60) — never a hardcoded range, and never an immediate hard delete or indefinite full-data retention either.
- `is_test` on `quotes`/`projects`/`payments`/`contracts` defaults to `false`; every BI query filters `is_test = false` unless explicitly asked not to.

## Access and safety
- 2FA is required for the `admin` role. No other role needs it, but admin is not optional.
- CORS allows only the frontend's own domain.
- `.env` is never committed. Only `.env.example` with variable names.
- Rate limiting on `POST /auth/login` (brute-force) and `POST /quotes/calculate` (abuse of a legitimately frequent public endpoint) is mandatory, not a "nice to have."

## Content and market
- English is the primary site language, Spanish secondary — everywhere, not just the blog, from launch.
- The "Technical Support" category (hardware maintenance, software installation) is Bolivia-only. It stays visible to everyone with a clear label, never geo-blocked — international visitors self-select out.
- Prices display in USD only. The BOB conversion used to generate a QR payment amount is an internal calculation at payment time, never shown as a second price on the site.

## Process
- One commit per verified sub-task (tests pass, build not broken). One branch per task. No direct commits to `main`.
- Every `.md` working document is committed to the repository — this is documentation, not a secret.
- `TASKS.md`, `DECISIONS.md`, and `PLAN.md` are the project's real persistent memory across agent sessions — read them before assuming context from a chat history that may not exist in a new session.
