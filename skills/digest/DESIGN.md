# EVELIN VIRUNURM — Brand Design System

## Aesthetic: Dark Technical Interface / Data-Terminal Precision

---

## 1. Philosophy

> **Near-black void. Monospace data overlay. Hairline borders. Corner brackets. Signal-red accent only. No warmth. No decoration without information.**

This is not a "dark mode." It is a **data-terminal aesthetic** — the visual language of raw signal processing, scientific instrumentation, version-control status, and glitch artifacts. Every element should feel like it belongs inside monitoring software, a film color-grading suite, or a signal analysis station.

**Core principles:**

- **Void first** — backgrounds are `black` (`#0f0f0f`). No gradients, no warmth, no beige. Elevated surfaces use `gray-900` (`#18181b`).
- **Data is decoration** — hex dumps, binary streams, frame counters, coordinates, status readouts. Information *is* the ornament.
- **Sparse color** — white + gray scale + one signal red (`red-500`, `#e65f89`). No other hues appear anywhere in UI.
- **1px precision** — hairline borders, hairline rules, 1px stems. No heavy borders, no rounded corners, no shadows.
- **Monospace is metadata** — all labels, readouts, coordinates, and status text use Geist Mono. Sans-serif (Geist) for display and body only.

---

## 2. Color System

All colors are defined in `tokens.json`. This is the complete and exclusive palette.

### Palette

| Token | Value | Role |
|---|---|---|
| `black` | `#0f0f0f` | Base void — page background, deepest layer |
| `gray-900` | `#18181b` | Raised surfaces — panels, cards, section backgrounds |
| `gray-800` | `#27272a` | Dividers, track backgrounds, subtle borders |
| `gray-700` | `#3f3f46` | Bracket lines, border accents, muted structural elements |
| `gray-600` | `#52525b` | Crosshair lines, data labels, inactive text |
| `gray-500` | `#71717a` | Secondary text, supplementary labels |
| `gray-400` | `#a1a1aa` | Description text, readout values, body copy |
| `gray-300` | `#d4d4d8` | Body text on dark backgrounds, hover states |
| `gray-200` | `#e5e5e7` | Light interface text |
| `gray-100` | `#f4f4f5` | Lightest gray — rarely used |
| `white` | `#fdfdfd` | Primary text, active states, filled shapes |
| `red-500` | `#e65f89` | **Signal accent** — live indicators, active dots, progress fills, selection, hover glows |

### Color Rules

- **No color outside this palette.** No green, blue, purple, orange, yellow.
- `red-500` is the only accent and it functions as a **signal** — it means "live," "active," "attention, here." Use it sparingly. It is never used as body text color.
- Gradients are permitted only on decorative horizontal rules (fade `transparent → gray-800 → gray-700 → gray-800 → transparent`).
- For red glow effects on active/hover states, use `rgba(230, 95, 137, 0.15)` derived from the red token. This is an effect, not a token — it is the only permitted use of color opacity.
- **Selection:** `::selection { background: red-500; color: white; }`

### Black-to-White Hierarchy

Think of the palette as a strict ladder. Each step has a semantic role:

```
black      → the void (page base)
gray-900   → elevation (panels, sections)
gray-800   → structure (dividers, tracks, borders between zones)
gray-700   → accent structure (brackets, crosshairs, subtle marks)
gray-600   → dim text (labels, coordinates, inactive readouts)
gray-500   → secondary text (supporting copy)
gray-400   → body text (descriptions, paragraphs)
gray-300   → prominent text (headings on subtle backgrounds, hover text)
gray-200   → interface text (rare)
gray-100   → lightest touch (rare)
white      → full signal (primary text, active states, filled shapes)
red-500    → interrupt (the single point of warmth — signal only)
```

---

## 3. Typography

All typography tokens are defined in `tokens.json`. Font families, sizes, and weights are non-negotiable.

### Font Families

| Family | Token Reference | Role |
|---|---|---|
| **Geist** | `fontFamily` in sans tokens | Display headings, body copy, all proportional text |
| **Geist Mono** | `fontFamily` in mono tokens | Data overlays, labels, readouts, coordinates, status, all metadata |

### Type Scale

#### Titles

| Token | Family | Weight | Size | Role |
|---|---|---|---|---|
| `hero` | Geist | 700 | 96px | Hero name, massive display text |
| `hero-mono` | Geist Mono | 700 | 96px | Monospace hero (rare, for data-headlines) |

#### Headings (Sans)

| Token | Weight | Size | Role |
|---|---|---|---|
| `heading-01` | 700 | 40px | Primary section title |
| `heading-02` | 700 | 32px | Secondary section title |
| `heading-03` | 700 | 24px | Sub-section heading |
| `heading-04` | 700 | 20px | Small heading, card title |

#### Headings (Mono)

| Token | Weight | Size | Role |
|---|---|---|---|
| `heading-mono-01` | 700 | 40px | Data section title, technical heading |
| `heading-mono-02` | 700 | 32px | Secondary data heading |
| `heading-mono-03` | 700 | 24px | Sub-section data heading |
| `heading-mono-04` | 700 | 20px | Small mono heading, status header |

#### Body (Sans)

| Token | Weight | Size | Role |
|---|---|---|---|
| `body-large` | 400 | 18px | Emphasized body text, lead paragraphs |
| `body` | 400 | 16px | Standard body text |
| `body-small` | 400 | 14px | Supporting text, captions |
| `caption` | 400 | 12px | Small labels, footnotes |

#### Body (Mono)

| Token | Weight | Size | Role |
|---|---|---|---|
| `body-mono-large` | 400 | 18px | Emphasized data readout |
| `body-mono` | 400 | 16px | Standard data text |
| `body-mono-small` | 400 | 14px | Supporting data text |
| `caption-mono` | 400 | 12px | Small data labels, HUD values, coordinates |

### Typographic Rules

These rules govern letter-spacing and text-transform, which the tokens don't define. They are **mandatory** for brand compliance.

| Context | Font | Transform | Letter-spacing | Color |
|---|---|---|---|---|
| Hero display headings | Geist `hero` | none | -0.04em to -0.06em | `white` or `gray-600` (with text-stroke) |
| Section headings | Geist `heading-01`–`04` | none | -0.02em to -0.04em | `white` |
| Data labels, HUD text, status readouts | Geist Mono `caption-mono` / `body-mono-small` | **UPPERCASE** | 0.08em–0.25em | `gray-600` |
| Data values, live counters, hex | Geist Mono `caption-mono` | none | 0.05em–0.08em | `gray-400` default, `red-500` when "live" |
| Body paragraphs | Geist `body` / `body-large` | none | 0 | `gray-400` or `gray-500` |

**Line-height:** Set generous line-heights for body text (1.75–1.8). Headings use tight line-height (0.88–1.0).

---

## 4. Spacing

All spacing uses the token scale from `tokens.json`. The base unit is **4px**. Every measurement in the design system must resolve to a token value.

### Token Scale

| Token | Value | Typical Use |
|---|---|---|
| `space-001` | 4px | Micro gaps, inline spacing |
| `space-002` | 8px | Tight element gaps, icon-text spacing |
| `space-003` | 12px | Small internal padding |
| `space-004` | 16px | Standard component padding, mobile page margin |
| `space-005` | 20px | Medium gaps |
| `space-006` | 24px | Desktop page margin, standard gaps |
| `space-007` | 28px | — |
| `space-008` | 32px | Large component padding |
| `space-009` | 36px | — |
| `space-010` | 40px | Section internal gaps |
| `space-011` | 44px | — |
| `space-012` | 48px | Large vertical rhythm |
| `space-013` | 52px | — |
| `space-014` | 56px | — |
| `space-015` | 60px | Large section spacing |

For section-level vertical padding (100px+), compose from tokens: `space-015` × 2 = 120px.

### Layout Constants

- **Content max-width:** 1200px (or 1000px for narrow sections)
- **Page horizontal padding:** `space-006` (24px) desktop, `space-004` (16px) mobile
- **Section vertical padding:** Compose from tokens — aim for `space-015` × 2 to `space-015` × 2.5 (120px–150px)
- **Responsive breakpoint:** Below 768px, collapse multi-column layouts to single column and switch to `space-004` page padding

---

## 5. Decorative Elements

These are the brand's visual vocabulary — abstract patterns that convey the data-terminal aesthetic. They are not required on every page but are part of the brand identity when used.

### 5.1 Corner Brackets

L-shaped 1px border corners that frame sections or content blocks. They use `gray-700` (standard) or `gray-600` (large). Always 0 border-radius. They may **breathe** — a subtle opacity/scale animation staggered across the four corners (6s cycle, ease-in-out).

**Structural rule:** Brackets mark territory. They say "this is a defined zone." Use them to frame major sections, hero areas, or content cards.

### 5.2 Crosshairs

Targeting reticle: two 1px lines crossing at center (`gray-700`), with a `red-500` 4px dot at the intersection. They may track the mouse with slight parallax displacement (3% of cursor delta).

**Structural rule:** Crosshairs mark focal points. Use them to draw attention to key areas — hero text, primary data, central imagery.

### 5.3 Horizontal Rules

Hairline dividers using a gradient fade: `transparent → gray-800 → gray-700 → gray-800 → transparent`. Height: 1px only. Never solid, always fading at the edges.

### 5.4 Data Labels

Monospace, `caption-mono` token, uppercase, `letter-spacing: 0.12em`, color `gray-600`. These are the brand's "metadata language" — coordinates, status tags, section identifiers, frame counters.

### 5.5 Status Dots

4px `red-500` circles with a slow pulse animation (2s ease-in-out, opacity 0.4→1→0.4). They indicate "live" or "active" state. They are the only place red appears persistently without interaction.

### 5.6 Glitch Text Effect

Display text (typically `hero` or `heading-01`) can exhibit chromatic aberration — duplicate layers offset in red (`red-500`) and cyan, appearing briefly via `clip-path` animation then vanishing. The effect is intermittent (activates ~10% of a cycle), shifting 1–3px, with tight clip bands revealing only fragments. It is **never persistent** — it flashes and disappears, suggesting signal instability.

**Structural rule:** Glitch is used on primary display text only. It's an atmospheric event, not a readable state. Content must always be legible beneath it.

### 5.7 Data Overlay Grids

Monospaced grids of character cells (using `body-mono-small` or `caption-mono` tokens) suggesting live telemetry or hex dumps. Cells have three states:
- **Default:** `gray-800` color, transparent border
- **Active:** `gray-400` color, `gray-800` border, subtle background
- **Highlight:** `white` color, `gray-700` border

On hover, cells illuminate adjacent cells in a ripple pattern with staggered delay (Manhattan distance × animation duration).

### 5.8 System Readouts

Two-column key-value rows in `caption-mono` token. Labels in `gray-700`, values in `gray-500`, "OK"/active values in `gray-300`. On hover, the row shifts right (`space-002`) and both label and value brighten (label → `gray-400`, value → `white`).

---

## 6. Motion & Interaction Principles

### Easing

All transitions use `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (custom deceleration) or simple `ease`. No spring physics, no bouncy easing.

### Durations

| Context | Duration |
|---|---|
| Hover color/opacity shifts | 0.15s–0.2s |
| Hover structural changes (padding, scale) | 0.3s |
| Reveal animations (fade-in, slide-up) | 0.6s |
| Breathing/ambient animations (brackets, pulses) | 2s–6s, infinite |

### Reveals

Elements entering the viewport should fade in + translate upward (20px → 0, opacity 0 → 1) over 0.6s using IntersectionObserver with a 0.1 threshold.

### Text Scramble

On hover of text elements, characters may decode through random glyphs back to the original. Duration: 400–500ms, 10–12 steps, using character set `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*`.

### Magnetic Pull

Interactive elements may physically displace toward the cursor on hover (15% of cursor delta from element center), springing back on leave.

### Interactive Progress

Progress bars and similar fill elements track the cursor's horizontal position on hover, updating in real-time. On leave, they return to their data-driven state.

### Transition Principles

- **Nothing appears instantly.** Even state changes have a brief 150ms transition.
- **Nothing bounces.** Motion is precise, mechanical, terminal-like.
- **Red draws the eye.** Any state change to `red-500` should feel like a deliberate signal, not decoration.
- **Hover states brighten through the gray scale.** `gray-700` → `gray-400` → `gray-300` → `white` as intensity increases.

---

## 7. Layout Principles

- **Max content width:** 1200px, centered. Narrow sections may use 1000px.
- **Sections are separated by `gray-900` 1px border-tops** — never by shadow, never by spacing alone.
- **Two-column grids:** Use 1fr 1.5fr with `space-010` (40px) to `space-015` (60px) gap. Collapse to single column at 768px.
- **Content sits on void (`black`).** Elevated sections or cards use `gray-900` as background.
- **Generous negative space.** Sections breathe with `space-015` × 2 vertical padding. Content is sparse, not crowded.
- **Every section can have a HUD bar** — monospaced left/right split of data labels and values at the top or bottom of a content zone.

---

## 8. Brand Rules

### ✅ Do

- Use `black` (`#0f0f0f`) for every background
- Use 1px borders and hairline rules exclusively
- Use Geist Mono for all data, labels, coordinates, status, HUD elements
- Use Geist (sans) for display headings and body text
- Use `red-500` sparingly — it is a signal, not decoration
- Use corner brackets to frame sections
- Use uppercase + wide tracking on all data/metadata text
- Use the full token scale for all spacing
- Use token typography sizes — no invented sizes
- Leave honest empty states rather than inventing fake data
- Use `gray-900` as the elevated surface color over `black` void
- Compose section padding from token multiples

### ❌ Don't

- Use gradients on backgrounds
- Use warm colors (beige, peach, cream, orange-brown)
- Use box-shadows on cards or containers (only red glow on signal elements via `rgba(230, 95, 137, 0.15)`)
- Use border-radius on any UI element (always 0px)
- Use emoji or decorative SVG illustrations
- Use any color outside the token palette
- Use more than one accent hue in UI (`red-500` only)
- Use sans and mono interchangeably — Geist is for display/body, Geist Mono is for data/metadata
- Use sizes not in the token typography scale
- Use rounded corners on brackets, crosshairs, or any decorative element
- Add viewport selectors, platform toggles, or demo controls to production pages
- Use heavy borders (always 1px or hairline)

---

## 9. Applying This System

This design definition is intended to be used alongside `tokens.json` to transform any webpage into the Evelin Virunurm brand. When applying:

1. **Start with tokens.** Every color, font-size, spacing value, and font-family must resolve to a token. If a value doesn't exist in the token scale, choose the nearest token value.
2. **Apply the palette hierarchy.** Map the source page's colors to the black→gray-900→...→white→red-500 ladder. Kill any color that isn't in the ladder.
3. **Replace all fonts.** Display and body → Geist. Metadata, labels, data, code → Geist Mono.
4. **Strip decoration.** Remove shadows, rounded corners, gradients, and warm tones. Replace borders with 1px `gray-800` or `gray-900`. Replace accent colors with `red-500` used sparingly.
5. **Add data-overlay character.** Where a page has metadata, timestamps, counts, or status — render them as monospaced, uppercase, tracked `gray-600` labels with `gray-400` or `gray-500` values.
6. **Add structural decoration where appropriate.** Corner brackets on major sections, horizontal rules with gradient fades, status dots on live elements.
7. **Enforce spacing.** All gaps, padding, and margins must use values from `space-001` through `space-015`.
8. **Apply motion principles.** Hover transitions at 0.15–0.3s, reveals at 0.6s, ambient animations at 2–6s, always with custom deceleration easing.

---

_Last updated: 2026-06-13_
_For: Evelin Virunurm — Design Engineer_