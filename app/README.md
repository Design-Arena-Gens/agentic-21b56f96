# Aurora Finance

Aurora Finance is a cross-platform personal finance experience designed with responsive layouts inspired by Material Design (Android) and Apple Human Interface Guidelines. It blends dashboards, transaction workflows, budgeting, and premium automation in a deploy-ready Next.js application for Vercel.

## ✨ Highlights

- **Secure auth demo** covering email/password sign-up, sign-in, and password reset (client-side persistence for prototyping).
- **Insightful dashboard** summarizing daily, monthly, and yearly cash flow with interactive charts, net change trends, and budget utilization indicators.
- **Full transaction desk** for manual entries, receipt uploads, premium bank-import simulation, and categorized activity feeds with search filters.
- **Budgeting studio** to set monthly limits, premium rollover rules, and alert thresholds with live progress meters.
- **Profile center** controlling subscription tier, currency, notifications, dark mode, haptic feedback, and premium email analytics scheduling.
- **Freemium model** toggling automations, PDF reporting, custom categories, and priority support for premium members.

## 🛠 Stack

- [Next.js 16](https://nextjs.org/) App Router with TypeScript
- Tailwind CSS v4 with custom design tokens and glassmorphism accents
- Zustand for persistent client state management
- React Hook Form + Zod for accessible validation
- Recharts for responsive data visualizations
- jsPDF + autoTable for premium financial report exports
- Framer Motion for micro-interactions and Next Themes for light/dark parity

## 🚀 Local Development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to explore the app. Create an account to unlock the authenticated experience. Premium features (automations, PDF export, analytics email scheduling) are simulated locally.

## 📦 Scripts

- `npm run dev` – start the development server
- `npm run build` – compile the production bundle
- `npm run start` – serve the production build
- `npm run lint` – lint the codebase

## 🧪 Demo Tips

- Default categories are seeded on sign-up. Upgrade to Premium (Profile → Subscription) to enable custom categories, import automations, and PDF reporting.
- Use the Transactions workspace to add expenses with receipt images. Premium bank imports populate synthetic entries for trend analysis.
- Generate PDF statements from the Dashboard (Premium) and trigger weekly/monthly email analytics from Profile.

## 📱 Experience Goals

- Minimum 44×44 touch targets, safe-area padding, and responsive breakpoints tuned for mobile and tablet viewports.
- Accessible color contrast, semantic HTML, and keyboard-visible focus states across interactive controls.

## ⚠️ Disclaimer

The current implementation stores all data client-side to support rapid prototyping. Integrate a secure backend, production-grade authentication, and real banking connectors before releasing to end users.
