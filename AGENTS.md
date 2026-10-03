# SyndicateOS Design System & UI Rules

## 1. Core Visual Philosophy
- **Aesthetic:** Minimalist, high-density, institutional monochrome fintech (inspired by Linear, Apple, and Terminal UI).
- **Density:** Compact padding, clean borders, zero cartoonish illustrations, zero decorative glows, zero heavy dropshadows, zero gradients.
- **Typography-First:** Use pure semantic text, tabular numbers, badges, and micro-labels.

---

## 2. STRICT RULE: NO ICONS OR EMOJIS IN CORE UI
- **DO NOT** use icon libraries (e.g. Lucide, FontAwesome, Material Icons, Feather).
- **DO NOT** sprinkle random emojis (🚀, 📈, 💰, 📊, 🪙, 💎) into buttons, table headers, stat cards, or nav bars.
- **Action Elements:** Use clear, concise text labels instead of icons:
  - Use `"Search"` or `"Filter"` instead of magnifying glass icons.
  - Use `"+ New Position"` or `"+ Deposit"` instead of `+` icons.
  - Use `"Edit"`, `"Delete"`, `"Cancel"` instead of pencil/trashcan icons.
  - For directional pagination, use clean unicode arrows: `"← Prev"` and `"Next →"` or `">"`.
  - For status indicators, use clean monospace text badges: `[ACTIVE]`, `[VERIFIED]`, `[PENDING]`, `[DIRECT]`.

---

## 3. Official Color Palette & Tokens

### Dark Mode (Default)
| Token | Hex / Value | Description |
| :--- | :--- | :--- |
| `--bg-app` | `#09090b` | App canvas background |
| `--bg-surface` | `#121215` | Cards, modals, elevated surfaces |
| `--bg-subtle` | `#18181b` | Secondary buttons, dropdowns, table sub-bars |
| `--bg-input` | `#18181b` | Input and select field backgrounds |
| `--bg-hover` | `#222226` | Hover state for rows and interactive items |
| `--border-subtle` | `#27272a` | Default structural borders (1px solid) |
| `--border-hover` | `#3f3f46` | Hover borders |
| `--border-focus` | `#71717a` | Focus ring / active inputs |
| `--text-primary` | `#f4f4f5` | Headings, primary metrics, high contrast |
| `--text-secondary` | `#a1a1aa` | Labels, captions, secondary details |
| `--text-muted` | `#71717a` | Table headers, timestamps, subtle IDs |
| `--accent` | `#f4f4f5` | High-contrast white buttons & highlights |
| `--accent-invert` | `#09090b` | Text on accent buttons |
| `--profit` | `#22c55e` | Positive returns & deposits |
| `--profit-subtle` | `rgba(34, 197, 94, 0.1)` | Green badge fill |
| `--loss` | `#ef4444` | Negative returns & withdrawals |
| `--loss-subtle` | `rgba(239, 68, 68, 0.1)` | Red badge fill |

### Light Mode (`[data-theme='light']`)
| Token | Hex / Value | Description |
| :--- | :--- | :--- |
| `--bg-app` | `#ffffff` | Pure white app background |
| `--bg-surface` | `#fafafa` | Surface card background |
| `--bg-subtle` | `#f4f4f5` | Input/subtle button background |
| `--border-subtle` | `#e4e4e7` | Standard borders |
| `--border-hover` | `#d4d4d8` | Hover borders |
| `--text-primary` | `#09090b` | Dark primary text |
| `--text-secondary` | `#52525b` | Medium dark secondary text |
| `--text-muted` | `#a1a1aa` | Muted captions |
| `--profit` | `#16a34a` | Green profit indicator |
| `--loss` | `#dc2626` | Red loss indicator |

---

## 4. Typography Standards
- **Sans-Serif Font:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - Used for headings, body copy, descriptions, buttons.
- **Monospace Font:** `'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace`
  - Class name: `.mono`
  - MUST be used for: All currency values, NAV numbers, units, percentages, transaction dates, timestamps, scheme codes, and user codes.
  - Tabular numerals enabled: `font-feature-settings: 'tnum' on, 'zero' on`.

---

## 5. UI Component Guidelines

### Buttons (`.btn`)
- `.btn-primary`: Background `--accent` (`#f4f4f5`), text `--accent-invert` (`#09090b`). No icons.
- `.btn-secondary`: Background `--bg-subtle`, border `--border-subtle`, text `--text-primary`.
- `.btn-danger-subtle`: Background `--loss-subtle`, text `--loss`, border `rgba(239, 68, 68, 0.25)`.
- `.btn-sm`: `padding: 4px 8px; font-size: 11px;` (for table actions: Edit, Del, + SIP).

### Badges (`.badge`)
- Compact, border-radius 3px (`--radius-xs`), font size 10–11px, font weight 500.
- `.badge-neutral`: Mono text, `--bg-subtle`, border `--border-subtle`.
- `.badge-profit`: Green subtle background with green text (`+12.4%`).
- `.badge-loss`: Red subtle background with red text (`-3.2%`).

### Tables (`.dense-table`)
- Headers (`th`): uppercase/muted text (`--text-muted`), font size 11px, font weight 500, `border-bottom: 1px solid var(--border-subtle)`.
- Cells (`td`): font size 12px, padding `9px 12px`.
- Numbers formatted in `.mono`.
- Hover state: `background: var(--bg-hover)`.

### Modals (`.modal-overlay` & `.modal-content`)
- Background: `--bg-surface`, border: `1px solid var(--border-subtle)`.
- Max-width: 520px (standard) or 640px (wide).
- Clean backdrop blur: `rgba(0, 0, 0, 0.65)`, `backdrop-filter: blur(4px)`.
- Mobile responsiveness: Bottom sheet drawer on `< 640px` with iOS safe area inset padding.

---

## 6. Deviation Prevention Checklist for AI
1. Did I add any SVG icons, Lucide icons, or emoji symbols? **-> REMOVE THEM. Use semantic text labels.**
2. Did I use colored buttons like blue, purple, or orange? **-> REVERT TO MONOCHROME `--accent` / `--bg-subtle`.**
3. Did I add any radial gradient glows or glassmorphic blur blobs? **-> KEEP PURE `#09090b` / `#121215`.**
4. Are all financial metrics, NAV, quantities, and dates styled with `.mono`? **-> YES.**
5. Is the design clean, dense, responsive, and functional? **-> YES.**
