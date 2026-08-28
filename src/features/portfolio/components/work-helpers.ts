// Pure helpers extracted from src/app/work/page.tsx (§3.8). Kept framework-free
// so they can be unit-tested and reused without pulling in the page.

/** Position a watermark overlay within a media frame. */
export function getWatermarkPositionStyle(position: string) {
  switch (position) {
    case 'top-left': return { top: '10px', left: '10px' } as const;
    case 'top-right': return { top: '10px', right: '10px' } as const;
    case 'bottom-left': return { bottom: '10px', left: '10px' } as const;
    case 'bottom-right':
    default: return { bottom: '10px', right: '42px' } as const;
  }
}

// Detects embedded media (raw HTML tags or Markdown images) inside project
// details — used to badge the "Show details" button.
const DETAILS_MEDIA_RE = /<\s*(video|audio|img|source)\b|!\[[^\]]*\]\([^)]+\)/i;
export function hasDetailsMedia(details?: string): boolean {
  return !!details && DETAILS_MEDIA_RE.test(details);
}

/** Self-close any <video>/<audio … /> which Markdown HTML parsers may emit. */
export function normalizeSelfClosingMedia(md: string): string {
  return md.replace(/<(video|audio)\b([^>]*?)\/>/gi, '<$1$2></$1>');
}

/** Sluggify a project title for the shareable ?id= URL. */
export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}
