// Helpers shared between the server-rendered <html> font variables (layout)
// and the client-side live font application (DynamicFontStyles). Both must
// sanitize the admin-provided family names identically and build the same
// Google Fonts stylesheet URL so the chosen fonts load everywhere.

export function normalizeGoogleFontFamily(fontFamily?: string): string | null {
  const normalized = fontFamily?.trim().replace(/[^\p{L}\p{N} &'().-]/gu, '').slice(0, 100);
  return normalized || null;
}

export function googleFontsStylesheetHref(families: Array<string | null>): string | null {
  const selected = [...new Set(families.filter((family): family is string => Boolean(family)))];
  if (selected.length === 0) return null;

  const query = selected
    .map((family) => `family=${encodeURIComponent(family).replace(/%20/g, '+')}`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

// The CSS custom properties applied to :root/<html>. Empty/null fields are
// omitted so the default local (next/font) family remains active.
export function fontCssVariables(
  bodyFont?: string,
  headlineFont?: string,
  handwritingFont?: string
): { '--font-quicksand'?: string; '--font-bungee'?: string; '--font-dancing-script'?: string } {
  return {
    ...(bodyFont ? { '--font-quicksand': `"${bodyFont}", sans-serif` } : {}),
    ...(headlineFont ? { '--font-bungee': `"${headlineFont}", sans-serif` } : {}),
    ...(handwritingFont ? { '--font-dancing-script': `"${handwritingFont}", cursive` } : {}),
  };
}