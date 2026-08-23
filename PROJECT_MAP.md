# PROJECT_MAP — Liquid Folio

> Last updated: 2026-08-21

---

## [TECH_STACK]

| Layer | Technology | Version (installed/wanted/latest) | Status |
|-------|-----------|----------------------------------|--------|
| Framework | Next.js | 16.2.6 | ✅ Stable |
| Language | TypeScript | ^5 | ✅ |
| Styling | Tailwind CSS | ^3.4.1 | ✅ |
| UI Library | shadcn/ui (Radix primitives) | Radix ^1.2+ | ✅ |
| Animation | framer-motion | ^11.2.10 (w: 11.18.2, l: 12.38.0) | ⚠️ Outdated |
| Icons | FontAwesome 6 + Lucide | ^6.5.2 (w: 6.7.2, l: 7.2.0) | ⚠️ Outdated |
| Carousel | Embla Carousel | ^8.6.0 | ✅ |
| Forms | react-hook-form + zod | ^7.54.2 / ^3.24.2 | ✅ |
| Backend/Database | Firebase Firestore | ^11.9.1 (w: 11.10.0, l: 12.13.0) | ⚠️ Outdated |
| Auth | Firebase Auth | same as above | ⚠️ Outdated |
| Storage | Firebase Storage | same as above | ⚠️ Outdated |
| Video Players | Plyr + Clappr + HLS.js | ^3.7.8 / CDN / ^1.5.11 | ✅ |
| Lottie | lottie-react | ^2.4.0 | ✅ |
| Charts | recharts | ^2.15.1 | ✅ |
| AI | Genkit (Google AI) | ^1.20.0 | ✅ |
| Email | Resend | ^3.4.0 | ✅ |
| Media | Cloudinary SDK | ^2.2.0 (l: 2.10.0) | ⚠️ Outdated |

### Deprecated / Unused Risk
- `date-fns` ^3.6.0 (latest: 4.1.0) — breaking changes likely
- `dotenv` ^16.4.5 (latest: 17.4.2) — breaking changes likely
- `firebase-admin` ^12.2.0 (latest: 13.9.0) — breaking changes likely

---

## [ARCHITECTURE]

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout: Firebase, BG, Theme, Nav
│   ├── page.tsx                  # Homepage (/)
│   ├── work/page.tsx             # Portfolio grid + detail dialogs (/work)
│   ├── about/page.tsx            # About page (/about)
│   ├── contact/page.tsx          # Contact page (/contact)
│   ├── login/page.tsx            # Admin login (/login)
│   ├── register/page.tsx         # Admin register (/register)
│   ├── admin/page.tsx            # Admin dashboard (/admin)
│   └── test/page.tsx             # Test page (/test)
├── features/                     # Domain-driven feature modules
│   ├── portfolio/                # Homepage + portfolio data types
│   ├── admin/                    # Admin components (CRUD for all collections)
│   ├── auth/                     # Login/Register pages
│   └── contact/                  # Contact form + page
├── components/                   # Shared components
│   ├── ui/                       # shadcn/ui primitives (32 components)
│   ├── layout/                   # Nav, conditional layout, layout provider
│   ├── PlyrPlayer.tsx            # Plyr video wrapper
│   ├── CdnClapprPlayer.tsx       # Clappr video wrapper
│   ├── preloader.tsx             # Lottie loading animation
│   ├── logo.tsx                  # Logo image component
│   ├── ScrollIndicator.tsx       # Mobile scroll-down indicator
│   └── icon.tsx                  # FontAwesome icon wrapper
├── firebase/                     # Firebase abstraction layer
│   ├── config.ts                 # Firebase config
│   ├── index.ts                  # Re-exports
│   ├── provider.tsx              # Context provider
│   ├── client-provider.tsx       # Client-side init
│   ├── errors.ts                 # Error types
│   ├── error-emitter.ts          # Error event system
│   ├── non-blocking-updates.tsx  # Async Firestore writes
│   ├── non-blocking-login.tsx    # Auth methods
│   ├── auth/use-user.tsx         # User hook
│   └── firestore/                # Firestore hooks
│       ├── use-collection.tsx
│       └── use-doc.tsx
├── hooks/                        # Custom hooks
│   ├── use-mobile.tsx
│   ├── use-is-extra-wide.tsx
│   └── use-toast.ts
└── lib/                          # Utilities + static assets
    ├── utils.ts                  # cn() utility
    ├── preloader-animation.json  # Lottie JSON
    ├── arrow-animation.json      # Lottie JSON
    └── placeholder-images.json   # Placeholder data
```

### Firebase Collections (Firestore)
| Collection | Purpose | Admin-managed |
|-----------|---------|---------------|
| `projects` | Portfolio items (images/videos) | ✅ |
| `contact` / `details` | Contact info, social links, logo | ✅ |
| `homepage` / `settings` | BG media, theme color, player, toggles | ✅ |
| `about` / `content` | About page text, logo, scaling | ✅ |
| `clients` | Client logos carousel | ✅ |
| `media` | Uploaded media assets | ✅ |
| `admins` | Admin user management | ✅ |

---

## [SYSTEM_FLOW]

### User Journey
```
Landing (/) → View Work (/work) → Filter by type → Click item → Detail Dialog
                                                                    ├── Previous/Next navigation
                                                                    ├── Fullscreen image
                                                                    ├── Show Project Details
                                                                    └── Ask About (contact form)
About (/about) → Services grid → Client carousel → Contact CTA
Contact (/contact) → Contact form → Email API → Success → WhatsApp option
Login (/login) → Admin panel (/admin)
```

### Admin Journey
```
Login → Admin Dashboard
       ├── Home Settings (BG, theme, player, logo, test toggle)
       ├── Projects (CRUD, reorder, player switch)
       ├── Media Library (upload, select)
       ├── Clients (CRUD, order)
       ├── About (edit content, logo scale)
       ├── Contact (edit info, social links)
       └── Admin Management (add/remove admins)
```

### Data Flow
```
Firebase Firestore ← useDoc/useCollection hooks → React components
                          ↕
            setDocumentNonBlocking / addDocumentNonBlocking
                          ↕
                   Admin form components
```

---

## [CHANGE_LOG]

| Date | Change | Status |
|------|--------|--------|
| 2026-05-14 | M1.1: Moved FirebaseClientProvider out of `<head>` into `<body>` | ✅ |
| 2026-05-14 | M1.2: Removed dead `@apply border-border` override in globals.css | ✅ |
| 2026-05-14 | M1.3: Fixed Logo component to apply `className` prop | ✅ |
| 2026-05-14 | M1.4: Extracted `DEFAULT_LOGO_URL` constant, replaced 5+ hardcoded references | ✅ |
| 2026-05-14 | M2.1: Added hero tagline + subtitle to homepage | ✅ |
| 2026-05-14 | M2.2: Added scroll hint below CTA on homepage | ✅ |
| 2026-05-14 | M3.1: Added lightweight non-blocking logger (`src/lib/logger.ts`) | ✅ |
| 2026-05-14 | M3.3: Added empty state for work page | ✅ |
| 2026-05-14 | M3.4: Removed `text-justify` on About page | ✅ |
| 2026-05-14 | M4.3: ESLint configured (0 errors), production build passes | ✅ |
| 2026-05-14 | FIX: Node.js v25 localStorage polyfill (Firebase SSR crash) | ✅ |
| 2026-05-14 | FIX: Theme color flash — cached in localStorage, restored inline | ✅ |
| 2026-05-14 | Added `meta[name="theme-color"]` for browser chrome | ✅ |
| 2026-05-15 | Updated Cloudinary credentials in .env (new primary library) | ✅ |
| 2026-05-15 | M4.2: Fixed ESLint warning — wrapped `updateUrl` in `useCallback` | ✅ |
| 2026-05-15 | Moved Google Fonts `<link>` → `@import` in globals.css (fix no-page-custom-font) | ✅ |
| 2026-05-15 | Suppressed `@next/next/no-img-element` in PlyrPlayer watermark | ✅ |
| 2026-05-15 | feat: add Vidstack player as third option in Work Page Video Player | ✅ |
| 2026-08-21 | FIX: nav bar flash/jump on refresh — `useIsMobile` syncs from `matchMedia` on first render; AppNav reserves logo slot | ✅ |
| 2026-08-21 | FIX: work page "No projects yet" during load — removed server `orderBy('order')` (excluded docs lacking the field), client-side sort | ✅ |
| 2026-08-21 | FIX: cold-session empty-state flash — projects query gated on auth settle (`isUserLoading`); `useCollection` ignores cache-only empty snapshots; fetch errors keep preloader + toast instead of fake empty state | ✅ |
| 2026-08-21 | FIX: residual transient-empty flash — work page requires a confirmed-empty result to persist 2s before showing "no projects" (filter-specific empties still instant) | ✅ |
| 2026-08-21 | PERF: /work route — auth-only gate (skips profile-doc wait); Plyr (hls.js) + ContactForm lazy-loaded out of initial chunk; contact page renders form instantly, info card streams in | ✅ |
| 2026-08-21 | PERF: menubar logo hydrates instantly from localStorage cache instead of waiting on Firestore docs | ✅ |
| 2026-08-21 | UI: default preloader fallback GIF swapped to honey badger animation | ✅ |
| 2026-08-21 | PERF: contact route — removed redundant next/dynamic wrapper (chunk waterfall + broken Link prefetch); ContactPage now statically imported and preferrable | ✅ |
| 2026-08-21 | PERF: shared `useCachedDoc` hook (localStorage mirror of useDoc); contact info card + social links hydrate instantly on repeat visits, socials animation delay 0.6s → 0.15s | ✅ |
| 2026-08-21 | FIX: homepage — content stagger animation now waits for preloader exit; overlay crossfades out (0.35s) instead of hiding finished animations | ✅ |
| 2026-08-21 | FIX: contact — cold load (no cache + pending Firestore) now shows a large centered preloader over the whole content area, not a small side-slot spinner | ✅ |
| 2026-08-22 | REFACTOR: contact page adopts the About page loading pattern exactly — plain `useDoc`, full-area `min-h-[50vh]` preloader until Firestore answers, then cards + socials animate in; removed `useCachedDoc` smart-hydration (hook deleted) | ✅ |
| 2026-08-22 | FEATURE: admin Home panel — new "Menubar Logo URL" field on `homepage/settings` (`menubarLogoUrl`), with media-library picker + EN/FR labels; navbar prefers it and falls back to homepage logo → contact logo → localStorage cache | ✅ |
| 2026-08-22 | FIX: mobile background video disappearing — `useDoc` no longer treats cache-only empty snapshots (mobile suspend/resume) as deletions, matching the `useCollection` guard; video layer promoted with `translateZ(0)` + `preload=auto` against iOS compositing drops | ✅ |
| 2026-08-22 | FEATURE: project details popup now renders Markdown + raw HTML media (`react-markdown` + `remark-gfm` + `rehype-raw`, sanitized via `rehype-sanitize` schema extended for `<video>/<audio>/<source>`); responsive media CSS in globals.css; legacy single-newline text preserved via `breaks: true`. Installed `react-markdown` + `remark-gfm` | ✅ |
| 2026-08-22 | FEATURE: `<video>` embeds inside project details play through the work page's chosen player (`workPagePlayer`: Plyr incl. YouTube/Vimeo URLs, or Clappr) via memoized `ProjectDetailsContent` renderer; autoplay off, sized 16:9 | ✅ |
| 2026-08-22 | FIX: multiple videos in project details — self-closing `<video ... />` parsed as one unclosed tag nesting all following videos inside the first (only 1 player shown); preprocessor rewrites to explicit `<video></video>` pairs + `<source>` child support | ✅ |
| 2026-08-22 | FEATURE: work page cards preview media on hover — videos play a muted looping native `<video>` over the thumbnail, images crossfade to the full source; skipped on touch devices and HLS sources; unmounts on leave to free decoders | ✅ |
| 2026-08-22 | FEATURE: admin media library copy button is now a delivery-format menu (EN/FR) — stored URL / original (transforms stripped) / auto-optimized; images: WebP·AVIF·JPG·PNG; videos: MP4·WebM·HLS (rebuilds the `sp_auto` `.m3u8` derivative URL from any stored variant) via Cloudinary transforms | ✅ |
| 2026-08-22 | FIX: format-menu links always delivered mp4 — variants now built from a stripped base (no chained stored transforms) with a single explicit `f_<fmt>,q_auto,fl_attachment` transform + synced extension, forcing download of the exact requested format | ✅ |
| 2026-08-22 | FEATURE: project form — optional "Hover Preview Media URL" (`previewUrl`) with media-library picker + EN/FR labels; work page card hover previews use it and fall back to the main `sourceUrl` when empty (also unblocks HLS-only projects by allowing an mp4 preview) | ✅ |
| 2026-08-22 | FEATURE: "Show Project Details" button gets a small `circle-exclamation` badge (top-right, yellow, EN/FR tooltip) only when details contain media (`<video>/<audio>/<img>` tags or Markdown images); hidden for text-only details | ✅ |
| 2026-08-22 | TWEAK: default preloader size fallback 25 → 15 (all loader variants + admin form default/reset); Firestore `preloaderSize` still overrides when set | ✅ |
| 2026-08-22 | FIX: details-embedded videos overflowed their player frame — player root pinned with `[&>*]:absolute [&>*]:inset-0` inside the 16:9 box so Plyr/Clappr internals resolve against a sized, positioned parent | ✅ |
| 2026-08-22 | FIX: details videos STILL overflowed — globals.css `.project-details video { height:auto; width:100% }` was overriding Plyr/Clappr internal sizing; rule removed (img-only responsive rules kept) | ✅ |
| 2026-08-22 | FIX: deleting media from the library left assets in Cloudinary — new server flow `src/ai/flows/delete-media.ts` (signed `uploader.destroy`, `invalidate:true`, per-library env suffix `_1`/`_2`); wired into single + bulk delete (Cloudinary first, then Firestore doc; warning toast if remote cleanup fails, EN/FR). NOTE: assets orphaned BEFORE this fix must be removed manually once | ✅ |
| 2026-08-22 | CONFIG: contact form email switched to custom domain — send + receive via `contact@mellivision.com` (Resend domain verified; inbox on Zoho Mail); was gmail + `onboarding@resend.dev` sandbox | ✅ |
| 2026-08-22 | FEATURE: editable contact-email template — Admin → Home → "Contact Email Template" textarea (autosaves to homepage/settings.emailTemplateHtml), placeholder chips `{{name}}/{{email}}/{{message}}`, live preview dialog (sandboxed iframe w/ sample data), reset-to-default; shared default in `src/lib/default-email-template.ts`; send-email route loads template server-side with default fallback + HTML-escapes visitor input before injection (EN/FR) | ✅ |
| 2026-08-22 | FIX: deployed site always sent the DEFAULT email template — route used Firebase Admin SDK whose `docs/service-account.json` is gitignored (absent on the server), so the settings read failed silently; now reads `homepage/settings` via public Firestore REST API (doc is publicly readable) | ✅ |
| 2026-08-22 | FEATURE: automatic auto-reply to the visitor — second Resend email ("We have received your message", reply_to contact@) sent right after the admin notification; new editable "Customer Auto-Reply Template" card in Admin → Home (`autoReplyTemplateHtml`, REST-loaded, same `{{name}}/{{email}}/{{message}}` placeholders + preview + reset); default in `default-email-template.ts`; auto-reply failure never blocks the submission (EN/FR) | ✅ |
| 2026-08-22 | FIX: sender display name "BELOFTED" → "MelliVision" on both contact emails (notification + auto-reply) | ✅ |
| 2026-08-22 | CONTENT: default email templates replaced with MelliVision-branded versions (Cloudinary logo, "To Be Replied ASAP.", 2026 rights line); fixed typos (MelliVisioin/Resirved) + dropped `fl_attachment` from logo URL so clients render it inline; to activate in Firebase use each card's "Reset to Default" | ✅ |
| 2026-08-22 | CONFIG: customer messages now delivered to BOTH `contact@mellivision.com` AND `eljabbaryhicham@gmail.com`; auto-reply unchanged (sent only to the visitor, from the business address) | ✅ |
| 2026-08-22 | FIX: notification email still showed "BELOFTED" sender — earlier rename missed it (indent mismatch); now both emails send as "MelliVision" | ✅ |
| 2026-08-22 | FEATURE: scroll-arrow animation (mobile, About+Contact) now admin-controlled — Home tab: enable/disable switch + custom Lottie JSON/GIF URL (`isArrowAnimationEnabled` / `arrowLottieUrl`, library picker, EN/FR); ScrollIndicator reads homepage/settings itself and falls back to built-in arrow-animation.json | ✅ |
| 2026-08-22 | FIX: details videos STILL overflowed the player frame — root cause: Clappr/Plyr inject wrappers with inline sizes computed at init (wrong when dialog animating); new `.details-video-frame` CSS forces every nested layer (`player-wrapper`/`data-container`/`video`/plyr internals) to 100%×100% with `object-fit:contain`; also stabilized Clappr container id (was `Math.random()` per render, could desync `parentId` mid-init) | ✅ |
| 2026-08-22 | FIX: Plyr YouTube/Vimeo embeds overflowed too — they render as `<iframe>`, not `<video>`; added iframe sizing rule to `.details-video-frame` | ✅ |
| 2026-08-22 | FIX (mobile): details videos could still ignore percentage sizing on iOS/Safari — video/iframe now anchored absolute inside their wrapper so they can never exceed the frame; upload strip in the media-picker dialog made responsive (stacked layout <sm, full-width button, truncating progress text) | ✅ |
| 2026-08-22 | FIX: details video sat slightly low in the Plyr frame (mobile) — media now pinned with `inset:0 !important; margin:0 !important`, removing any margin/offset influence | ✅ |
| 2026-08-22 | FEATURE: per-video player width in project details — `width` attribute on embedded `<video>` ("70" → 70%, "70%", "320px"; sanitized values only), frame centers with `mx-auto`; default stays full width | ✅ |
| 2026-08-22 | FEATURE: new projects start with a Details template (Project Name / Type / Realisation Time / Video Duration / Tools Used / Realisateur : MelliVision | Driven By Detail); existing projects untouched | ✅ |
| 2026-08-22 | FIX+UX: homepage/website background switching was unreliable — ID-based lookup required hidden `projects` docs (regular videos silently failed); now stores direct URLs (`homePageBackgroundUrl` / `websiteBackgroundUrl`, legacy mediaId kept as fallback); Home tab dropdowns replaced with URL input + "choose from library" picker (tab follows type radio); MediaAdmin "Set as Background" writes URL too; `<source type=mp4>` → direct `src` so f_auto/WebM works | ✅ |
| 2026-08-22 | FIX: backgrounds still never rendered — SiteBackground guard required truthy `backgroundMediaId`, blocking the new URL-only flow; guard now checks `mediaUrl` only. UX: Homepage + Other-Pages background settings merged into ONE "Backgrounds" section (sub-headed) | ✅ |
| 2026-08-22 | FIX: image backgrounds never saved — HomeAdmin autosave used one shared debounce that wrote only the LAST changed field, dropping the URL when type was switched <500s after picking; autosave now batches ALL pending fields into one merged write. Also anchored next/image `fill` to its own container (`relative`) | ✅ |
| 2026-08-22 | UX: two email-template cards merged into one "Email Templates" section (Notification + Auto-Reply sub-headings). BRANDING: browser title "Liquid Folio" → "MelliVision"; new `DynamicFavicon` keeps the tab icon synced to admin logo (menubar → homepage fallback). NOTE: auto-reply only ever sends to the visitor's own address — testing with your gmail makes gmail the recipient | ✅ |
| 2026-08-23 | FIX: "Add from URL" media upload crashed in production ("docs/service-account.json is missing") — flow no longer needs Firebase Admin at all: server does ONLY the Cloudinary transfer and returns metadata; AddFromUrlDialog writes the Firestore `media` doc via the client SDK (same path as normal file uploads). `initializeServerApp` kept as fallback util with credential order: FIREBASE_SERVICE_ACCOUNT_KEY env var → optional local docs/service-account.json → Application Default Credentials | ✅ |
| 2026-08-23 | FIX: details-popup video preloader was unreliable (hid before the frame rendered, or lingered after) — Clappr/Plyr spinners were dismissed on player-READY events which don't reflect visible frames. Both players now hide the preloader from real `<video>` signals: `loadeddata`/`canplay`/`playing`, an immediate `readyState >= 2` check (covers already-buffered), and Clappr's async tag injection is covered by a short poll; Plyr keeps 'ready' only for YouTube/Vimeo embeds. V2: data events still left a black gap before paint — spinners now dismiss on `requestVideoFrameCallback` (frame actually presented on screen) with `playing` + canplay+300ms grace fallback and a 10s safety cap. V3: residual ~0.2s black flash was the 300ms opacity fade blending video with the black bg — fades removed (instant swap) and settle deferred one extra animation frame after rVFC | ✅ |
| 2026-08-23 | FIX: videos/images added via URL were unplayable ("browser doesn't support video playback") — flow built Cloudinary URLs WITHOUT a file extension (video delivery requires one → 404). Now derives delivery URLs from `secure_url` with `/upload/f_auto,q_auto/` (or `f_webm,q_auto`) substitution, preserving the extension exactly like direct uploads. NOTE: entries added before this fix have dead URLs — delete and re-add them | ✅ |
| 2026-08-22 | FEATURE: favicon admin field — `faviconUrl` on homepage/settings (Home tab, input + library picker), DynamicFavicon precedence: faviconUrl → menubarLogoUrl → homePageLogoUrl. FEATURE: per-page content overrides — new reusable `PageTextEditor` (autosaves text fields to homepage/settings) mounted in Projects tab (Work heading + "Show Details" button label), About tab (About heading + "What We Provide" heading), Contact tab (Contact heading + Send button label); public pages fall back to built-in translations when a field is empty. PageTextEditor cards are collapsed by default with an animated chevron (Radix Collapsible) and control ONLY the page heading + subtitle (button-label overrides reverted — buttons use built-in translations); cards contain only the section title + field labels + inputs. TEXT: home hero CTA "Explore Work" → "Let's Explore". RESPONSIVE: About + Contact pages scale with viewport height via clamp() spacing/padding/fonts/icons (vh-based) — no forced min-heights (removed 62vh stretch that created internal voids); Contact cards equal height via items-stretch with content vertically centered; About services grid auto-rows-fr to fill height | ✅ |
| 2026-08-22 | FEATURE: media library search-by-name input (filters filename/title across image/video/file tabs, EN/FR); About section heading "What You'll Get?" → "What We Provide" (FR: "Ce que nous offrons") | ✅ |
| 2026-08-22 | FIX: About heading keeps the question mark — "What We Provide?" | ✅ |
| 2026-08-22 | FEATURE: upload strip inside the media-picker dialog (drag & drop / click + "Add from URL", progress bar); video-format & library-choice dialogs now shared by both library modes so uploads work while picking media for a form | ✅ |

## [ORPHANS & PENDING]

### Known Pre-existing (Low Priority)
| # | Issue | File | Notes |
|---|-------|------|-------|
| P1 | `suppressHydrationWarning` on `<html>` / `<body>` | `layout.tsx:175,185` | Standard Next.js pattern for dynamic apps; harmless |
| P2 | Active nav uses `pathname.startsWith()` — matches `/` exactly but prefix for others | `app-nav.tsx:63` | No collision with existing routes |
| P3 | ESLint dep warning on `work/page.tsx:392` (updateUrl) | `work/page.tsx` | Stale closure risk; existing `eslint-disable` covers it |
| P4 | ESLint dep warning on `provider.tsx:174` (useMemo deps) | `provider.tsx` | Intentional — dynamic deps via DependencyList |
| P5 | No loading skeleton — only spinner preloader | — | Spinner works; skeleton is nice-to-have |
| P6 | Outdated deps (framer-motion 11→12, firebase 11→12, fontawesome 6→7) | `package.json` | Breaking changes require migration effort — defer

---

## [IMPROVEMENT PLAN — 10/10 Target]

### Milestone 1: Bug Fixes (P0)
| ID | Action | Verification |
|----|--------|-------------|
| M1.1 | Move `FirebaseClientProvider` + `DynamicThemeStyles` out of `<head>` into `<body>` | Layout renders without console errors |
| M1.2 | Clean up border override in globals.css — remove dead `@apply border-border`, keep intentional white border | Visual border appearance unchanged |
| M1.3 | Fix `Logo` to actually use `className` prop | Prop works |
| M1.4 | Extract hardcoded fallback logo URL to a shared constant | No magic strings in components |

### Milestone 2: Homepage Hero (P0)
| ID | Action | Verification |
|----|--------|-------------|
| M2.1 | Design hero section: animated tagline + subtitle below logo | Visible on homepage load |
| M2.2 | Add subtle scroll/tap CTA hint below the button | Shows on desktop & mobile |

### Milestone 3: Code Quality (P1)
| ID | Action | Verification |
|----|--------|-------------|
| M3.1 | Add lightweight async logger utility | Logger works without blocking |
| M3.2 | Clean up `suppressHydrationWarning` — identify actual hydration causes | No hydration warnings in console |
| M3.3 | Add empty state for work page when no projects exist | Shows friendly message |
| M3.4 | Fix `text-justify` on About page | No ragged right edge |

### Milestone 4: Polish (P2)
| ID | Action | Verification |
|----|--------|-------------|
| M4.1 | Fix nav active detection for `/` route | Only exact match activates Home |
| M4.2 | Review and fix the ESLint warning on work/page.tsx | No lint errors |
| M4.3 | `npm run build` succeeds | Build passes |
| M4.4 | `npm run lint` passes | Lint passes |
