# ARCHITECTURE.md — System Architecture

**Complements `PROJECT_SPEC.md` v3.1, `DATA_MODEL.md`, and `API_SPEC.md`.**

---

## 1. Overview

```
┌─────────────────┐        /api/v1 (JSON)        ┌──────────────────┐
│  frontend/       │ ───────────────────────────► │  backend/        │
│  Next.js 16      │ ◄─────────────────────────── │  Laravel 13      │
│  (App Router)    │      WebSocket (Reverb)       │  PHP-FPM         │
└─────────────────┘                                └────────┬─────────┘
                                                              │
                       ┌──────────────┬───────────────────────┼──────────────┬─────────────┐
                       ▼              ▼                       ▼              ▼             ▼
                  PostgreSQL       Redis                  Groq API     Documenso      External
                  (app data)       (cache/queues)         (chatbot)    (self-hosted)  payment gateways
```

Frontend and backend live in the same monorepo but communicate **exclusively through the versioned API** — neither ever imports code from the other directly. This is what lets a future Flutter app consume `backend/` unchanged.

---

## 2. Scaffolding note — read this before touching folder structure

The folder tree in section 3 shows **only what we add on top of each framework's own standard scaffolding** — it is a curated highlight, not an exhaustive file listing. Concretely:

1. **The first real step is running the standard CLI tools**, not creating folders by hand: `laravel new backend` (or `composer create-project laravel/laravel backend`) and `npx create-next-app@latest frontend` with the flags recorded in `TASKS.md` once that document exists.
2. **Everything each tool generates stays exactly as generated** — `composer.json`, `package.json`, `artisan`, `.env`, `.env.example`, `.gitignore`, `vendor/`, `node_modules/`, `.next/`, `storage/`, `bootstrap/`, Laravel's own `public/index.php`, etc. **Nothing gets deleted.** If something in the default scaffolding looks unfamiliar or "extra," the default answer is to leave it — it is not in conflict with anything in this document.
3. **`.gitignore` is not centralized.** Each subfolder keeps the `.gitignore` its own scaffolding tool generated (`frontend/.gitignore`, `backend/.gitignore`) — Git respects nested `.gitignore` files, so this is correct as-is. A minimal root-level `.gitignore` is added only for monorepo-wide concerns (OS files like `.DS_Store`, editor folders) — it does not duplicate what the subfolders already exclude.
4. **`.env` files are per-subfolder** (`frontend/.env.local`, `backend/.env`), never a single shared one — Next.js and Laravel each read their own.

---

## 3. Folder structure

```
/
├── frontend/
│   ├── app/
│   │   ├── [locale]/                  # next-intl — en/es
│   │   │   ├── (public)/              # Home, portfolio, services, blog, quote
│   │   │   ├── (auth)/                # login, register
│   │   │   ├── dashboard/             # Authenticated client
│   │   │   └── admin/                 # Admin panel
│   │   └── api/                       # Only internal Next.js routes (e.g. edge-only webhooks) — real logic lives in backend/
│   ├── components/
│   │   ├── ui/                        # Reusable glass components (glass-card, etc.)
│   │   └── [domain]/                  # quotes/, dashboard/, blog/...
│   ├── lib/                           # API client, utilities
│   ├── messages/                      # en.json, es.json (next-intl — UI strings only, never business content)
│   └── public/
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/   # One controller per group in API_SPEC.md
│   │   ├── Models/                    # One Eloquent model per table in DATA_MODEL.md
│   │   ├── Services/
│   │   │   ├── Payments/              # PaymentProvider contract + one class per method (section 5)
│   │   │   ├── Quotes/                # Parametric calculation engine
│   │   │   └── Chatbot/               # AI SDK orchestration
│   │   ├── Jobs/                      # Queues — one Job per async task (section 4 of PROJECT_SPEC.md)
│   │   ├── Observers/                 # UserObserver (anonymization), etc. — never raw DB triggers
│   │   └── Notifications/
│   ├── database/
│   │   ├── migrations/                # One per table in DATA_MODEL.md
│   │   └── seeders/                   # Dev/staging data (section 4 of PROJECT_SPEC.md)
│   └── routes/api_v1.php
├── infra/
│   ├── docker-compose.yml
│   ├── docker-compose.staging.yml     # Environment override
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   └── nginx/
├── .github/workflows/
├── docs/                              # This document and the rest — yes, committed to GitHub
├── AGENTS.md
└── README.md
```

---

## 4. Docker Compose services

| Service | Base image | Port (dev) | Depends on |
|---|---|---|---|
| `frontend` | node:22-alpine | 3000 | `backend` |
| `backend` | php:8.3-fpm | 8000 | `postgres`, `redis` |
| `postgres` | postgres:16 | 5432 | — |
| `redis` | redis:7-alpine | 6379 | — |
| `reverb` | PHP process inside the `backend` image | 8080 | `redis` |
| `queue-worker` | Same image as `backend`, `php artisan queue:work` | — | `redis`, `postgres` |
| `scheduler` | Same image as `backend`, cron running `php artisan schedule:run` every minute | — | `postgres` |
| `umami` | ghcr.io/umami-software/umami | 3001 | `umami-db` (its own Postgres) |
| `listmonk` | listmonk/listmonk | 3002 | `listmonk-db` (its own Postgres) |
| `glitchtip` | glitchtip/glitchtip | 3003 | its own Postgres |
| `documenso` | documenso/documenso | 3004 | its own Postgres |
| `mailpit` | axllent/mailpit | 8025 (UI) | — |
| `nginx` | nginx:alpine | 80/443 | `frontend`, `backend` |

**Important:** Umami, Listmonk, GlitchTip, and Documenso each use their **own separate Postgres database** (independent containers, not the project's main database) — so an update or failure in any of these support tools never puts business data (`quotes`, `projects`, `payments`) at risk.

**Database access:** Laravel connects as the **owner of its own database**, never as the Postgres superuser. Setting `POSTGRES_USER`/`POSTGRES_DB` in the `postgres` service to project-specific values (not the default `postgres`/`postgres`) gives that user full control over its own database — enough to run every migration — without any reach into the isolated databases the support services above use, and without cluster-wide superuser rights nobody but a human doing manual admin work should have.

**Async jobs** (`queue-worker`) and **scheduled tasks** (`scheduler`) are containers separate from `backend` itself — if the web process restarts, queues and cron aren't interrupted.

---

## 5. Code conventions

- **Backend:** PSR-12, one Eloquent model per table, one `FormRequest` per write endpoint for validation (never validate inline in the controller).
- **Frontend:** components in `PascalCase`, hooks in `camelCase` prefixed with `use`, one file per component.
- **API route names:** exactly as they appear in `API_SPEC.md` — do not translate or rename mid-implementation.
- **UI strings** (buttons, labels): in `frontend/messages/{locale}.json`, never hardcoded in the component.
- **Translatable business content** (posts, portfolio): in the `*_translations` tables in `DATA_MODEL.md`, never in `messages/`.

---

## 6. `PaymentProvider` pattern

Referenced in section 12 of `PROJECT_SPEC.md`. Common interface in `backend/app/Services/Payments/`:

```php
interface PaymentProvider {
    public function initiate(Project $project, float $amountUsd): array; // → data for the frontend (QR, link, instructions)
    public function verifyWebhookSignature(Request $request): bool;
    public function processWebhook(Request $request): Payment;
}
```

One class per method: `OpenBcbProvider`, `BinancePayProvider`, `PaypalProvider`, `BankTransferProvider` (this last one has `verifyWebhookSignature` always return `true`, since there's no webhook — confirmation is manual via `PATCH /admin/payments/{id}/confirm`). The payment controller never knows the details of any individual provider, it only calls the interface — adding a new payment method later is a new class, not a change to the existing controller.

---

## 7. External integrations

| Service | Integration point | Notes |
|---|---|---|
| **Groq** | `Services/Chatbot/` via Laravel 13's AI SDK | Response streamed via Reverb, never blocking the HTTP request |
| **Documenso** | Webhook `POST /webhooks/documenso` | Self-hosted, own container |
| **OpenBCB** | `Services/Payments/OpenBcbProvider` | Banco Central de Bolivia's public API |
| **PayPal / Binance Pay** | `Services/Payments/*Provider` | Webhooks with mandatory signature verification |
| **WhatsApp / Telegram** | No API — just building `wa.me` / `t.me/{username}` links | No cost, no business API approval needed for either |

---

## 8. Environments and deployment

Three environments (section 4 of `PROJECT_SPEC.md`): **local** (`docker-compose.yml`), **staging** (`docker-compose.yml` + `docker-compose.staging.yml`, a production replica seeded with test data), **production**.

Frontend and backend are containerized separately from day one — the final choice between Hostinger or AWS (section 2 of `PROJECT_SPEC.md`) should require only configuration changes in `infra/`, not code changes.

---

## 9. Security at the architecture level

Full detail in `SECURITY.md` (pending). What already shapes the architecture now: CORS restricted to the frontend's own domain, mandatory signature verification on every webhook before it touches `Services/Payments/`, 2FA enforced at the `Middleware` level for `/admin/*` routes, `.env` kept out of version control from the first commit (`.gitignore`, per section 2).
