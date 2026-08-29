/**
 * Canonical view of the `homepage/settings` document.
 * All fields optional — consumers pick what they need; HomeAdmin owns the full write schema.
 *
 * Single source of truth: every file that needs to type this document
 * (HomePage, AppNav, TestPage, HomeAdmin, etc.) imports from here.
 *
 * Text fields are stored as multilingual `{ en, fr }` objects. Both keys
 * are optional (a half-filled doc is valid; getLocalizedString falls back
 * to the other locale or to a built-in default translation).
 */
import type { MultilingualString } from '@/lib/i18n/multilingual';

export interface HomePageSettings {
  // Theme + branding
  themeColor?: string;
  menubarLogoUrl?: string;
  menubarLogoSize?: number;
  homePageLogoUrl?: string;
  isHomePageLogoVisible?: boolean;
  homePageLogoScale?: number;
  homePageLogoColor?: string;
  faviconUrl?: string;

  // Hero
  heroVideoUrl?: string;
  cursorLottieUrl?: string;
  tickLottieUrl?: string;
  homePageTitle?: MultilingualString;
  homePageSubtitle?: MultilingualString;
  homePageTitleColor?: string;

  // Preloader / arrow animation
  preloaderType?: 'default' | 'lottie' | 'gif' | 'webm';
  preloaderUrl?: string;
  preloaderSize?: number;
  sitePreloaderSize?: number;
  isArrowAnimationEnabled?: boolean;
  arrowLottieUrl?: string;

  // Backgrounds
  homePageBackgroundType?: 'video' | 'image';
  homePageBackgroundMediaId?: string;
  homePageBackgroundUrl?: string;
  websiteBackgroundType?: 'video' | 'image';
  websiteBackgroundMediaId?: string;
  websiteBackgroundUrl?: string;
  isHomePageVideoEnabled?: boolean;
  isWebsiteVideoEnabled?: boolean;

  // Navigation
  navButtonSize?: number;

  // Player + global
  workPagePlayer?: 'plyr' | 'clappr';

  // Per-page text overrides
  workHeading?: MultilingualString;
  workSubtitle?: MultilingualString;
  aboutHeading?: MultilingualString;
  aboutSubtitle?: MultilingualString;
  contactHeading?: MultilingualString;
  contactSubtitle?: MultilingualString;

  // Glass / media layout
  glassOpacity?: number;
  mediaWidth?: number;
  showMediaTitles?: boolean;
  glassColor?: string;

  // Feature toggles
  isTestPageEnabled?: boolean;

  // Watermark
  watermarkLogoUrl?: string;
  watermarkSize?: number;
  watermarkOpacity?: number;
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  // Email templates (contact form)
  emailTemplateHtml?: string;
  autoReplyTemplateHtml?: string;
}
