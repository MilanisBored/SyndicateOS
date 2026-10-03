# SyndicateOS 💎

> **Institutional Unitized Investment Ledger & Wealth Operating System**  
> Designed for managing pooled syndicates and joint investments with partners, family, and co-investors with **100% mathematical fairness** using unitized Net Asset Value (NAV) accounting and live AMFI feeds.

---

## 🎯 The Core Problem This Solves

When multiple people (you, your partner, friends) invest together and **enter or exit at different times with different amounts**, conventional percentage or pro-rata tracking completely breaks down:
- **Scenario:** You put in ₹1,00,000. It doubles to ₹2,00,000 (+100%). Your friend joins later with ₹1,00,000. Total pool is ₹3,00,000.
- **The Pitfall of Simple Percentages:** If you simply split 2:1 or track raw contributions, past profits get diluted, or if the market drops, late entrants suffer losses for returns they never participated in.
- **The Solution (The Unitized NAV System):**
  Just like Mutual Funds, Hedge Funds, and Vanguard operate:
  1. The fund is partitioned into **Units** with a **Net Asset Value (NAV)** (starting base e.g. 100.00).
  2. When a participant deposits money, they buy units at the **prevailing NAV**:  
     $$\text{Units Issued} = \frac{\text{Deposit Amount}}{\text{Current NAV}}$$
  3. When asset valuations rise or fall, **total units remain invariant**, and the NAV moves up or down:  
     $$\text{NAV} = \frac{\text{Total Portfolio Value}}{\text{Total Fund Units}}$$
  4. When someone requests money back (redemption), they sell their units at the **current NAV**:  
     $$\text{Cash Out} = \text{Units Redeemed} \times \text{Current NAV}$$
  5. Everyone's balance, profit, and loss are mathematically isolated and 100% fair.

---

## 🚀 Key Features

### 1. 📊 Executive Dashboard
- **Total Combined Net Worth**: Live aggregated personal wealth (Your stake in the pool + Solo private assets).
- **Syndicate Pool AUM & Current Unit NAV**: Real-time fund valuation, total units issued, and all-time net gain.
- **Interactive SVG Growth Trajectory**: Interactive chart plotting NAV milestones over time with hover inspect.
- **Interactive Ownership Share Donut**: Live equity distribution slices between you, your girlfriend, and friends.

### 2. 👥 Syndicate Pool & Member Management
- Individual cards for each participant (Milan, Priya, Alex, Sameer...).
- Shows **Current Equity**, **Units Held**, **Net Profit/Loss**, **% ROI**, and **Ownership % of Pool**.
- One-click **+ Deposit** and **- Withdraw** modal with a **live interactive math preview** showing units impact before committing.
- Filterable & searchable audit ledger of every deposit, redemption, and revaluation.

### 3. 📄 Official Investor Statements & Slips
- **Printable / PDF Statement of Account**: Clean, executive layout ready to print or save to PDF for full transparency.
- **WhatsApp / Telegram Summary Generator**: One-click formatted summary to send directly to friends or partner.

### 4. 💼 Portfolio Underlying Holdings
- Track actual assets bought with the pool funds: **Equities / ETFs**, **Precious Metals (Gold)**, **Crypto**, **Liquid Cash Reserves**.
- **Sync to Fund NAV**: One-click button that recalibrates the fund NAV based on current holdings market prices.

### 5. 🪙 Personal Finances & Solo Assets
- Track personal cashflow: **Salary, Freelance UI/Fullstack gigs, Dividends**.
- Separate **Solo Assets** (Emergency FDs, EPF, private crypto hardware wallets) that are NOT mixed with pool funds.
- Visual wealth allocation gauge: compares what % of your wealth is in the pool vs in private accounts.

### 6. ⚙️ Settings, Multi-Currency & Local Privacy
- Multi-currency switcher: **₹ INR**, **$ USD**, **€ EUR**, **£ GBP**, **CA$ CAD**, **A$ AUD**, **S$ SGD**, **AED**.
- **100% Client-Side & Private**: All data stays securely in your browser's `localStorage`.
- **JSON Export & Import**: Download cold backups to your machine or restore them anytime.
- **Demo Data Toggle**: Reset to realistic demo scenario at any time.

---

## 🛠️ Tech Stack
- **Framework:** React 19 + Vite
- **Styling:** Custom CSS Design System with dark & light theme support, glassmorphism, glowing micro-animations
- **Iconography:** Lucide React
- **Celebration Effects:** Canvas Confetti

---

## 🏃 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open `http://localhost:5173/` in your browser.
