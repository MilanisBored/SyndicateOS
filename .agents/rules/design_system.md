# Design Guidelines & Constraints

## Strict Constraints:
1. **NO ICONS OR EMOJIS**:
   - Do NOT use Lucide, FontAwesome, SVG icon sets, or emojis in core UI.
   - Use clean, precise text buttons and monospace labels (e.g. `Edit`, `Del`, `+ New Position`, `Export CSV`, `[ACTIVE]`).
2. **MONOCHROME MINIMALIST FINTECH PALETTE**:
   - Dark Canvas: `#09090b` (`--bg-app`)
   - Surface/Cards: `#121215` (`--bg-surface`)
   - Borders: `#27272a` (`--border-subtle`), `#3f3f46` on hover
   - Text Primary: `#f4f4f5`, Text Secondary: `#a1a1aa`, Text Muted: `#71717a`
   - Primary Accent: Pure high-contrast `#f4f4f5` button with `#09090b` text.
   - Profit: `#22c55e` (used only for positive gains/returns).
   - Loss: `#ef4444` (used only for negative drawdowns/withdrawals).
3. **TYPOGRAPHY**:
   - Sans: `'Inter', -apple-system, sans-serif`
   - Monospace: `'JetBrains Mono', monospace` (`.mono` class) for all numbers, currency, NAV, units, dates, IDs.
4. **HIGH DENSITY & COMPACT SPACING**:
   - No unnecessary whitespace or giant hero banners in dashboard.
   - Keep table rows compact (`.dense-table`).
