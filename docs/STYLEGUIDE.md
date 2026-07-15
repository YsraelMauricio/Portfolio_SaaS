# STYLEGUIDE.md — Design System: "Índigo Profundo"

**Complements `PROJECT_SPEC.md` v3.4** (section 5). The values below aren't theoretical — they're the exact tokens already validated in two working HTML demos built during planning (the three-palette comparison and the light/dark toggle). An agent implementing UI should treat this document as the literal source of CSS values, not a starting point to reinterpret.

---

## 1. Color tokens

### Dark mode (default)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#09090B` | Page background |
| `--primary` | `#6D28D9` | Brand/identity color — headings accents, primary UI elements |
| `--accent` | `#00D4FF` | CTA buttons, links, primary interactive elements |
| `--secondary` | `#34D399` | Secondary accents, success states |
| `--text` | `#FAFAFA` | Body text |
| `--text-muted` | `rgba(250,250,250,.55–.7)` | Secondary text — vary opacity by hierarchy level, never a separate hardcoded gray |

### Light mode
| Token | Value | Use |
|---|---|---|
| `--bg` | `#F4F2FB` | Page background — never pure white |
| `--primary` | `#6D28D9` | Same hue as dark mode — this is intentional, it's what makes both modes feel like the same brand |
| `--accent` | `#00A9D6` | Darkened from the dark-mode cyan — the original loses contrast on a light background |
| `--secondary` | `#0EA371` | Darkened mint, same reasoning |
| `--text` | `#1E1B2E` | Never pure black |

### Usage rule
Never introduce a new color outside this table without adding it here first. If a new UI need arises (e.g. a warning state), derive it from the existing hue family rather than picking an unrelated color — an amber pulled from the rejected "Ámbar Operativo" direction, tinted to fit, is preferable to a random new hue.

---

## 2. Typography

| Role | Family | Weight(s) |
|---|---|---|
| Display / headings | Space Grotesk | 500, 600, 700 |
| Body | Inter | 400, 500, 600 |
| Code, hex values, technical labels | JetBrains Mono | 400, 500 |

Loaded via `next/font` (self-hosted), never a live Google Fonts `<link>` — this avoids the layout shift that costs Core Web Vitals points (section 24 of `PROJECT_SPEC.md`).

**Scale** (fluid, via `clamp()`, not fixed breakpoint jumps):
| Role | `clamp()` |
|---|---|
| H1 | `clamp(28px, 5vw, 44px)` |
| H2 | `clamp(22px, 4vw, 32px)` |
| H3 | `clamp(18px, 3vw, 24px)` |
| Body | `16px` fixed (fluid type on body text hurts readability more than it helps) |
| Small / labels | `13–14px` |
| Mono labels | `9–12px`, always with `letter-spacing: .08–.12em` when uppercase |

**Character coverage:** the three families above cover English, Spanish, French, and German cleanly (all Latin-script). None include CJK glyphs — if Chinese content becomes a real priority (currently only "basic layout support," per section 6 of `PROJECT_SPEC.md`), add a Noto Sans SC fallback specifically for that locale rather than replacing the primary families.

---

## 3. The glass surface — exact recipe

This is the single most reused pattern in the system. Every card, modal, and elevated panel uses this, not a one-off variant:

```css
.glass-card {
  border-radius: 20px;
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.10);   /* light mode: rgba(255,255,255,0.6) */
  box-shadow:
    0 8px 32px rgba(0,0,0,0.45),               /* light mode: rgba(109,40,217,.14) */
    inset 0 1px 0 rgba(255,255,255,0.14);      /* light mode: rgba(255,255,255,.8) */
  background: linear-gradient(160deg, rgba(var(--primary-rgb),0.22), rgba(var(--accent-rgb),0.06));
}
```

**Background requirement:** a glass surface needs something visually rich behind it to refract — a flat single-color background defeats the whole aesthetic. Every page that uses glass cards needs a mesh-gradient background layer (multiple soft radial-gradients in the palette hues) behind the content, fixed-position so it doesn't scroll away.

**Two hard limits, both already agreed in `PROJECT_SPEC.md` section 5 — do not relax either:**
- Heavy blur (the recipe above) limited to 2-3 "hero" surfaces per page. Every other elevated surface uses the "vidrio liviano" variant below.
- `forced-colors` media query gets a solid fallback background — `backdrop-filter` breaks under Windows High Contrast Mode without one.

### "Vidrio liviano" (lightweight glass — everything else)
```css
.glass-card--light {
  backdrop-filter: blur(8px);
  background: rgba(var(--surface-rgb), 0.85);  /* mostly opaque, minimal blur cost */
  border: 1px solid rgba(255,255,255,0.08);
}
```
Auto-selected via a lightweight device-capability check (not a manual toggle) — the goal is graceful degradation on low-end Android hardware, not a user-facing setting.

---

## 4. Components

- **Buttons:** primary (filled `--accent`, dark text on light background per contrast rule below), secondary (glass, 1px border, no fill), ghost (text only, underline on hover). Never a fixed pixel width — padding-based sizing only, required for i18n text-length variance (section 6 of `PROJECT_SPEC.md`).
- **Badges/tags:** `border-radius: 100px`, small mono label, tinted background at ~15% opacity of whichever semantic color applies (e.g. the "Recommended" badge on Binance Pay in checkout, section 12).
- **Form inputs:** glass surface, focus state = visible `--accent` outline (not just a border-color change — needs to survive `forced-colors` mode too).
- **The quote wizard specifically:** each step is its own glass card; price/time results use the mono font for the numbers (reinforces the "engineered, precise" feel, consistent with the demo artifacts).

---

## 5. Motion

- Standard transition: `transform 0.35s ease` (card hover lift), `background/border/box-shadow 0.5s ease` (light/dark toggle) — these exact durations came from the working toggle demo and read as "considered," not sluggish or jarring.
- Respect `prefers-reduced-motion`: disable transitions entirely, don't just shorten them.
- Nothing animates purely for decoration — every transition in this system communicates a state change (hover, mode switch, loading), never motion for its own sake.

---

## 6. Accessibility checklist (non-negotiable, section 5 of `PROJECT_SPEC.md`)

- [ ] WCAG AA contrast verified for every text/background pairing, measured — not eyeballed. Glass surfaces are the highest-risk case since the effective background varies with whatever's behind them.
- [ ] Full keyboard navigation through the quote wizard, checkout, and every form.
- [ ] Screen-reader labels on every icon-only control (the floating WhatsApp/Telegram/email button, section 21).
- [ ] `prefers-reduced-motion` respected everywhere motion appears.
- [ ] `forced-colors` fallback on every `backdrop-filter` usage.

---

## 7. Responsive rules

Container queries (`@container`, Tailwind 4.3 native) for any component that needs to adapt to its own container rather than the viewport — the service cards in particular need to look right whether they're in a 3-column grid or a narrow sidebar. Fluid type via `clamp()` (section 2 above). `dvh` units for any full-height section — never `vh`, which breaks on mobile when the browser chrome shows/hides. `next/image` for all imagery, responsive `srcset` generated automatically, never hand-built.
