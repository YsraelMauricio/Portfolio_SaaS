# DECISIONS.md — Decision Log

**Complements `PROJECT_SPEC.md` v3.4.** Each entry: what was decided, what else was considered, why this won. New major decisions get appended here as they happen — this is a living log, not a one-time document.

---

### D1 — Decoupled Next.js + Laravel monorepo, not a Laravel monolith with Blade/Inertia
**Alternatives considered:** Laravel + Inertia.js (tighter coupling, faster to build initially); Laravel + Blade (simplest, but rules out the "latest tech" showcase goal).
**Why:** the platform needs to demonstrate full-stack architecture skill, and a decoupled API means a future mobile or desktop app can consume the same backend with zero backend changes — this was the explicit reason "Laravel + Next.js" was the starting point of the whole project.

### D2 — "Laravel first" governs the platform's own backend, not the services sold to clients
**Alternatives considered:** requiring every delivered client project to also be Laravel-based.
**Why:** these are two different decisions with two different owners. WordPress as a budget option for clients doesn't contradict the platform's own architecture — conflating the two would have blocked a legitimate, profitable service line for no technical reason.

### D3 — Índigo Profundo over Vidrio Nórdico and Ámbar Operativo
**Alternatives considered:** two other palette directions were designed and demonstrated (a trust-first cool-blue option, a bold amber-accent option).
**Why:** the author's own profile (LLM engineering coursework, AI/automation specialization) matches an "AI-forward" positioning better than either alternative, and it kept a visible thread of continuity with the prior design system (cyan, mint) rather than a jarring full break.

### D4 — All schema/API/code identifiers switched to English (from an initially Spanish set)
**Alternatives considered:** keeping the original Spanish table/field/route names (`cotizaciones`, `proyectos`, etc.), which is what `PROJECT_SPEC.md` v1.0-v3.0 actually used.
**Why:** two reasons, not one. First, the entire ecosystem this project depends on — Spatie packages, Sanctum, every Laravel/Next.js tutorial and example — is English-named, so Spanish names create friction at every integration point, not just for AI agents. Second, this is public-facing portfolio code for an audience whose primary language the site itself is now English for. The changeover happened early (v3.1) specifically because it only gets more expensive the longer real code exists referencing the old names.

### D5 — USD-only pricing shown to visitors; no Bolivianos displayed
**Alternatives considered:** USD primary with BOB as a secondary reference price (the original plan).
**Why:** research into Bolivia's 2025-2026 currency situation showed a regime that changed more than once within months (a decades-old fixed peg replaced by a new, still-evolving official rate). Showing a second price that could visibly shift week to week undermines trust more than it helps — better to quote one stable number and handle the BOB conversion internally, only at the moment a Bolivian client actually pays via QR (see D9).

### D6 — Binance Pay recommended/highlighted over PayPal for international clients
**Alternatives considered:** treating both equally, or leading with PayPal (more globally recognized).
**Why:** PayPal in Bolivia cannot withdraw funds directly to a Bolivian bank account — collecting via PayPal is fine, but the author then needs a bridge (AirTM) to actually access the money locally. Binance Pay (USDT) skips that extra step entirely and goes straight into the author's own P2P conversion process he already uses. PayPal stays fully available, never penalized — this is a soft ordering nudge, not a restriction (see `CONSTRAINTS.md`).

### D7 — AirTM and Payoneer are not checkout options; only AirTM survives as a personal money-routing tool
**Alternatives considered:** exposing all four services (PayPal, Binance, AirTM, Payoneer) as client-facing payment buttons.
**Why:** AirTM has a purpose-built, verified PayPal-linked withdrawal path to a Bolivian bank account — a real bridge, not a workaround. Binance's own P2P marketplace is a weaker fit for that specific PayPal-to-BOB conversion (it would rely on unverified individual counterparties). Payoneer's path to Bolivia wasn't well-evidenced and the author already has working first-hand experience with the other two, so it was dropped rather than guessed at.

### D8 — Umami (self-hosted) over Google Analytics
**Alternatives considered:** GA4, which is genuinely free at this scale.
**Why:** Umami is cookieless by design. Combined with having no ad network or third-party pixels anywhere on the site, this is what let the project skip the intrusive cookie-consent banner (D14) — a real, compounding benefit given the site's international/EU-reachable audience, not just an ideological preference for self-hosting.

### D9 — Active USD→BOB conversion from launch, scoped narrowly (not the full multi-currency feature)
**Alternatives considered:** treating all currency conversion as one deferred feature bundled with `fawazahmed0/currency-api`.
**Why:** Bolivia's domestic QR rail only moves Bolivianos — that's a fact about the country's banking system, not a design choice, so *some* USD→BOB conversion is mandatory from day one for the QR payment method to work at all. The broader "show prices in any world currency" feature remains genuinely deferred; conflating the two would have either delayed a payment method the majority of local clients expect, or forced premature scope onto a feature with no current users.

### D10 — Documenso over DocuSign
**Alternatives considered:** DocuSign (industry standard, but paid SaaS).
**Why:** self-hosted, free, and Documenso's Simple Electronic Signature level is legally sufficient for an ordinary services contract — no need to pay for a signature product when the free, self-hosted option meets the actual legal bar required.

### D11 — Payment order is fixed: contract signed before payment requested
**Alternatives considered:** the author's original proposal — auto-generate and send a contract *after* payment or a 50% deposit arrives.
**Why:** that order leaves a window where money has moved with no signed agreement covering it — the worse position for both sides if a scope dispute happens in that gap. Flipping the order costs nothing extra to build (same underlying job queue) and removes a real risk.

### D12 — Contract drafts require admin approval before sending, not full automation
**Alternatives considered:** fully automatic generation and sending, no human step.
**Why:** custom/bespoke quotes (the "doesn't fit the catalog" escape hatch) don't have clean parametric data to safely auto-fill a legal document from. One approval click covers that edge case without meaningfully slowing down the common, clean-parametric-quote path.

### D13 — Rejected sourcing installable software from aportesingecivil.com
**Alternatives considered:** the author's original proposal — install AutoCAD/Adobe/civil engineering software from that specific site at $5/program.
**Why:** the site's own "we don't host any files, just links collected elsewhere" language is a standard piracy-aggregator disclaimer, reinforced by it separately selling deeply-discounted "educational licenses" for software that costs hundreds to thousands of dollars normally. Building a paid service around it would create real legal exposure (Adobe/Autodesk actively pursue this) and directly contradict every other decision in this document favoring legitimate, licensed, or genuinely free tooling. The underlying business need (help a client get software running) is served just as well by charging the same $5 for installation/configuration labor using the client's own license, with free/open-source alternatives (GIMP, Inkscape, FreeCAD) suggested where a client has no budget for a commercial license.

### D14 — No blocking cookie-consent banner
**Alternatives considered:** the standard "Accept all cookies" modal most sites ship by default.
**Why:** it's only required for non-essential cookies needing consent (tracking, ads). Between Umami's cookieless design (D8) and having no ad network, the site has nothing in that category — the only cookie is Laravel's necessary session cookie, which is exempt. A small non-blocking footer notice replaces the modal.

### D15 — Quote-engine feedback loop stays human-approved, with two automatic filters added to reduce friction
**Alternatives considered:** either full manual recalibration with no system suggestion, or fully automatic price/time adjustment based on quoted-vs-actual data.
**Why:** with a solo freelancer's project volume (a handful per category per quarter), a fully automatic adjustment risks being skewed by a single atypical project. But asking a human to do the whole analysis from raw numbers every quarter is real, avoidable friction. The resolution: `paused_days` and `scope_changed` automatically strip out the two most common non-pricing-related causes of deviation before any human sees the data, and the system proposes a specific adjustment number rather than a raw report — the admin's actual work drops to an accept/adjust/ignore click per suggestion.

### D16 — Full admin CRUD for the quote engine's structure, not just price edits on existing entries
**Alternatives considered:** the original scope, which only let the admin edit an existing modifier's price/time (sufficient for the quarterly recalibration loop, D15).
**Why:** found by directly asking "could I add a whole new category later without touching code" — the honest answer at the time was no. Since `service_categories`/`product_types`/`modifier_groups`/`modifiers` were already proper database tables (not hardcoded), completing the missing CRUD endpoints was a pure gap-fill, not a redesign — closing it now, before any code exists, costs nothing extra.
