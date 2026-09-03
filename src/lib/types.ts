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

export type { MultilingualString } from '@/lib/i18n/multilingual';

export interface HomePageSettings {
  // Theme + branding
  themeColor?: string;
  menubarLogoUrl?: string;
  menubarLogoSize?: number;
  homePageLogoUrl?: string;
  isHomePageLogoVisible?: boolean;
  homePageLogoScale?: number;
  homePageLogoOpacity?: number;
  homePageLogoColor?: string;
  homePageLogoOffset?: number;
  faviconUrl?: string;
  languageToggleColor?: string;
  bodyFontFamily?: string;
  headlineFontFamily?: string;
  handwritingFontFamily?: string;

  // Hero
  heroVideoUrl?: string;
  cursorLottieUrl?: string;
  tickLottieUrl?: string;
  homePageTitle?: MultilingualString;
  homePageSubtitle?: MultilingualString;
  homePageTitleColor?: string;

  // Preloader / arrow animation
  preloaderType?: 'none' | 'gif' | 'lottie' | 'webm';
  preloaderUrl?: string;
  preloaderSize?: number;
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

  // Home social media buttons (beside the language toast)
  isHomeSocialButtonsVisible?: boolean;

  // Work page fullscreen button on image project popups
  isImageFullscreenButtonVisible?: boolean;

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

/**
 * Canonical view of a document in the public `clients` collection, shown by
 * the homepage TrustedBy strip. Server-seeded so the first paint already
 * contains the client list (no Firestore round-trip on the client).
 */
export interface TrustedByClient {
  id: string;
  name: MultilingualString;
  logoUrl: string;
  order: number;
  isVisible?: boolean;
}

/**
 * Canonical view of the public `contact/details` document. Shared by the
 * nav (logo), contact page (profile/socials) and contact form (WhatsApp)
 * via the ContactInfoProvider, so the doc is live-subscribed only once.
 */
export interface ContactInfo {
  avatarUrl?: string;
  name?: MultilingualString;
  title?: MultilingualString;
  email?: string;
  whatsApp?: string;
  behanceUrl?: string;
  behanceName?: string;
  linkedinUrl?: string;
  linkedinName?: string;
  fiverrUrl?: string;
  fiverrName?: string;
  instagramUrl?: string;
  instagramName?: string;
  facebookUrl?: string;
  facebookName?: string;
  twitterUrl?: string;
  twitterName?: string;
  logoUrl?: string;
}
