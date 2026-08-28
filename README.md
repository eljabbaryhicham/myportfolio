# MelliVision — Bilingual Portfolio

A feature-rich, bilingual (EN/FR) portfolio site built with **Next.js 16 (App Router)**, TypeScript, Tailwind, shadcn/ui, Firebase (Auth / Firestore / Storage), Cloudinary + Vercel Blob media, and GSAP/framer-motion animations. It ships a full admin panel for managing content and media.

> See **`PROJECT_MAP.md`** for the living architecture, stack, and change-log, and **`docs/CODE_REVIEW.md`** for code-review findings.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **UI:** Tailwind CSS, shadcn/ui (Radix), FontAwesome + Lucide, framer-motion
- **Backend:** Firebase (Auth, Firestore, Storage) with Firestore security rules
- **Media:** Cloudinary + Vercel Blob, Plyr / Clappr / HLS.js video players
- **Email:** Resend
- **AI:** Genkit (Google AI) flows for content/media operations
- **Testing / CI:** Vitest (`npm test`), GitHub Actions (typecheck / lint / test)

## Getting Started

```bash
npm install
npm run dev            # http://localhost:3000 (turbopack)
```

Other scripts:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server (turbopack) |
| `npm run build` | Production build (skips env validation) |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint over the repo |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run the Vitest suite |

## Running Locally

Copy `.env.example` to `.env.local` and fill in your Firebase project config, Cloudinary credentials, Resend API key, and Vercel Blob token. See `.env.example` for the full documented list of variables.

**Firebase Admin (server-side features):** Genkit flows and admin actions use the Firebase Admin SDK. Add your service-account key to `docs/service-account.json` **or** set the `FIREBASE_SERVICE_ACCOUNT_KEY` env var. This file is git-ignored (see `src/app/admin/actions.ts`). It resolves automatically on Vercel.

## Directory Layout

```
src/
├── app/             # App Router pages: / , /work, /about, /contact, /login, /register, /admin, /test
├── features/        # Domain modules: portfolio, admin, auth, contact
├── components/      # Shared + shadcn/ui components (layout, players, preloader)
├── lib/             # i18n (EN/FR), upload service, logger, video helpers, utilities
├── hooks/           # Reusable hooks (useMergedAutosave, useMediaProvider, …)
├── firebase/        # Client/admin init, realtime hooks (useDoc/useCollection), rules
├── ai/              # Genkit flows
└── app/api/         # Route handlers (uploads, admin actions)
```

## Security Notes

- `docs/service-account.json` and all `.env*` files are git-ignored — never commit them.
- A rotated Resend API key should be kept out of git (see `docs/CODE_REVIEW.md §1`).
- Firestore rules enforce a fail-closed `users/{uid}` write policy and per-field admin updates.
