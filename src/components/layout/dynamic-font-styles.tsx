'use client';

import { useEffect, useRef } from 'react';
import { useHomePageSettings } from '@/components/settings/home-page-settings-provider';
import {
  fontCssVariables,
  googleFontsStylesheetHref,
  normalizeGoogleFontFamily,
} from '@/lib/fonts';

const FONT_VARIABLE_NAMES = ['--font-quicksand', '--font-bungee', '--font-dancing-script'] as const;

// Applies the admin-configured fonts live on every client (same mechanism as
// the theme color), so font changes show up on desktop and mobile the moment
// they are saved — not only after a fresh server render. Also loads the chosen
// Google Font families by injecting the matching stylesheet link.
export default function DynamicFontStyles() {
  const { settings: homeSettings } = useHomePageSettings();
  const linkRef = useRef<HTMLLinkElement | null>(null);

  const bodyFont = normalizeGoogleFontFamily(homeSettings?.bodyFontFamily);
  const headlineFont = normalizeGoogleFontFamily(homeSettings?.headlineFontFamily);
  const handwritingFont = normalizeGoogleFontFamily(homeSettings?.handwritingFontFamily);

  useEffect(() => {
    const vars = fontCssVariables(bodyFont ?? undefined, headlineFont ?? undefined, handwritingFont ?? undefined);
    const root = document.documentElement;
    for (const name of FONT_VARIABLE_NAMES) {
      const value = vars[name];
      if (value === undefined) root.style.removeProperty(name);
      else root.style.setProperty(name, value);
    }
  }, [bodyFont, headlineFont, handwritingFont]);

  useEffect(() => {
    if (linkRef.current) {
      linkRef.current.remove();
      linkRef.current = null;
    }
    const href = googleFontsStylesheetHref([bodyFont, headlineFont, handwritingFont]);
    if (!href) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    linkRef.current = link;
    return () => {
      linkRef.current?.remove();
      linkRef.current = null;
    };
  }, [bodyFont, headlineFont, handwritingFont]);

  return null;
}