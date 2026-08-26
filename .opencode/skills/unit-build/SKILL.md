---
name: unit-build
description: Use when adding a new feature or making a significant change (3+ files) to this project. Build one unit at a time with safe-edit protocol. Skip for single-file bug fixes or quick patches.
---

# Unit-Build Protocol (Adapted for MelliVision Portfolio)

Unit-by-unit construction loop for existing Next.js + Firebase project. Use for **new features or significant changes** (3+ files). Skip for quick bug fixes.

## Rules

1. **Safe-Edit Protocol** (every modified file):
   - **Read** → understand current code
   - **Think** → announce what you'll change and where (anchor point)
   - **Edit** → make the change without destroying surrounding code

2. **One Unit at a Time** — finish current unit (code + typecheck + build) before starting next

3. **No Feature Creep** — do exactly what's needed, nothing extra

4. **Match Existing Style** — follow current code conventions, don't refactor working code unless asked

5. **Verify Every Unit** — run `npm run typecheck` and `SKIP_ENV_VALIDATION=1 npm run build` after each unit

## When to Use

| Scenario | Use unit-build? |
|---|---|
| Add analytics dashboard | Yes |
| Add dark mode toggle | Yes |
| Fix a typo | No |
| Fix a single bug | No |
| Change one component's styling | No |

## Workflow

For a feature request, plan units first:

```
# Feature: [Name]

## Units
1. [Unit 1: Description] — files: [list]
2. [Unit 2: Description] — files: [list]
3. [Unit 3: Description] — files: [list]
```

Then loop: **build unit → typecheck → build → push → next unit**.

## Project Context

- **Stack**: Next.js App Router, Firebase (Firestore + Auth), Cloudinary, Vercel Blob, Tailwind CSS, shadcn/ui
- **Key files**: `src/app/admin/page.tsx`, `src/features/admin/components/`, `src/components/`, `src/lib/`
- **Conventions**: `use client`, dynamic imports with `Preloader`, `useTranslation()` for i18n, `glass-effect` class for glass UI
- **Verify**: `npm run typecheck` then `SKIP_ENV_VALIDATION=1 npm run build`
