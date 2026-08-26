/**
 * Shared view of the `homepage/settings` document.
 * All fields optional — consumers pick what they need; HomeAdmin owns the full write schema.
 */
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
    workHeading?: string;
    workSubtitle?: string;
    aboutHeading?: string;
    aboutSubtitle?: string;
    contactHeading?: string;
    contactSubtitle?: string;
    glassOpacity?: number;
    mediaWidth?: number;
    showMediaTitles?: boolean;
    glassColor?: string;
}
