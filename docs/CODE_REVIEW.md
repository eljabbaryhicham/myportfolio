# MelliVision — Code Review Report

**Scope:** `src/`, `firestore.rules`, `next.config.js`, `package.json`, root config files
**Method:** Static review of ~130 TS/TSX files (~20 K LoC), `tsc --noEmit` passes, `npm run lint` not run as part of this review.
**Severity legend:** 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low / nits

---

## 0. TL;DR

The codebase is in **good shape overall** — it's a feature-rich bilingual portfolio with a clear DDD-ish feature split (`src/features/*`), real-time Firestore hooks, a thoughtful admin panel, and many micro-fixes documented in `PROJECT_MAP.md`. `tsc --noEmit` is clean.

However, the review surfaces **2 security issues, 1 hard runtime bug, and several maintainability / correctness problems** that should be addressed before further scaling.

Top-priority action list:

1. 🔴 **Rotate the Resend API key** — it is committed in `.env.local` (see §1.1).
2. 🔴 **Fix the nested `Controller` bug in `MultilingualInput`** — the inner per-locale controllers never register with RHF, so typed text never reaches form state (§2.1).
3. 🟠 **Move the `SUPERADMIN_EMAIL` and Firestore rules to a single source of truth** — it's hard-coded in 3 places, one of them (`firestore.rules`) is the only trustworthy gate (§3.1).
4. 🟠 **Stop persisting `provider` (Cloudinary vs Vercel Blob) inside `homepage/settings`** — it's a UI hint, not user content (§3.4).
5. 🟠 **Defer the `useDoc` toast on permission errors** — the auto-toast for missing data is a UX papercut for public users (§4.2).

Everything else is below.

---

## 1. Security 🔴

### 1.1 🔴 Resend API key committed to git (`re_8Arm8n5o_…`)

**Where:** `.env.local` (tracked in commits `8b2fa48` + `03a0849`).

**Evidence:**
```
$ git show HEAD:.env.local
RESEND_API_KEY=re_8A*************************** (REDACTED — full key in git history)
```

The key is a real Resend live key (it was used to send mail from `contact@mellivision.com`).

**Why it matters:** Anyone with read access to the repo can send email *as* `contact@mellivision.com` until rotated. This is a **blast-radius credential** for spam, phishing, and reputational damage.

**Fix:**
1. Immediately **revoke the key in the Resend dashboard** and reissue. The new key is not in git history.
2. Add a more defensive `.gitignore` (currently `.env.local` is explicitly tracked — it shouldn't be). The minimum:
   ```gitignore
   .env
   .env.local
   .env.*.local
   ```
   …and then `git rm --cached .env.local` + commit.
3. Add a pre-commit guard (e.g. `gitleaks` or `npm install -D git-secrets`).
4. Audit the Resend dashboard for any sent messages that aren't yours.

### 1.2 🟠 `.env` (untracked but on-disk) contains a real `FIREBASE_PRIVATE_KEY`

**Where:** `.env` (not in git — `.gitignore` covers it — but the file is 2.4 KB and contains a full PEM private key + `FIREBASE_CLIENT_EMAIL`).

**Why it matters:** This key grants **Admin SDK access** to your Firebase project (privilege escalation: full read/write to all collections, bypass of all Firestore rules, ability to mint auth tokens). It only needs to leak once. The gitignore saves you today, but:
- Anyone with `git clone` of older forks / collaborator machines has it.
- It's also loaded as `docs/service-account.json` fallback by `src/firebase/server-init.ts:68` — make sure no such file is committed.

**Fix:**
1. Verify it isn't in `docs/service-account.json` in any branch (already done — none found).
2. Move the admin workflow to **App Hosting–managed credentials** (no key material in `.env`). The Admin SDK already falls back to ADC on Firebase App Hosting (`server-init.ts:86-90`).
3. If the key must stay for local dev, store it as `FIREBASE_SERVICE_ACCOUNT_KEY` (one env var) rather than the three-part `FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY` form — easier to rotate, easier to scrub.

### 1.3 🟠 Firestore security: `users` self-create is unprivileged; self-update allows writing arbitrary `role`/`permissions` from the client

**Where:** `firestore.rules:84-104`.

The `update` rule lets a user write their own `users/{uid}` doc with `role == 'user' && permissions == null` (good — no self-elevation). But two issues remain:

- **Race condition on first write:** a brand-new user can `create` with `role:'user'`, then on the very next request `update` with the same body — same constraint applies, so this is fine. ✅
- **Missing write-protect for `role`/`permissions` field changes by admins:** a non-superadmin admin with `canEditHome` can `update` *any* user doc, including demoting the superadmin (or themselves to superadmin) as long as their own token satisfies `canEditHome`. There's no per-field check.

**Fix:** tighten `users/{userId}` update to:
```rules
allow update: if isSuperAdmin()
  || (request.auth.uid == userId
      && request.resource.data.role == resource.data.role
      && request.resource.data.permissions == resource.data.permissions)
  || (hasPerm('canEditHome')
      && request.resource.data.role == resource.data.role
      && request.resource.data.permissions == resource.data.permissions
      && request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['username','displayName','photoURL'] /* whatever fields admins may edit */]));
```

### 1.4 🟡 The media picker exposes arbitrary URL input

The admin can paste any URL into `homePageBackgroundUrl`, `heroVideoUrl`, etc. There's no allowlist / MIME check. Combined with the public read rules, this is a content-injection vector if the admin account is ever compromised.

**Fix:** Validate `Content-Type` on picker URL fetch (already done in the Cloudinary add-from-URL flow), and consider enforcing an `https://*.cloudinary.com|*.vercel-storage.com` host check server-side for these fields in a future version.

### 1.5 🟡 `SUPERADMIN_EMAIL` hard-coded in 3 places

`firestore.rules:8`, `src/lib/constants.ts:3`, and effectively again in the superadmin check at every component (e.g. `src/app/admin/page.tsx:74`, `src/features/admin/components/HomeAdmin.tsx:164`).

**Why it matters:** changing it means editing 3+ files; one missed spot silently downgrades privileges. There's no test that catches divergence.

**Fix:** load it from a single config (e.g. `src/lib/constants.ts` is the source, the rules file imports a generated config) or, better, drive it from a custom claim set by a Cloud Function on first login, removing the email comparison entirely.

---

## 2. Correctness bugs 🟠

### 2.1 🟠 `MultilingualInput` inner `Controller` is dead code — the field never actually registers per-locale

**Where:** `src/features/admin/components/MultilingualInput.tsx:86-114`.

```tsx
{SUPPORTED_LOCALES.map((locale) => {
  const value = getLocalizedString(mls, locale);
  return (
    <TabsContent key={locale} value={locale} className="pt-0">
      <Controller
        name={`${name}.${locale}`}   // ← nested Controller inside another Controller's render prop
        control={control}
        render={({ field: localeField }) => ...
        )}
      />
    </TabsContent>
  );
})}
```

**The problem:** the inner `Controller` *is technically supported* by RHF (it can be nested), but the `<Tabs>` component only mounts the *active* `TabsContent`. The other `Controller`s never mount, so their `field` is never registered, their `defaultValue` is never collected, and `setValue` on the active locale writes the *whole object* under `${name}.${locale}` (it is supposed to be a string sub-key, but RHF will create `name = { en: { en: '...' } }` if the parent never set up the object shape).

Combined with how HomeAdmin's `watch` autosave reads `(value as Record<string, any>)[topLevel]` (`HomeAdmin.tsx:330`), what actually gets saved is unpredictable.

**Symptoms to look for:** typing into one language tab and switching to the other sometimes wipes the first; "saved" toasts firing without anything reaching Firestore; values flickering between states.

**Fix (smallest):** use uncontrolled inputs registered via `register` (or `useController`) under the parent `name`, controlled by `useWatch`:
```tsx
const enValue = useWatch({ control, name: `${name}.en`, defaultValue: '' });
const frValue = useWatch({ control, name: `${name}.fr`, defaultValue: '' });
// in onChange: form.setValue(`${name}.${locale}`, e.target.value, { shouldDirty: true });
```

**Fix (cleaner):** drop the inner `Controller` and bind the textarea/input via `register` directly:
```tsx
<Input {...register(`${name}.${locale}`)} defaultValue={getLocalizedString(mls, locale)} />
```

### 2.2 🟠 `firestore.rules:34` — the catch-all superadmin override also matches `**/users/{uid}` writes

The universal override `match /{document=**}` runs *before* the more specific `users` match. A superadmin can do anything (intended), but the order means a **non-superadmin** can only write `users/{uid}` if they pass the user-specific check. That's correct — the override is gated. ✅ No bug, but worth a comment in the rules.

### 2.3 🟡 `useDoc` isLoading never returns false when `memoizedDocRef` is null and previous load was successful

`src/firebase/firestore/use-doc.tsx:52-57`:
```ts
if (!memoizedDocRef) {
  setData(null);
  setIsLoading(false);
  setError(null);
  return;
}
```

This wipes the existing data when the caller temporarily passes `null` (e.g. while the auth user is loading and `useMemoFirebase` hasn't returned a real ref yet). Consumers that show a preloader gated on `isLoading` will briefly flash empty content.

**Fix:** leave `data` alone; only set `isLoading(false)` if it was previously true. Or expose an explicit `idle` state.

### 2.4 🟡 `useCollection` cache-only empty snapshot still flashes "no projects" on cold-load

This is the documented trade-off (see comment at `use-collection.tsx:77-81`). The work page mitigates with a 2-second timer (`ProjectAdmin.tsx`). Other consumers (clients, vercel_blobs) don't. Mostly OK, but it means **the clients carousel on `/about` can briefly show "No clients to display"** for a user with intermittent network.

**Fix:** either copy the work-page 2s guard, or invert the default: only set `data` on `!snapshot.metadata.fromCache` (i.e. require a server-confirmed snapshot) and keep a "stale cache" value separately. This is a real perf vs. flicker trade-off; document it as a project decision.

### 2.5 🟡 `MultilingualInput`'s tabs `activeLocale` never syncs when the global language switches

`MultilingualInput.tsx:56`:
```ts
const [activeLocale, setActiveLocale] = useState<SupportedLocale>(currentLocale);
```

The initial locale is taken from `useTranslation().lang` once. When the user toggles the language, the form re-renders, but the `activeLocale` state isn't reset — the user has to manually click the other tab to see the new language. This is mildly confusing on EN↔FR toggle, but **important** for any field that *they switch language and start typing* — they'd see no value because the tab they're on still references the prior locale.

**Fix:** use a `useEffect([currentLocale])` to `setActiveLocale(currentLocale)`, or key the component on `currentLocale`.

### 2.6 🟡 `HomeAdmin.tsx:286-339` autosave effect uses a `pendingRef` + `debounce` but the ref is recreated on every effect run

The `pendingRef` is `useRef`-shaped but allocated inside the effect; React's `useRef` semantics guarantee a stable ref across renders. The intent is right, but `const pendingRef: { current: ... } = { current: {} }` allocates a fresh object on every effect call, so when `settingsDocRef` changes, the previous pending changes are lost (silent data drop).

**Fix:** use `React.useRef<Record<string, any>>({})` outside the effect body. Otherwise the merge behavior described in the comment ("batches ALL pending field changes") is wrong.

### 2.7 🟡 `firestore.rules:7-9` `isSuperAdmin` compares `request.auth.token.email` — this is the *decoded* JWT, not the *live* Auth record

If the user's email is changed in the Auth console after the token is issued, the old token still grants superadmin until it expires (1 hour). Acceptable for a personal site; flag for awareness.

---

## 3. Architecture / maintainability 🟡

### 3.1 🟠 `HomePageSettings` is duplicated in 3 files with subtly different shapes

- `src/lib/types.ts:8` — canonical, multilingual fields
- `src/features/portfolio/components/HomePage.tsx:24-…` — has `homePageLogoScale` / `homePageLogoColor`
- `src/features/admin/components/HomeAdmin.tsx:58-100` — has those plus more, plus a slightly different `homePageTitleColor`/`preloaderUrl`

`HomeAdmin.tsx:266-281` mutates the form using its local `HomePageSettings`, not the shared type. Drift is inevitable. The mismatch is why `homePageLogoScale` only exists in `HomePage.tsx`'s copy.

**Fix:** consolidate into `src/lib/types.ts`, then have all three places `import type { HomePageSettings } from '@/lib/types'`.

### 3.2 🟠 `multilingual.ts` has 5+ dead exports

| Export | Used? |
|---|---|
| `createMultilingualStringOptional` | ❌ (only its own file) |
| `setLocalizedString` | ❌ |
| `mergeMultilingualStrings` | ❌ |
| `isMultilingualString` | ❌ |
| `useMultilingualString` | ❌ (and `console.warn`s on every call!) |
| `MultilingualStringOptional` | ❌ |
| `createMultilingualString` | ✅ |
| `getLocalizedString` | ✅ (heavily) |
| `ensureMultilingualString` | ✅ |
| `SUPPORTED_LOCALES` | ✅ |
| `getDefaultLocale` | ❌ |
| `SupportedLocale` | ✅ |

`useMultilingualString` actively misleads: it returns a `setValue` that just logs a warning. If anyone uses it, their writes silently no-op.

**Fix:** delete the unused ones. Keep `MultilingualString` (the `{ en: string; fr: string }` shape) and `getLocalizedString`/`ensureMultilingualString` as the core.

### 3.3 🟡 `MultilingualString` is *always* required as `{ en: string; fr: string }` even when one side is empty

`multilingual.ts:8-11` makes both `en` and `fr` non-optional. This forces every consumer to write `ensureMultilingualString` before saving, and means a half-migrated doc (only EN filled) shows `''` for FR in the picker.

**Fix:** make both fields `?` (`Partial<Record<SupportedLocale, string>>` — or just `{ en?: string; fr?: string }`) and document the contract. The display fallback (`getLocalizedString` already falls back to `'en'`) is what users want.

### 3.4 🟠 `homepage/settings.provider` is persisted in Firestore

`HomeAdmin.tsx:226` writes `provider: 'cloudinary' | 'vercel_blob'` into `homepage/settings`. That's a UI hint for which tab the media picker opens, but it's now visible in the same doc that powers theming, copy, and backgrounds. Confusing debugging, easy to mistakenly read it as a "canonical" setting.

**Fix:** persist the admin's preferred provider in `localStorage`, not Firestore. (Or keep it in Firestore but rename the doc / move to a separate `admin/{uid}/preferences` collection.)

### 3.5 🟡 `package.json` carries ~58 outstanding `npm audit` advisories (per `PROJECT_MAP.md`)

`firebase-admin@^12.2.0` has a newer major available (`13.9.0`). `next@^16.2.6` got bumped to `16.3.2` by `npm audit fix` (per the changelog). Worth a scheduled maintenance pass to bump majors and re-verify the build.

### 3.6 🟡 `next.config.js` accepts arbitrary `*.vercel-storage.com` and `res.cloudinary.com`

The `remotePatterns` for `next/image` include several `imgur`, `picsum.photos`, `catbox.moe` — likely for one-time dev fixtures. The list is long and noisy. Move test/fixture hostnames to a separate dev-only config and keep prod lean.

### 3.7 🟡 Massive duplication between `HomeAdmin` and `ContactAdmin` autosave loops

`HomeAdmin.tsx:285-339` and `ContactAdmin.tsx` (autosave effect) are structurally identical: watch with name→topLevel resolution, batch pending changes, debounce 500ms, fire `setDocumentNonBlocking(docRef, pending, { merge: true })`. Same for `PageTextEditor.tsx`.

**Fix:** extract a `useMergedAutosave({ docRef, enabled, delay })` hook that returns a `record(name, value)` to be called from the watch callback. ~40 LoC deduplicated, plus a single place to add `onError`, `onSaved` (toast), and live-update CSS variables.

### 3.8 🟡 `work/page.tsx` is 1,497 lines

This is a single client component that owns: the grid, the dialog, the prev/next swipe, the contact form prefill, the markdown renderer, the URL sync, the filter. Split into:
- `WorkGrid.tsx`
- `ProjectDetailDialog.tsx`
- `useWorkUrlSync.ts`
- `ProjectDetailsContent.tsx` (likely already extracted — verify)

Same applies to `HomeAdmin.tsx` (1,330 lines) and `ProjectAdmin.tsx` (417 lines + sheet).

### 3.9 🟡 `handleLogout(false)` lives inside a `useCallback` declared with no deps but uses `auth` from closure

`src/app/admin/page.tsx:194-218`. Not a bug (it's a stable ref), but ESLint exhaustive-deps will flag it. There's a similar pattern in `handleUploadComplete` not being wrapped in `useCallback` at all (called as a prop to `<MediaAdmin>`). Risk of stale closures in a future change.

### 3.10 🟡 `src/components/PlyrPlayer.tsx` and `src/components/CdnClapprPlayer.tsx` look like candidate for unification

Two video player wrappers, both registered, one chosen at runtime via `homeSettings.workPagePlayer`. Plyr + HLS + Clappr + Vidstack is a lot of video code in the bundle. Verify the unused Vidstack import isn't pulling bytes in. (Per `package.json` Plyr + Clappr + HLS + lottie-react + framer-motion + recharts — already huge.)

---

## 4. UX & performance

### 4.1 🟡 Public pages have no Suspense / RSC data flow

Everything is `'use client'`. Even `/` is a client component despite being a marketing page. That ships the full Firebase SDK + framer-motion + the admin bundle (gated by `next/dynamic` with `ssr:false` for the heavy bits) on first paint.

**Fix:** the home/about/contact pages could be server components that read `homepage/settings` server-side (one Firestore Admin call cached at the edge) and pass the data to a thin client island. LCP would drop measurably.

### 4.2 🟠 Auto-toast on every `useDoc` permission error

`src/firebase/firestore/use-doc.tsx:90-94` and `use-collection.tsx:111-115` always `toast(...)` on error. For *public* users reading public docs that happen to 404, this surfaces a confusing "Data Fetch Blocked" red toast that looks like the site is broken.

**Fix:** distinguish "not found" (silently set null) from "denied" / "network" (toast). Or: gate the toast behind a debug flag / first-error-only.

### 4.3 🟡 Admin page (`src/app/admin/page.tsx`) keeps all tab components mounted

`forceMount` is used on the media TabsContent (`admin/page.tsx:423, 429, 432`) — the rationale is correct (preserve upload state when switching tabs), but it also keeps `MediaLibrary`, `VercelBlobAdmin`, and the Cloudinary provider tabs alive concurrently, each with their own `useCollection('media')` + `useCollection('vercel_blobs')` listeners. That's 2-3x the Firestore reads and 2-3x the React work for an admin.

**Fix:** instead of `forceMount`, lift upload state to a context (already exists — `UploadProgressContext`) and let the inactive tabs unmount cleanly. The `media-library-maximize` event pattern is already in place for re-opening.

### 4.4 🟡 `LayoutProvider` wraps the whole app; `<SpeedInsights/>` is duplicated in `layout.tsx`

`src/components/layout/layout-provider.tsx` exists but `src/app/layout.tsx` calls `<AppShell>` directly. The `layout-provider` is unused / dead. The `<SpeedInsights/>` is placed in `layout.tsx:73` (correct) and used to be in `app-shell.tsx` (per the changelog). Search for stragglers.

### 4.5 🟡 `useIsMobile` from `src/hooks/use-mobile.tsx` (line of `useIsMobile`)

Not reviewed in depth, but `useDoc` / `useCollection` already opt out of re-fetching on viewport change. Make sure the hook doesn't return `false` → `true` mid-paint (causes layout shift). Per the changelog, this was already fixed once; double-check.

### 4.6 🟡 `next.config.js` doesn't enable `compress: true` or `poweredByHeader: false`

These are minor but free wins for a public-facing site.

### 4.7 🟡 Translation file is 1,170 lines and flat-keyed

`src/lib/i18n/translations.ts:1` is one big `Record<string, string>`. At this size, a `{ en: {...}, fr: {...} }` object with grouped sections would be more maintainable, type-safe with `as const`, and easier for future locales (es, ar).

### 4.8 🟡 Console statements in production code

`console.log` / `console.error` / `console.warn` are scattered in:
- `src/firebase/firestore/use-doc.tsx` (toast on error — covered above)
- `src/firebase/server-init.ts` (acceptable for ops visibility)
- `src/app/api/*` (acceptable)
- `src/lib/i18n/multilingual.ts:72` (`useMultilingualString` — **this one is harmful**, see §3.2)
- `src/features/admin/components/MediaLibrary.tsx:512` (`console.log` left behind)
- `src/features/admin/components/MediaLibrary.tsx:787` (`console.error` — fire-and-forget add after upload)

A `logger.ts` already exists per the changelog. Wire it through and gate `debug` logs behind `NODE_ENV !== 'production'`.

### 4.9 🟡 `useEffect(() => { setActiveMediaTab(...) }, [..., setActiveMediaTab])`

`admin/page.tsx:152-158` has a contextual `setActiveMediaTab` from `useUploadProgress` in deps. If that callback's identity isn't stable, this re-fires every render. Verify it's wrapped in `useCallback` upstream (it should be, but check).

### 4.10 🟡 Inconsistent string interpolation in translations

`home.heading: '…{name}…'` is implemented by callers as `t('…').replace('{name}', value)`. With template literals (`\`…${name}…\``) or ICU MessageFormat you'd get type safety and pluralization. Out of scope, but worth noting.

---

## 5. Testing & CI

### 5.1 🟠 There is no test suite

No `vitest`, `jest`, `playwright`, or `cypress` config exists. Per `package.json` scripts, only `lint` and `typecheck` run. For a portfolio site that's defensible, but a couple of strategic tests would pay for themselves:
- `multilingual.ts` (pure functions; trivial to cover)
- `firestore.rules` (use `@firebase/rules-unit-testing`)
- `getLocalizedString` (the single most called function in the app)

### 5.2 🟡 No CI workflow

`.github/workflows/` doesn't exist. Add at minimum: `npm run typecheck && npm run lint && npm audit --audit-level=high` on PR.

---

## 6. Documentation & small fixes

- `docs/backend.json` and `src/docs/backend.json` are both tracked. Pick one (probably `docs/`); they look near-identical and only the latter is referenced (per grep).
- `docs/blueprint.md` and `docs/UPLOAD_SYSTEM_ROADMAP.md` are good context. `README.md` is mostly the Firebase Studio boilerplate — replace with project-specific setup.
- `PROJECT_MAP.md` is exemplary — keep maintaining it.
- `apphosting.yaml` exists but wasn't reviewed; verify it points to the right env vars (esp. for ADC).

---

## 7. What the codebase does well ✨

Worth recognizing so good patterns don't get "refactored" away:

- **Domain-driven `src/features/{portfolio,admin,about,contact,auth}/`** with shared `src/components/` for UI primitives. Easy to navigate.
- **Memoized Firestore hooks** with explicit `useMemoFirebase` and a "you MUST memoise" warning in JSDoc. Prevents the most common Firestore foot-gun.
- **One-line HSL → CSS variable** theming applied synchronously in `<head>` (`layout.tsx:48-50`) before paint. The right way to avoid theme flash.
- **Bilingual field migration is well-designed**: `MultilingualString` shape, helper functions, server-side migration flow gated behind superadmin button + Firebase ID token, idempotent via `_migrations/multilingual_v1` marker.
- **Per-page text overrides** (PageTextEditor) with a "default translation" fallback (`getLocalizedString(x, lang) || t('…')`) — degrades gracefully when admin leaves a field empty.
- **RHF + zod** schemas everywhere, with consistent `<Form {...form}>` wrappers.
- **Configurable preloader / arrow animation / homePageLogoScale** all admin-tweakable with safe defaults.
- **Real-time permission rules** (superadmin override + per-collection `canEditX` permissions) — easy to reason about, easy to extend.
- **`UploadProgressContext`** decouples global upload state from per-tab UI so navigation doesn't break uploads.
- **The `PROJECT_MAP.md` change-log** is a gem — this is how personal projects should be documented.
- **CSP-friendly inline scripts** in `<head>` use minimal, defensive `try/catch` for localStorage access. Good progressive enhancement.

---

## 8. Suggested fix order

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | Rotate Resend key + remove from git (§1.1) | 5 min | Critical |
| 2 | Fix `MultilingualInput` nested-Controller bug (§2.1) | 1 h | High |
| 3 | Delete dead exports in `multilingual.ts` (§3.2) | 10 min | High |
| 4 | Consolidate `HomePageSettings` type (§3.1) | 30 min | High |
| 5 | Extract `useMergedAutosave` hook (§3.7) | 1 h | Medium |
| 6 | Stop persisting `provider` in Firestore (§3.4) | 20 min | Medium |
| 7 | Gate `useDoc` permission toast on debug (§4.2) | 20 min | Medium |
| 8 | Tighten `users/{uid}` update rule (§1.3) | 30 min | Medium |
| 9 | Add `npm test` + 1 test for `multilingual.ts` (§5.1) | 2 h | Medium |
| 10 | Split `work/page.tsx` into files (§3.8) | 2 h | Medium |
| 11 | Admin: drop `forceMount` on Media tabs (§4.3) | 1 h | Medium |
| 12 | Add CI workflow with typecheck/lint/audit (§5.2) | 1 h | Low |
| 13 | Make `MultilingualString` fields optional (§3.3) | 30 min + migration | Low (but invasive) |

---

*Generated from a static review of the working tree on branch `myportfolio` @ `47d24e6`. No code was modified.*
