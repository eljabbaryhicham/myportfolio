export type SupportedLocale = 'en' | 'fr';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'fr'];

export function getDefaultLocale(): SupportedLocale {
  return 'en';
}

/**
 * Multilingual text stored as a `{ en?, fr? }` object. Both fields are
 * optional — a half-filled doc is valid. getLocalizedString falls back to
 * the other locale, then to the caller's default fallback string.
 */
export interface MultilingualString {
  en?: string;
  fr?: string;
}

/** Backward-compat alias for the old "required both fields" shape. */
export type MultilingualStringOptional = MultilingualString;

/** Build a multilingual value, with sensible empty-string defaults. */
export function createMultilingualString(en: string = '', fr: string = ''): MultilingualString {
  return { en, fr };
}

/**
 * Resolve a multilingual value to a single-locale string.
 * Falls back to `fallbackLocale` (defaults to 'en'), then to ''.
 */
export function getLocalizedString(
  value: string | MultilingualString | undefined,
  locale: SupportedLocale,
  fallbackLocale: SupportedLocale = 'en'
): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value[fallbackLocale] || '';
}

/**
 * Coerce any incoming value (string, MultilingualString, undefined) into a
 * MultilingualString with both keys (empty string if missing).
 */
export function ensureMultilingualString(
  value: string | MultilingualString | undefined
): MultilingualString {
  if (!value) return { en: '', fr: '' };
  if (typeof value === 'string') return { en: value, fr: '' };
  return { en: value.en || '', fr: value.fr || '' };
}
