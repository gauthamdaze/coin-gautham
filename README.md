# 💸 My Money — Personal Finance Dashboard

A modern, mobile-first personal finance dashboard with an iOS-style feel. Import your bank / debit-card and credit-card statements, categorise spending, set budgets, and see forecasts.

**Stack:** React 18 · Vite 5 · Tailwind CSS 3 · Recharts · Framer Motion · Zustand · SheetJS · Lucide icons

## ✨ Features

- **Home dashboard**: gradient hero card with animated totals, over-budget and at-risk alerts, a spending donut, Apple Watch-style rings, a spending-pace chart with month-end projection, budget progress, top merchants and an account split.
- **Activity**: iOS-style list grouped by day, search, filter chips, and bulk select. Tap a transaction to open a category sheet. **Apply to similar & remember** creates a rule for future imports. A + button adds cash transactions.
- **Budgets**: add, rename or delete categories, pick an icon and colour, and set a monthly budget with a slider. **Suggest budgets** uses your 3-month average. You can also manage the auto-categorisation rules here.
- **Insights**: income vs spending bars, savings trend line, a stacked chart of how your category mix changes over time, spending by weekday, an account pie chart, a next-month forecast per category, and your biggest spends.
- **Import**: CSV / XLS / XLSX statements, with the columns detected automatically (HDFC, ICICI, SBI, Axis, Kotak and credit-card formats). You can fix the column mapping and see a preview before importing. Duplicates are skipped.
- **No double counting**: credit-card bill payments are filed as *transfers*, so importing both the bank and the card statement doesn't count spending twice.
- **Forecast**: next month = 50% this month (projected to month-end) + 30% last month + 20% the month before, per category.
- Dark mode (follows the system setting), spring animations, swipe-down sheets, reduced-motion support, installable as a PWA.
- **Privacy**: all data stays in your browser (localStorage). Use **Download backup** / **Restore backup** to move it between devices.

## 🚀 Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

## ▲ Deploy to Vercel

1. Push this folder to a new GitHub repository:
   ```bash
   git init && git add . && git commit -m "My Money dashboard"
   git branch -M main
   git remote add origin https://github.com/<you>/my-money.git
   git push -u origin main
   ```
2. On [vercel.com](https://vercel.com) choose **Add New → Project**, import the repo, and click **Deploy**. `vercel.json` already sets the Vite build command and the `dist` output folder.

Or use the CLI: `npm i -g vercel && vercel --prod`.

## 📁 Structure

```
src/
  App.jsx                 # shell: sidebar (desktop), tab bar (mobile), header, page transitions
  pages/                  # Home, Activity, Budgets, Insights, Import
  components/
    ui.jsx                # Card, Sheet (bottom sheet), Rings, Progress, AnimatedNumber, Segmented, Toasts…
    charts.jsx            # Donut, PaceChart, TrendBars, SavingsLine, WeekdayBars, CategoryMix, MiniPie
    Illustrations.jsx     # original SVG illustrations (free to use)
  lib/
    store.js              # Zustand store (persisted to localStorage) + UI state
    analytics.js          # monthly summaries, projections, forecasts
    parser.js             # statement parsing (CSV/XLSX, Indian date & Dr/Cr formats)
    categorize.js         # keyword rules engine
    defaults.js           # categories, colours, icons, starter rules
    sample.js             # 6 months of realistic sample data
```

## 🛣️ Roadmap

- **Cloud sync** (e.g. Supabase / Firebase) so data follows you across devices
- **Bank e-mail parsing**: Gmail API for transaction alerts and e-statements
- **SMS alerts**: an Android companion app or SMS-forwarding webhook
- **Account Aggregator** (RBI AA framework) through a licensed FIU partner (e.g. Setu, Finvu, OneMoney)
- PDF statement parsing
