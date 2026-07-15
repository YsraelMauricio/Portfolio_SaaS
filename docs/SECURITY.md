# SECURITY.md — Security Implementation

**Complements `PROJECT_SPEC.md` v3.4** (section 17) and `CONSTRAINTS.md`. Where that section says *what*, this document says *how*.

---

## 1. Authentication

- **Password hashing:** Laravel's default (`bcrypt`, or `argon2id` if configured) — never a custom hashing scheme.
- **OAuth (Socialite):** request the minimum scope needed (email, basic profile, avatar) — never request extended permissions "in case they're useful later."
- **API tokens:** Sanctum, scoped per-device where relevant, revocable individually from the account's session list (not just a single global logout).
- **2FA (admin only, `CONSTRAINTS.md`):** TOTP-based (e.g. `pragmarx/google2fa-laravel` or equivalent), secret stored encrypted (`users.two_factor_secret`, already marked encrypted in `DATA_MODEL.md`). Enforced at the `Middleware` layer for every `/admin/*` route — not just checked at login, checked on every request to that route group.

---

## 2. Payment security

This is the highest-stakes surface in the system — real money, three different external providers.

- **Signature verification is mandatory before any other processing.** Each provider's SDK/documented method for verifying webhook authenticity runs first; a failed verification means the request is rejected and logged, never partially processed.
- **Idempotency:** `payments.provider_transaction_id` unique constraint (already in `DATA_MODEL.md`) is the actual enforcement mechanism — the application code checks for existence, but the database constraint is the real backstop if two requests race.
- **Exchange rate integrity (section 13 of `PROJECT_SPEC.md`):** `exchange_rate_used` is captured at the moment of charging and never recalculated retroactively — a payment's historical record must stay accurate even after the admin updates the rate for future transactions.
- **Manual confirmations** (`bank_transfer`) require the authenticated admin's ID (`confirmed_by_admin_id`) — never a system-level or shared-credential confirmation.
- **No payment amount ever originates from client-supplied input alone.** `amount_usd` for a project is derived from the signed contract's frozen snapshot, not re-read from a request body the browser could tamper with.
- **The same verify-signature-first principle applies outside payments too** — specifically `POST /webhooks/documenso` (a signing event, not a money event, but the same rule: reject and log on a failed signature, never partially process).

---

## 3. API-level protection

- **Rate limiting** (Laravel's built-in throttle middleware, exact figures in `API_SPEC.md` §11): `POST /auth/login` at 5/minute per IP (brute-force protection), `POST /quotes/calculate` at 60/minute per IP+session (legitimate frequent use, still bounded against scripted abuse).
- **CORS:** allow-list contains only the frontend's own domain(s) — no wildcard, no reflecting the request origin.
- **Validation:** every write endpoint uses a dedicated `FormRequest` (per `ARCHITECTURE.md` section 5) — never inline validation in a controller, which is easy to accidentally skip on one branch of logic.
- **Mass assignment:** every Eloquent model declares `$fillable` explicitly — never `$guarded = []`.

---

## 4. File uploads (Spatie Media Library collections)

- **Allow-list MIME types and max size per collection** — `cv` (PDF only), `avatar`/`payment_proof`/`blog_image`/`portfolio_image` (image types only, reasonable size caps).
- **Never trust the client-supplied file extension** — validate actual file content/MIME server-side.
- Files are served through the application (`GET /cv/download`, etc.), never a directly browsable public storage path that could expose the whole media directory structure.

---

## 5. Data protection

- **`.env` never committed** (`CONSTRAINTS.md`) — enforced by `.gitignore` from the first commit in each subfolder, not something to verify manually before each push.
- **Structural protections already provided by the stack** (stated explicitly, not just assumed): Eloquent's parameterized queries prevent SQL injection by default; React/JSX escapes output by default, preventing XSS — these are framework guarantees, not something each developer re-implements per query or per component.
- **Soft-delete → retention window → anonymization** (`PROJECT_SPEC.md` section 16, `DATA_MODEL.md` `users.anonymized_at`) is the only account-deletion path — never an immediate hard delete, never indefinite full-PII retention either.
- **Data export** (`GET /account/export`) returns only that authenticated user's own records — enforced at the query level (`where user_id = auth()->id()`), not by trusting a client-supplied user ID.

---

## 6. Infrastructure

- **HTTPS enforced everywhere**, no mixed content — HSTS header set once the domain and certificate are live.
- **Dependabot** active on the repository (`CONSTRAINTS.md`) — automatic PRs for known vulnerabilities in both `composer.json` and `package.json` dependencies.
- **Each support service (Umami, Listmonk, GlitchTip, Documenso) runs against its own isolated database** (`ARCHITECTURE.md` section 4) — a compromise or bug in any one of them has no path to the tables that hold client/financial data.
- **Backups** (checklist item, `PROJECT_SPEC.md` section 26): automated, and — this is the part that's easy to skip — periodically test-restored, not just generated and trusted blindly.

---

## 7. If something goes wrong

A short, practical checklist rather than a full incident-response plan (appropriate to this project's scale):
1. Rotate the specific credential/key suspected of compromise immediately — don't wait to confirm the breach first.
2. Check `payments` and `contracts` for the affected window for anything with `webhook_signature_verified = false` that shouldn't be there.
3. Notify any affected client before they'd discover it themselves — consistent with the trust-first positioning the whole platform is built on.
