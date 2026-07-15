# TESTS.md — Testing Strategy & Definition of Done

**Complements `PROJECT_SPEC.md` v3.4, `ARCHITECTURE.md`, and `CONSTRAINTS.md`.**

---

## 1. Tools

- **Backend:** Pest (Laravel's preferred testing framework — expressive syntax, built on PHPUnit).
- **Frontend:** Vitest for unit/component tests, Playwright for end-to-end flows.
- **CI:** GitHub Actions runs the full suite on every pull request — a PR cannot merge with a failing suite (ties directly to the branch/PR workflow in `PROJECT_SPEC.md` section 25).

---

## 2. What must be tested (priority order — business-critical first)

1. **The quote calculation engine** (`Services/Quotes/`) — this is the single most consequential piece of business logic in the system. Every category/product-type/modifier combination that exists in seed data needs a test asserting the correct price and time range. A bug here directly costs or loses real money.
2. **Every `PaymentProvider` implementation** — signature verification (valid and invalid payloads), idempotency (duplicate `provider_transaction_id` is rejected), and the USD→BOB conversion math for `OpenBcbProvider` specifically (section 13 of `PROJECT_SPEC.md`).
3. **The contract snapshot mechanism** — a test that changes a `product_type`'s price *after* a contract exists and asserts the existing contract's `quote_snapshot` is unaffected. This is the kind of bug that's invisible until it silently isn't.
4. **The quarterly feedback-loop aggregation** (section 9) — specifically that `paused_days` and `scope_changed` correctly exclude affected projects from the comparison before any suggestion is generated.
5. **Role/permission boundaries** — a client cannot reach any `/admin/*` route; an unauthenticated visitor can use `/quotes/calculate` but not `/quotes/save`.
6. **The account deletion → anonymization pipeline** — a test that fast-forwards past the retention window and asserts personal fields are actually scrubbed while the row (and its relations) survive.
7. **i18n:** at minimum, a test confirming every UI string key used in a component exists in both `en.json` and `es.json` — a missing translation should fail CI, not surface as a blank label in production.

## 3. End-to-end (Playwright) — the flows that must never silently break

- Visitor completes the quote wizard anonymously and sees a real-time price.
- Registered client saves and later compares two quotes.
- Full contract lifecycle: draft generated → admin approves → client signs (Documenso sandbox/test mode) → payment requested only after signature.
- Each payment method's happy path, using each provider's sandbox/test mode — never live transactions in CI.

## 4. What *not* to over-test

Framework internals (don't test that Eloquent saves a model correctly — that's Laravel's own test suite's job), trivial getters/computed display formatting, and anything already covered by the structural protections noted in `SECURITY.md` section 5 (no need to write a bespoke SQL-injection test for every single query — that's what parameterized queries already guarantee).

---

## 5. Definition of Done

A task is not complete until **all** of the following are true — this is what the reviewer agent checks before approving a PR (`AGENTS.md`):

- [ ] Relevant tests written and passing (per the priority list above where applicable).
- [ ] No linter errors (PSR-12 backend, the frontend's configured ESLint rules).
- [ ] The implementation matches `DATA_MODEL.md`/`API_SPEC.md` exactly — no renamed fields, no undocumented endpoints introduced without updating those documents first.
- [ ] Commit message follows the convention in `PROJECT_SPEC.md` section 25.
- [ ] If the task involved a genuinely new architectural choice, it's recorded in `DECISIONS.md` before the PR is opened, not after.
- [ ] CI is green.
