---
name: cardinal-ui
description: Cardinal product UI design system — Notion-like black/white aesthetic, Georgia wordmark + Source Sans 3 UI type, Lucide icons only (no emojis), and motion rules for the Next.js app. Use when building or editing anything under frontend/, landing pages, components, styles, or Cardinal frontend UX.
---

# Cardinal UI

Project-local design system for the Next.js frontend in `frontend/`.

## Brand

- Product name: **Cardinal**
- Logo: `frontend/public/brand/cardinal-logo.jpg` (voxel bird + card, monochrome)
- First-viewport hero: logo (large) + wordmark **Cardinal** beside it + one CTA. Keep chrome sparse.

## Visual system

### Colors (majority B/W, sparse accents)

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#FFFFFF` | Page background |
| `--surface` | `#FFFFFF` | Elevated surfaces |
| `--ink` | `#111111` | Primary text / primary buttons |
| `--muted` | `#6B6B66` | Secondary text |
| `--border` | `#E5E5E1` | Hairline borders |
| `--accent` | `#2383E2` | Notion-like action blue (sparingly) |
| Pastels | peach `#FFD5B8`, soft purple/orange/blue/sage | Tags/status only — never large fills |

Avoid purple-gradient AI tropes, cream+serif terracotta themes, and glow-heavy dark mode as defaults.

### Typography

- **UI text** (body, buttons, labels, taglines): **Source Sans 3** via `next/font` (`--font-cardinal`). Pairs with Georgia — humanist sans, not the same as the wordmark.
- **Wordmark only:** **Georgia** (serif) — exclusively for the **Cardinal** logo text. Medium weight, tight tracking (`letter-spacing: -0.06em`).
- Never handwriting/script fonts for UI copy. Do not use Inter, Roboto, or Arial as branded defaults.
- Logo mark is a transparent-background asset; place it directly on the page with a soft drop shadow (no white plate/halo needed).

### Icons

- **Icons only — never emojis** in UI, copy, alt text placeholders, or empty states.
- Prefer **Lucide React** (`lucide-react`), 1.5–1.75 stroke, monochrome unless a pastel status chip needs a tinted icon.

### Layout & components

- Notion-like: generous whitespace, thin borders, soft 8–10px radii.
- Primary CTA: solid `#111` (or `--accent` when emphasizing action) with white label; hover lift + press scale.
- Secondary: white/transparent + gray border.
- Cards as containers only when they aid interaction/understanding — not decorative chrome on the hero.

## Motion (required)

Animate nearly everything. Prefer Framer Motion + CSS keyframes.

| Interaction | Behavior |
|-------------|----------|
| Page / section enter | Fade + slight `y` rise (`opacity` 0→1, `y` 12–20px), 400–700ms ease-out |
| Hover (buttons, links, chips) | Subtle lift (`y: -2`) and/or shadow deepen; icon nudge if present |
| Click / tap | Brief press (`scale: 0.98`) |
| Background floating cards | Continuous slow drift (CSS); **no mouse-follow parallax** unless explicitly requested. Carousel rows remain available in code as an alternate. |
| Scroll reveals | Fade/slide when entering viewport (`whileInView`, once) |
| Reduced motion | Honor `prefers-reduced-motion: reduce` — disable drift/marquees; keep instant opacity |

Landing background (current): white page + floating issuer card art from `app/public/cards/`, soft opacity/rotation, behind content (`pointer-events: none`). Idle hover/drift only — not cursor-linked.

## Landing page contract

1. Full-bleed first viewport
2. Large logo + **Cardinal** wordmark
3. CTA label exactly: **Find your perfect credit card** (with Lucide arrow icon) — no subtitle on the landing hero
4. Real issuer card art from `app/public/cards/` floating in the background (idle drift)
5. On CTA click (sequenced): cards push-in then fly out → short pause (brand stays put) → brand anticipates opposite (down-right) then glides to **top-left** (single fixed element, no opacity fade / remount) → persona picker
6. Persona step: Duolingo-style flat characters for 3 sample personas + **Custom profile**; each persona shows **credit score** + varied **balance** on the statement; selecting reveals description + Chase-like auto-scrolling bank statement (category-colored tags) + **Connect bank account**
7. On Connect: persona UI exits; logo stays top-left; bank connect screen (no page scroll) → then architecture demo: OpenAI embedding (PII redacted copy) → Redis 3D embedding cloud (live fetch) → user vector → glowing top-10 KNN → **View recommendations**

## File map

- App root: `app/`
- Routes: `app/src/app/`
- Components: `app/src/components/`
- Brand assets: `app/public/brand/`
- Card art: `app/public/cards/`

## Do / Don't

**Do**
- Keep B/W dominant; accents sparse
- Use Source Sans 3 for UI; Georgia only for the Cardinal wordmark
- Use Lucide icons
- Add enter/hover/press/idle animations

**Don't**
- Use emoji
- Use squiggly/handwriting fonts for UI
- Overcrowd the hero
- Drive background cards with mouse by default
