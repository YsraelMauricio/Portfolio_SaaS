# API_SPEC.md — API Specification

**Complements `PROJECT_SPEC.md` v3.1 and `DATA_MODEL.md`.** All routes under `/api/v1/`. Standard JSON response shape across every endpoint:
```json
{ "data": {}, "meta": {}, "errors": [] }
```
Authentication via **Laravel Sanctum** (Bearer token). Endpoints marked 🔒 require an authenticated session; 🔒👑 additionally require the `admin` role; unmarked = public.

---

## 1. Authentication

| Method | Route | Notes |
|---|---|---|
| POST | `/auth/register` | `{ name, email, password }` |
| POST | `/auth/login` | `{ email, password }` → `{ token, user }` |
| POST | `/auth/logout` | 🔒 |
| GET | `/auth/user` | 🔒 Current user |
| GET | `/auth/{provider}/redirect` | `provider` = `google`\|`github`\|`facebook` |
| GET | `/auth/{provider}/callback` | Creates/links the user, imports avatar into `media` (`avatar` collection) |
| POST | `/auth/2fa/enable` | 🔒👑 Admin only — generates a TOTP secret |
| POST | `/auth/2fa/verify` | 🔒👑 `{ code }` |
| DELETE | `/account` | 🔒 Soft-delete — sets `users.deleted_at`. Optional body `{ exit_survey_reason }` |
| GET | `/account/export` | 🔒 Returns JSON with all of the user's `quotes`, `projects`, `contracts` (data portability, section 16 of `PROJECT_SPEC.md`) |

---

## 2. Quote engine

| Method | Route | Notes |
|---|---|---|
| GET | `/quotes/categories` | Lists active `service_categories` |
| GET | `/quotes/product-types?category_id=` | Lists `product_types` for that category |
| GET | `/quotes/modifiers?product_type_id=` | Grouped by `modifier_groups`, with their `modifiers` |
| GET/POST/PATCH | `/admin/quotes/categories` | 🔒👑 Full management of `service_categories` — creating a new one (e.g. a future "AI Solutions" line) needs nothing beyond this endpoint, no code or deploy |
| GET/POST/PATCH | `/admin/quotes/product-types` | 🔒👑 Full management of `product_types`, including `base_price_usd`/`base_days_min`/`base_days_max`. A "package" (e.g. general hardware maintenance, section 9 of `PROJECT_SPEC.md`) is just a `product_type` with a bundled description — no separate mechanism |
| GET/POST/PATCH | `/admin/quotes/modifier-groups` | 🔒👑 Full management of `modifier_groups` |
| GET/POST | `/admin/quotes/modifiers` | 🔒👑 List and create `modifiers` |
| PATCH | `/admin/quotes/modifiers/{id}` | 🔒👑 Changing `price_impact_usd` or `time_impact_days` automatically creates a row in `price_change_history` — never overwritten without leaving a trail. This is the endpoint the quarterly feedback-loop suggestion (section 9) calls when the admin accepts a suggested adjustment |

**None of the four admin endpoints above ever issue a hard `DELETE`.** "Removing" a category, product type, group, or modifier is a `PATCH` setting `active: false` — a hard delete would orphan every historical `quote`/`quote_modifiers` row that already references it. Deactivated rows simply stop appearing in the public `GET` endpoints above, but stay intact for anything already quoted or contracted.
| POST | `/quotes/calculate` | No auth — real-time calculation. Body: `{ product_type_id, modifier_ids: [] }` → `{ estimated_price_min, estimated_price_max, estimated_days_min, estimated_days_max }`. **Same field names as the `quotes` table** in `DATA_MODEL.md` on purpose — when `/quotes/save` is called afterward, it's the same object, no renaming needed. Must respond in <300ms — without this, the "real time" requirement of the quote engine (section 9) isn't met. |
| GET | `/quotes/next-available-start-date` | Reads from `settings` (value editable by admin) — never calculated live against `projects` on every request |
| POST | `/quotes/save` | 🔒 Persists as a row in `quotes` + `quote_modifiers` |
| GET | `/quotes/mine` | 🔒 Client sees their own, to compare |
| POST | `/quotes/{id}/send-as-lead` | 🔒 Changes `status` to `sent_as_lead`, triggers a notification to admin |

---

## 3. Projects and contracts

| Method | Route | Notes |
|---|---|---|
| GET | `/projects` | 🔒 Client sees their own; admin sees all (with `?is_test=false` filter by default) |
| GET | `/projects/{id}` | 🔒 Includes `project_milestones` |
| PATCH | `/admin/projects/{id}` | 🔒👑 `{ status?, scope_changed? }` — partial update, both fields optional. Moving `status` to `delivered` sets `actual_delivery_date` (feeds the feedback loop, section 9); `cancelled` is a valid target from any non-terminal status. Setting `scope_changed: true` is what excludes this project from the quarterly feedback-loop comparison — this is the endpoint that field lives behind, there is no separate one |
| POST | `/admin/projects/{id}/milestones` | 🔒👑 |
| PATCH | `/admin/projects/{id}/pause-clock` | 🔒👑 Increments `paused_days` while waiting on the client |
| POST | `/admin/contracts` | 🔒👑 `{ project_id, quote_snapshot_override? }` — generates a `contracts` row with `status: draft`. If `project.quote_id` is present, `quote_snapshot` is copied automatically from that quote; if it's null (the custom-project path, `DATA_MODEL.md` §3), there's nothing to copy from, so `quote_snapshot_override` is **required** in that case, matching the exact shape defined for `quote_snapshot` in `DATA_MODEL.md` §3 — not a free-form object. **Does not trigger sending or payment.** |
| POST | `/admin/contracts/{id}/approve-send` | 🔒👑 Moves to `sent`, creates the document in Documenso, sends the email with the signing guide (section 11) |
| PATCH | `/admin/contracts/{id}/cancel` | 🔒👑 Valid from `draft`, `approved_pending_send`, or `sent` — not from `signed` (a signed contract is cancelled through the cancellation/refund process in section 11 of `PROJECT_SPEC.md`, not this endpoint) |
| GET | `/contracts/{id}` | 🔒 Client views their own — response includes a temporary signed URL to the PDF served from `media` (`contract_pdf` collection), not a bare stored path |
| POST | `/webhooks/documenso` | Webhook fired by Documenso on signing — **verify the payload's cryptographic signature before processing** (section 17). On confirmed signature: `status → signed`, calculates `confirmed_delivery_date` against the real current queue of `projects`, and **only then** triggers the payment request (section 11 — the order is fixed, never invert it) |

---

## 4. Payments

| Method | Route | Notes |
|---|---|---|
| POST | `/payments/initiate` | 🔒 `{ project_id, method, amount_usd, exchange_rate_override? }` → for `qr_bcb`, converts `amount_usd` to BOB using the current `exchange_rates` value (or `exchange_rate_override` if the admin set one for this specific client), rounds per section 13 of `PROJECT_SPEC.md`, returns the QR with that BOB amount; for `binance_pay`/`paypal`, returns a checkout link with no conversion (already USD); for `bank_transfer`, returns instructions in whichever `local_currency` the admin's account is set up for |
| POST | `/webhooks/payments/paypal` | Verify webhook signature → if `provider_transaction_id` already exists in `payments`, **respond 200 and ignore** (idempotency) → otherwise create a row: `status: confirmed` if the provider reports success, `status: rejected` if it reports a failed/denied event. **Both outcomes create a row** — a silently-dropped failed attempt would leave the client saying "I paid" with nothing in the system to check against |
| POST | `/webhooks/payments/binance` | Same pattern as PayPal, including the rejected-event case |
| POST | `/webhooks/payments/openbcb` | Same pattern — real-time status query against the BCB API, including the rejected-event case |
| POST | `/payments/{id}/proof` | 🔒 Uploads a file to `media` (`payment_proof` collection), links it to `payments.proof_media_id`, `status` stays `pending` |
| PATCH | `/admin/payments/{id}/confirm` | 🔒👑 For bank transfer — `status → confirmed`, `confirmed_by_admin_id = current admin`. Optional `{ exchange_rate_override }` if a different rate was agreed with that client — recorded on `exchange_rate_used` and `exchange_rate_overridden_by_admin_id` |

---

## 5. Maintenance

| Method | Route | Notes |
|---|---|---|
| GET | `/maintenance/plans` | Public — active `maintenance_plans` |
| POST | `/maintenance/subscribe` | 🔒 `{ plan_id, billing_cycle }` → creates a `maintenance_subscriptions` row, triggers the same payment flow as a regular project |
| PATCH | `/maintenance/{id}/cancel` | 🔒 |
| PATCH | `/maintenance/{id}/pause` | 🔒 Client-facing, same as cancel — `maintenance_subscriptions.status → paused`. Without this, `paused` in `DATA_MODEL.md` §4 would be an enum value nothing could ever set |
| GET/POST/PATCH/DELETE | `/admin/maintenance/plans` | 🔒👑 CRUD for `maintenance_plans` |

---

## 6. Blog

| Method | Route | Notes |
|---|---|---|
| GET | `/blog/posts?locale=&pillar=` | Public — only `status: published`, joined with `blog_post_translations` for the requested locale |
| GET | `/blog/posts/{slug}` | |
| POST | `/blog/posts/{id}/comments` | 🔒 `status: pending` by default |
| GET/POST/PATCH/DELETE | `/admin/blog/posts` | 🔒👑 Full CRUD, includes uploading `featured_image` and editing every `blog_post_translations` row |
| PATCH | `/admin/blog/comments/{id}/moderate` | 🔒👑 `{ status }` |

---

## 7. Portfolio and testimonials

| Method | Route | Notes |
|---|---|---|
| GET | `/portfolio?tag=&locale=` | Filters on `technologies` |
| GET | `/portfolio/{slug}` | |
| GET/POST/PATCH/DELETE | `/admin/portfolio` | 🔒👑 CRUD for `portfolio_projects` and their `portfolio_project_translations` — not explicitly listed in section 18 of `PROJECT_SPEC.md`, but a necessary implication: portfolio content has to be editable from somewhere |
| GET | `/testimonials` | Only `status: approved` |
| POST | `/testimonials` | 🔒 `status: pending` |
| PATCH | `/admin/testimonials/{id}/approve` | 🔒👑 |
| PATCH | `/admin/testimonials/{id}/reject` | 🔒👑 Distinguishes "declined" from "not yet reviewed" — without this, `pending` would mean both |

---

## 8. Chatbot

| Method | Route | Notes |
|---|---|---|
| POST | `/chatbot/message` | `{ conversation_id?, message }` — creates a `chatbot_conversations` row if none exists (with `session_id` if anonymous), saves to `chatbot_messages`, streamed response (Reverb) |
| POST | `/chatbot/escalate` | `{ conversation_id, channel }` — `channel` = `whatsapp`\|`telegram`\|`email`. Calls the AI SDK to summarize, saves to `chatbot_conversations.escalation_summary` and `escalation_channel`, `status → escalated` → returns `{ link }`: a `wa.me` URL for WhatsApp, a `t.me/{username}` URL for Telegram, or a `mailto:` URL for email, each with the summary URL-encoded in. **Always**, regardless of `channel`, also fires an email notification to the admin (section 20 of `PROJECT_SPEC.md`) — the client's channel choice and the admin's alert are independent, one doesn't replace the other |

---

## 9. Links, settings, and CV

| Method | Route | Notes |
|---|---|---|
| GET | `/profile-links` | Only `visible: true`, ordered |
| PATCH | `/admin/profile-links` | 🔒👑 |
| GET | `/settings/public` | Only the safe-to-expose subset (contact info, next available start date) — **never** exposes full bank account details |
| PATCH | `/admin/settings` | 🔒👑 Invalidates the Redis cache on save |
| GET | `/cv` | Metadata: `{ file_name, updated_at, size_bytes }` — for the download card (section 23 of `PROJECT_SPEC.md`), no embedded viewer |
| GET | `/cv/download` | Serves the binary from `media` |
| POST | `/admin/cv` | 🔒👑 Replaces the active file |

---

## 10. Admin — Business Intelligence

| Method | Route | Notes |
|---|---|---|
| GET | `/admin/dashboard/metrics` | 🔒👑 All metrics from section 18 of `PROJECT_SPEC.md`. Served from **precomputed** values (async job), never calculated live in the request — this needs to stay fast even with thousands of records |
| GET | `/admin/dashboard/recalibration` | 🔒👑 Quoted-vs-actual comparison by category (section 9 — feedback loop), with the list of highest-deviation projects |
| GET | `/admin/deleted-users` | 🔒👑 Users with `deleted_at` not null and `anonymized_at` null (still inside the retention window) — section 8 of `PROJECT_SPEC.md` |

---

## 11. Cross-cutting rules (apply to every endpoint above)

- **Rate limiting:** `POST /quotes/calculate` — 30 requests/minute per IP+session (legitimate frequent use during wizard interaction, still bounded); `POST /auth/login` — 5 attempts/minute per IP (brute-force protection, section 17). Exact figures, not impressions — implemented via Laravel's throttle middleware with these two named limiters.
- **CORS:** only the frontend's own domain is allow-listed.
- **`is_test`:** every write endpoint under `/admin/*` that creates a `quote`, `project`, `payment`, or `contract` must accept an optional `is_test` flag in the body — defaults to `false`.
- **Payment webhooks:** all three (`/webhooks/payments/*`) follow the same mandatory pattern: verify signature (if valid, save `payments.webhook_signature_verified = true`; if not, reject and stop) → check `provider_transaction_id` doesn't already exist → process → respond 200. Never the other way around.
