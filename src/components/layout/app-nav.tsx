
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { motion } from "framer-motion";
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHouse, faImage, faCircleInfo, faEnvelope, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import Logo from "../logo";
import { doc } from "firebase/firestore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LanguageSwitcher, useLanguage } from "@/components/layout/language-switcher";
import translations from "@/lib/i18n/translations";

const navItems = [
  { href: "/", key: "nav.home", icon: faHouse, public: true },
  { href: "/work", key: "nav.work", icon: faImage, public: true },
  { href: "/about", key: "nav.about", icon: faCircleInfo, public: true },
  { href: "/contact", key: "nav.contact", icon: faEnvelope, public: true },
  { href: "/admin", key: "nav.admin", icon: faShieldHalved, public: false, adminOnly: true },
];

interface HomePageSettings {
    isTestPageEnabled?: boolean;
    homePageLogoUrl?: string;
    menubarLogoSize?: number;
}

const MENUBAR_LOGO_CACHE_KEY = 'menubar-logo-url';

export function AppNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const isMobile = useIsMobile();
  const { lang } = useLanguage();
  const t = (key: string) => translations[lang]?.[key] ?? translations.en[key] ?? key;

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo } = useDoc(contactDocRef);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings } = useDoc<HomePageSettings>(settingsDocRef);

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

  React.useEffect(() => {
    const resolved = homeSettings?.homePageLogoUrl || contactInfo?.logoUrl;
    if (resolved && resolved !== cachedLogoUrl) {
      setCachedLogoUrl(resolved);
      try {
        window.localStorage.setItem(MENUBAR_LOGO_CACHE_KEY, resolved);
      } catch {
        // storage unavailable (e.g. private mode) — cache is best-effort
      }
    }
  }, [homeSettings?.homePageLogoUrl, contactInfo?.logoUrl, cachedLogoUrl]);


  const logoUrl = homeSettings?.homePageLogoUrl || contactInfo?.logoUrl || cachedLogoUrl;

  const accessibleNavItems = navItems.filter(item => {
    if (item.href === '/test') {
        return homeSettings?.isTestPageEnabled && user;
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
          className={cn(
            "group relative flex items-center justify-center rounded-full transition-all duration-300 aspect-square",
            isMobile ? 'h-[clamp(2.5rem,10vw,3rem)] w-[clamp(2.5rem,10vw,3rem)]' : "h-10 w-10",
            "text-white",
            isActive ? "" : (isSpecialButton ? "bg-cyan-500/80" : "glass-effect"),
          )}
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

    if (isMobile) {
      return (
        <div key={item.href} className="h-full flex flex-shrink-0 basis-auto items-center justify-center">
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
  

  if (isMobile) {
    return (
      <motion.div
        className="w-full flex-shrink-0 p-2"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
      >
        <div className={cn(
          "flex h-[7vh] min-h-[60px] flex-row items-center justify-between rounded-lg border border-border/50 glass-effect"
          )}>
          <nav className="flex h-full flex-1 items-center justify-between px-[4vw]">
            {accessibleNavItems.map(renderNavItem)}
          </nav>
          <LanguageSwitcher className="px-2 min-h-[44px]" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.aside
      className="w-full md:w-auto flex-shrink-0 p-2"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
    >
      <div className={cn(
        "flex h-full flex-row md:flex-col items-center justify-between rounded-lg border border-border/50 px-2 py-4 md:p-4 glass-effect"
        )}>
        {(() => {
            // Always reserve the logo slot so nav items don't shift when
            // the logo URL resolves asynchronously.
            const size = homeSettings?.menubarLogoSize || 48;
            const innerSize = size - 8;
            if (!logoUrl) {
              return <div className="mt-4" style={{ width: size, height: size }} aria-hidden="true" />;
            }
            return (
                <Link href="/" className="relative group mt-4">
                    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                        <div className="absolute inset-0 rounded-full animate-spinning-circle-border bg-gradient-to-r from-primary via-transparent to-transparent"></div>
                        <div className="relative bg-transparent rounded-full p-1 flex items-center justify-center" style={{ width: innerSize, height: innerSize }}>
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
        <div className="flex flex-col items-center gap-2">
          <LanguageSwitcher />
          <div className="h-8 w-8"></div>
        </div>
      </div>
    </motion.aside>
  );
}
