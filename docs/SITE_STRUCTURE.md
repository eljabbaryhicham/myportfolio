# Site Structure

Overview of how the MelliVision portfolio site is wired up.

## Framework

- Next.js (App Router), React 18, TypeScript, Tailwind CSS
- Firebase Auth + Firestore (client) and Firebase Admin (server)
- framer-motion, Embla Carousel, GSAP, react-hook-form + zod

## Root layout

`src/app/layout.tsx`

- Server-seeded on every request: homepage settings + trusted-by clients + contact info.
- `<AppShell>` mounts the shared Settings / TrustedBy / Contact providers (server seed + live `useDoc` subscription).
- i18n EN/FR, theme/fonts, pre-hydration scripts, preconnects to Firestore and media CDNs.

## Routes

```
/          Home page (hero video, animated logo, trusted-by carousel)
/work      Projects grid, video popup/detail, download
/about     About page (logo, text, "What We Provide" cards, client logos)
/contact   Contact page + form (POSTs to /api/send-email)
/login     Firebase Auth sign-in
/register  Firebase Auth sign-up + user-doc claim
/admin     Protected, tabbed admin app
/test      Sandbox page
/not-found · robots · sitemap · opengraph
```

### Admin (/admin)

Protected tabbed client app; each tab is dynamically imported. Tabs are shown
based on role/permissions (`canEdit*`, `canUploadMedia`, superadmin).

```
HOME     HomeAdmin      hero video, logo, fonts, theme, site settings
PROJECTS ProjectAdmin   CRUD + ordering on the `projects` collection
ABOUT    AboutAdmin     page text, logo, clients, and "What We Provide" cards
           ├─ Edit Page Content dialog
           │    • logo URL + scale, heading, paragraph, image
           │    • What We Provide Cards — add/edit/reorder/remove;
           │      per card: icon image (or built-in line icon), EN/FR title + description
           └─ ClientAdmin — logo carousel clients (+ order, visibility, bulk delete)
CONTACT  ContactAdmin   email/phone/socials + email-template config
MEDIA    Media library  tabs: Cloudinary · Vercel Blob · Appwrite · Gumlet · ImageKit
ADMINS   AdminManagement  users, roles, content permissions (superadmin only)
```

## Public feature modules

```
src/features/portfolio   Home page (hero logo, video, trusted-by carousel)
src/features/work        Work page (grid, popup, download)
src/features/about       About page (logo, text, services grid, client logos)
src/features/contact     Contact page + form
src/features/auth        Login / Register
src/features/admin       Admin components and hooks
```

## Data layer (Firestore collections)

```
projects           → served to /work (order, visibility)
clients            → About carousel
about/content      → About text, logo, and What We Provide cards
homepage/settings  → theme, hero logo, fonts, headings (AppShell seed)
contact/details    → contact page + footer info
users              → role/permissions (admin gates via rules + server checks)
media, vercel_blobs, media_meta, gumlet_images, imagekit_media
                   → media library metadata across providers
_migrations        → one-time data migrations
```

## External services

Firebase Auth + Firestore · Cloudinary · Vercel Blob · Appwrite · Gumlet · ImageKit
Uploads/deletes go through signed, admin-gated, rate-limited API routes
(`src/lib/rate-limit.ts`).