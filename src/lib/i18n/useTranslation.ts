import translations from './translations';
import { useLanguage } from '@/components/layout/language-switcher';

export function useTranslation() {
  const { lang } = useLanguage();

  const t = (key: string): string => {
    const value = translations[lang]?.[key];
    if (value !== undefined) return value;
    const fallback = translations.en[key];
    if (fallback !== undefined) return fallback;
    return key;
  };

  return { t, lang };
}
