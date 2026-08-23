import translations from './translations';
import { useLanguage } from '@/components/layout/language-switcher';
import { useCallback } from 'react';

export function useTranslation() {
  const { lang } = useLanguage();

  // Stable per language: safe to use in effect/useCallback dependency arrays.
  // An unstable identity here silently killed debounced autosaves (deps churn
  // cancelled the pending timer on every keystroke-induced re-render).
  const t = useCallback(
    (key: string): string => {
      const value = translations[lang]?.[key];
      if (value !== undefined) return value;
      const fallback = translations.en[key];
      if (fallback !== undefined) return fallback;
      return key;
    },
    [lang]
  );

  return { t, lang };
}
