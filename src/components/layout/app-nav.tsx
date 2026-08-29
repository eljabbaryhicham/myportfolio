
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { motion } from "framer-motion";
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faImage, faCircleInfo, faEnvelope, faShieldHalved, faFlask } from "@fortawesome/free-solid-svg-icons";
import Logo from "../logo";
import { doc } from "firebase/firestore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/components/layout/language-switcher";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import translations from "@/lib/i18n/translations";

const navItems = [
  { href: "/", key: "nav.home", icon: faHouse, public: true },
  { href: "/work", key: "nav.work", icon: faImage, public: true },
  { href: "/about", key: "nav.about", icon: faCircleInfo, public: true },
  { href: "/contact", key: "nav.contact", icon: faEnvelope, public: true },
  { href: "/test", key: "nav.test", icon: faFlask, public: false, requiresSetting: 'isTestPageEnabled' as const },
  { href: "/admin", key: "nav.admin", icon: faShieldHalved, public: false, adminOnly: true },
];

import type { HomePageSettings } from '@/lib/types';
import { useHomePageSettings } from '@/components/settings/home-page-settings-provider';

const MENUBAR_LOGO_CACHE_KEY = 'menubar-logo-url';
const NAV_BUTTON_SIZE_CACHE_KEY = 'menubar-nav-button-size';
const MENUBAR_LOGO_SIZE_CACHE_KEY = 'menubar-logo-size';

export function AppNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();
  const { lang } = useLanguage();
  const t = (key: string) => translations[lang]?.[key] ?? translations.en[key] ?? key;

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo } = useDoc(contactDocRef);

  // homepage/settings comes from the shared provider (server-seeded + live).
  const { settings: homeSettings } = useHomePageSettings();

  // Hydrate the logo instantly from a local cache instead of waiting for the
  // Firestore settings/contact docs to resolve on every page load.
  const [cachedLogoUrl, setCachedLogoUrl] = React.useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(MENUBAR_LOGO_CACHE_KEY);
    } catch {
      return null;
    }
  });

  // Keep the button/logo sizes in sync with Firestore live: whenever the
  // settings change (e.g. from the admin panel), update the CSS variable (which
  // the buttons/logo read) and refresh the first-paint cache. The initial
  // value on first paint comes from the inline head script reading localStorage.
  React.useEffect(() => {
    if (homeSettings?.navButtonSize) {
      document.documentElement.style.setProperty('--nav-button-size', `${homeSettings.navButtonSize}px`);
      try {
        window.localStorage.setItem(NAV_BUTTON_SIZE_CACHE_KEY, String(homeSettings.navButtonSize));
      } catch {}
    }
  }, [homeSettings?.navButtonSize]);

  React.useEffect(() => {
    if (homeSettings?.menubarLogoSize) {
      document.documentElement.style.setProperty('--menubar-logo-size', `${homeSettings.menubarLogoSize}px`);
      try {
        window.localStorage.setItem(MENUBAR_LOGO_SIZE_CACHE_KEY, String(homeSettings.menubarLogoSize));
      } catch {}
    }
  }, [homeSettings?.menubarLogoSize]);

  React.useEffect(() => {
    const resolved = homeSettings?.menubarLogoUrl || homeSettings?.homePageLogoUrl || contactInfo?.logoUrl;
    if (resolved && resolved !== cachedLogoUrl) {
      setCachedLogoUrl(resolved);
      try {
        window.localStorage.setItem(MENUBAR_LOGO_CACHE_KEY, resolved);
      } catch {
        // storage unavailable (e.g. private mode) — cache is best-effort
      }
    }
  }, [homeSettings?.menubarLogoUrl, homeSettings?.homePageLogoUrl, contactInfo?.logoUrl, cachedLogoUrl]);


  const logoUrl = homeSettings?.menubarLogoUrl || homeSettings?.homePageLogoUrl || contactInfo?.logoUrl || cachedLogoUrl;

  const accessibleNavItems = navItems.filter(item => {
    if (item.requiresSetting) {
        return (homeSettings as any)?.[item.requiresSetting] && user;
    }
    if(item.adminOnly) {
        return user;
    }
    return item.public;
  });
  
  const renderNavItem = (item: (typeof navItems)[0]) => {
    const isActive = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
    const isAdminButton = item.href === '/admin';
    const isSpecialButton = isAdminButton;
    const label = t(item.key);

    const navButtonContent = (
      <div className="relative">
        <Link
          href={item.href}
          aria-label={label}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "group relative flex items-center justify-center rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            hasMounted && isMobile ? 'h-[clamp(2.5rem,10vw,3rem)] w-[clamp(2.5rem,10vw,3rem)] aspect-square' : "",
            "text-white",
            isActive ? "" : (isSpecialButton ? "bg-cyan-500/80" : "glass-effect"),
          )}
          style={isMobile ? undefined : { width: 'var(--nav-button-size)', height: 'var(--nav-button-size)' }}
        >
          {isActive && (
            <motion.div
              layoutId="active-nav-highlight"
              className={cn(
                "absolute inset-0 rounded-full",
                isAdminButton
                  ? "bg-green-500 shadow-[0_0_15px_#22c55e80,_0_0_20px_#22c55e60]"
                  : "bg-destructive shadow-[0_0_15px_hsl(var(--primary)/0.8),_0_0_20px_hsl(var(--primary)/0.6)]"
              )}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          )}
          <FontAwesomeIcon
            icon={item.icon}
            className={cn(
              "h-[50%] w-[50%] relative z-10 transition-colors",
              isActive ? "text-white" : "text-white/70 group-hover:text-white"
            )}
          />
        </Link>
      </div>
    );

    if (hasMounted && isMobile) {
      return (
        <div key={item.href} className="h-full flex flex-1 items-center justify-center">
            {navButtonContent}
        </div>
      );
    }

    return (
      <TooltipProvider key={item.href}>
        <Tooltip>
          <TooltipTrigger asChild>
            {navButtonContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="glass-effect rounded-md">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  };
  

  if (hasMounted && isMobile) {
    return (
      <div className="w-full flex-shrink-0 p-2 nav-slide-in">
        <div className={cn(
          "flex h-[7vh] min-h-[60px] flex-row items-center justify-between rounded-lg border border-border/50 glass-effect px-2"
          )}>
          <nav aria-label="Primary" className="flex h-full flex-1 items-center justify-evenly px-2">
            {accessibleNavItems.map(renderNavItem)}
          </nav>
          <LanguageSwitcher color={homeSettings?.languageToggleColor} />
        </div>
      </div>
    );
  }

  return (
    <aside className="w-full md:w-auto flex-shrink-0 p-2 nav-slide-in">
      <div className={cn(
        "flex h-full flex-row md:flex-col items-center justify-between rounded-lg border border-border/50 px-2 py-4 md:p-4 glass-effect"
        )}>
        {(() => {
            // Always reserve the logo slot so nav items don't shift when
            // the logo URL resolves asynchronously.
            if (!logoUrl) {
              return <div className="mt-4 hidden md:block" style={{ width: 'var(--menubar-logo-size)', height: 'var(--menubar-logo-size)' }} aria-hidden="true" />;
            }
            return (
                <Link href="/" className="relative group mt-4 hidden md:block">
                    <div className="relative flex items-center justify-center" style={{ width: 'var(--menubar-logo-size)', height: 'var(--menubar-logo-size)' }}>
                        <div className="absolute inset-0 rounded-full animate-spinning-circle-border bg-gradient-to-r from-primary via-transparent to-transparent"></div>
                        <div className="relative bg-transparent rounded-full p-1 flex items-center justify-center" style={{ width: 'calc(var(--menubar-logo-size) - 8px)', height: 'calc(var(--menubar-logo-size) - 8px)' }}>
                            <Logo src={logoUrl} />
                        </div>
                    </div>
                </Link>
            );
        })()}
        <nav 
          className="flex flex-row md:flex-col items-center justify-around md:justify-center w-full md:w-auto md:gap-10"
        >
           {accessibleNavItems.map(renderNavItem)}
        </nav>
        {/* Language switch balances the logo slot on desktop */}
        <div className="flex flex-col items-center gap-2">
          <LanguageSwitcher color={homeSettings?.languageToggleColor} />
        </div>
      </div>
    </aside>
  );
}
