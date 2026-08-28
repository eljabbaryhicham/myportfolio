/**
 * Shared view of the `homepage/settings` document.
 * All fields optional — consumers pick what they need; HomeAdmin owns the full write schema.
 * Text fields are multilingual: stored as `{ en, fr }` objects.
 */
import type { MultilingualString } from '@/lib/i18n/multilingual';

export interface HomePageSettings {
    homePageBackgroundType?: 'video' | 'image';
    homePageBackgroundMediaId?: string;
    homePageBackgroundUrl?: string;
    websiteBackgroundType?: 'video' | 'image';
    websiteBackgroundMediaId?: string;
    websiteBackgroundUrl?: string;
    isHomePageVideoEnabled?: boolean;
    isWebsiteVideoEnabled?: boolean;
    themeColor?: string;
    menubarLogoUrl?: string;
    homePageLogoUrl?: string;
    faviconUrl?: string;
    workPagePlayer?: 'plyr' | 'clappr';
    homePageTitle?: MultilingualString;
    homePageSubtitle?: MultilingualString;
    workHeading?: MultilingualString;
    workSubtitle?: MultilingualString;
    aboutHeading?: MultilingualString;
    aboutSubtitle?: MultilingualString;
    contactHeading?: MultilingualString;
    contactSubtitle?: MultilingualString;
    glassOpacity?: number;
    mediaWidth?: number;
    showMediaTitles?: boolean;
    glassColor?: string;
    isTestPageEnabled?: boolean;
    watermarkLogoUrl?: string;
    watermarkSize?: number;
    watermarkOpacity?: number;
    watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
