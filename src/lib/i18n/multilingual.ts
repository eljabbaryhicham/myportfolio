'use client';

import { useLanguage } from '@/components/layout/language-switcher';
import { useCallback, useMemo } from 'react';

export type SupportedLocale = 'en' | 'fr';

export interface MultilingualString {
  en: string;
  fr: string;
}

export interface MultilingualStringOptional {
  en?: string;
  fr?: string;
}

export function createMultilingualString(en: string = '', fr: string = ''): MultilingualString {
  return { en, fr };
}

export function createMultilingualStringOptional(en?: string, fr?: string): MultilingualStringOptional {
  const result: MultilingualStringOptional = {};
  if (en !== undefined) result.en = en;
  if (fr !== undefined) result.fr = fr;
  return result;
}

export function getLocalizedString(
  value: string | MultilingualString | MultilingualStringOptional | undefined,
  locale: SupportedLocale,
  fallbackLocale: SupportedLocale = 'en'
): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[locale] || value[fallbackLocale] || '';
}

export function setLocalizedString(
  current: MultilingualString | MultilingualStringOptional | undefined,
  locale: SupportedLocale,
  newValue: string
): MultilingualString {
  const base = ensureMultilingualString(current);
  return { ...base, [locale]: newValue };
}

export function mergeMultilingualStrings(
  existing: MultilingualString | MultilingualStringOptional | undefined,
  updates: Partial<MultilingualString>
): MultilingualString {
  const base = ensureMultilingualString(existing);
  return { ...base, ...updates };
}

export function isMultilingualString(value: unknown): value is MultilingualString {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.en === 'string' && typeof obj.fr === 'string';
}

export function useMultilingualString(
  value: string | MultilingualString | MultilingualStringOptional | undefined
): { value: string; setValue: (newValue: string) => void } {
  const { lang } = useLanguage();
  const locale = lang as SupportedLocale;

  const localizedValue = useMemo(() => getLocalizedString(value, locale), [value, locale]);

  const setValue = useCallback((newValue: string) => {
    // This is a placeholder - actual implementation depends on the form system
    console.warn('setValue not implemented for standalone useMultilingualString hook');
  }, []);

  return { value: localizedValue, setValue };
}

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'fr'];

export function getDefaultLocale(): SupportedLocale {
  return 'en';
}

export function ensureMultilingualString(
  value: string | MultilingualString | MultilingualStringOptional | undefined
): MultilingualString {
  if (!value) return { en: '', fr: '' };
  if (typeof value === 'string') return { en: value, fr: '' };
  return { en: value.en || '', fr: value.fr || '' };
}