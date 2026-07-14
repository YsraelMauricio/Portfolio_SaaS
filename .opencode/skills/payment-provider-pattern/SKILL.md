---
name: payment-provider-pattern
description: Use when implementing or reviewing any PaymentProvider class (OpenBcbProvider, BinancePayProvider, PaypalProvider, BankTransferProvider, or a future new payment method). Covers the mandatory interface, the signature-verification-then-idempotency order, and the exact fields each implementation must populate.
license: Proprietary
compatibility: opencode
metadata:
  project: portfolio-platform
  owner: backend
---

## What I do

I define the exact, non-negotiable pattern every payment method in this project must follow — so a new one (or a review of an existing one) doesn't have to be reverse-engineered from scattered mentions across PROJECT_SPEC.md, SECURITY.md, and ARCHITECTURE.md.

## The interface (ARCHITECTURE.md §6)

```php
interface PaymentProvider {
    public function initiate(Project $project, float $amountUsd): array;
    public function verifyWebhookSignature(Request $request): bool;
    public function processWebhook(Request $request): Payment;
}
```

## The mandatory order inside `processWebhook` — never rearrange this

1. Call `verifyWebhookSignature($request)` first, before touching anything else. If it returns false: reject the request, log it, stop. Do not proceed to step 2.
2. Check whether `payments.provider_transaction_id` already has a row with this exact ID. If it does, respond 200 and do nothing further — this is the idempotency guard against a duplicate webhook delivery.
3. Only now create the `payments` row. Both a reported success AND a reported failure/denial from the provider create a row — success gets `status: confirmed`, failure gets `status: rejected`. Never silently drop a failed-payment webhook.
4. Set `webhook_signature_verified: true` only after step 1 actually passed for this specific request.

## Fields every implementation must populate correctly

- `amount_usd` — always the canonical figure. Never derive this from anything in the incoming webhook payload; it comes from the project/contract's own frozen data.
- `local_currency` / `amount_local` / `exchange_rate_used` — only relevant for `OpenBcbProvider` (always `BOB`) and optionally `BankTransferProvider`. `BinancePayProvider` and `PaypalProvider` leave these null — they never leave USD, so there's nothing to convert.
- `exchange_rate_overridden_by_admin_id` — only set if this specific transaction used an admin-negotiated rate instead of the default in `settings`.

## Where each concrete provider differs

- `OpenBcbProvider`: converts `amount_usd` to BOB before generating the QR (using the current `exchange_rates` value or an admin override), rounds per PROJECT_SPEC.md §13.
- `BinancePayProvider` / `PaypalProvider`: no conversion, webhook-based, both directions (confirmed/rejected).
- `BankTransferProvider`: `verifyWebhookSignature` always returns `true` — there is no webhook, confirmation is manual via `PATCH /admin/payments/{id}/confirm`, which is where `confirmed_by_admin_id` gets set instead.

## When to use me

Any task that touches `backend/app/Services/Payments/`, whether writing a new provider or reviewing an existing one. If you're the `security` agent reviewing a payment PR, load this skill alongside SECURITY.md — this is the implementation-level detail behind that document's payment section.
