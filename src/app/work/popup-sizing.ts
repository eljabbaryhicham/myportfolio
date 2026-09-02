/**
 * Pure sizing logic for the Work page popups (project dialog + details dialog).
 *
 * Extracted from WorkPageClient.tsx so the math can be unit-tested without
 * rendering the full component tree. The two popups share a minimized
 * "content-fit" size but maximize independently so one popup's current
 * dimensions never affect the other.
 *
 * The returned strings are Tailwind className fragments; the style helper
 * returns a CSSProperties object (or undefined) suitable for React's inline
 * `style` prop.
 */

export interface MinimizedPopupFlags {
  isExtraWide: boolean;
  isDescriptionLong: boolean;
}

/**
 * Classname applied to BOTH popups while they're in their minimized state.
 * 90vw / max-w-7xl is the content-fit width; the height is either fixed
 * (90dvh) when the content is wide/long, or capped (max-h-[90dvh]) so the
 * dialog shrinks to fit the content.
 */
export function getMinimizedPopupSizing(flags: MinimizedPopupFlags): string {
  const { isExtraWide, isDescriptionLong } = flags;
  return [
    'w-[90vw] max-w-7xl',
    isExtraWide || isDescriptionLong ? 'h-[90dvh]' : 'max-h-[90dvh]',
  ].join(' ');
}

/**
 * Classname for the project popup. Maximized overrides to 98vw / 98dvh with
 * no max-width; otherwise the shared minimized sizing applies.
 */
export function getPopupSizing(
  isProjectMaximized: boolean,
  flags: MinimizedPopupFlags,
): string {
  if (isProjectMaximized) {
    return 'w-[98vw] h-[98dvh] max-w-none';
  }
  return getMinimizedPopupSizing(flags);
}

/**
 * Classname for the details popup. Same shape as getPopupSizing but driven by
 * the details' own maximize flag. Kept as a separate function so the two
 * popups' maximize states stay independent.
 */
export function getDetailsSizing(
  isDetailsMaximized: boolean,
  flags: MinimizedPopupFlags,
): string {
  if (isDetailsMaximized) {
    return 'w-[98vw] h-[98dvh] max-w-none';
  }
  return getMinimizedPopupSizing(flags);
}

export interface MinimizedProjectSize {
  w: number;
  h: number;
}

/**
 * Inline style for the details dialog.
 *
 * - When the details are maximized, force 98vw / 98dvh with no max-width so
 *   the dialog is independent of any previously-captured project size.
 * - When minimized and a captured project size exists, mirror the project's
 *   pixel dimensions (including minHeight so the scroll area never collapses).
 * - When minimized and no size is captured yet, leave it undefined so the
 *   className alone controls the size.
 */
export function getDetailsStyle(
  isDetailsMaximized: boolean,
  minimizedProjectSize: MinimizedProjectSize | null,
): React.CSSProperties | undefined {
  if (isDetailsMaximized) {
    return { width: '98vw', height: '98dvh', maxWidth: 'none' };
  }
  if (!minimizedProjectSize) return undefined;
  return {
    width: `${minimizedProjectSize.w}px`,
    height: `${minimizedProjectSize.h}px`,
    minHeight: `${minimizedProjectSize.h}px`,
  };
}
