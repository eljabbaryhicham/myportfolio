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


const navItems = [
  { href: "/", label: "Home", icon: faHouse, public: true },
  { href: "/work", label: "Work", icon: faImage, public: true },
  { href: "/about", label: "About", icon: faCircleInfo, public: true },
  { href: "/contact", label: "Contact", icon: faEnvelope, public: true },
  { href: "/admin", label: "Admin", icon: faShieldHalved, public: false },
];

export function AppNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const isMobile = useIsMobile();

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo } = useDoc(contactDocRef);

  const logoUrl = contactInfo?.logoUrl || "https://i.imgur.com/N9c8oEJ.png";

  const regularItems = navItems.filter(item => item.label !== 'Admin');
  const adminItem = navItems.find(item => item.label === 'Admin');
  
  const renderNavItem = (item: (typeof navItems)[0]) => {
    const isActive = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
    const isAdminButton = item.label === 'Admin';

    const linkButton = (
      <Link
        href={item.href}
        className={cn(
          "group relative flex items-center justify-center rounded-md transition-all duration-300 hover:scale-110",
          "h-12 w-12 text-white",
          isActive
            ? isAdminButton
              ? "bg-green-500 scale-110"
              : "bg-destructive text-destructive-foreground scale-110 animate-glow"
            : isAdminButton
              ? "bg-green-500/80 hover:bg-green-500"
              : "text-foreground/70 glass-effect",
           isActive && isAdminButton && "animate-green-glow"
        )}
      >
        <FontAwesomeIcon icon={item.icon} className="h-7 w-7 transition-transform duration-300" />
      </Link>
    );

    if (isMobile) {
      return (
        <React.Fragment key={item.href}>
          {linkButton}
        </React.Fragment>
      );
    }
    
    return (
      <TooltipProvider key={item.href} delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {linkButton}
          </TooltipTrigger>
          <TooltipContent side="right" className="glass-effect text-foreground rounded-md">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  

  if (isMobile) {
    return (
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{ margin: '2%', height: '8vh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
      >
        <div className={cn(
          "flex h-full flex-row items-center justify-between px-4 rounded-lg border border-border/50 glass-effect"
          )}>
          <nav className="flex flex-1 justify-around items-center">
            {regularItems.map(renderNavItem)}
          </nav>
          {user && adminItem && (
            <div className="flex-shrink-0">
                {renderNavItem(adminItem)}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.aside
      className="w-full md:w-28 flex-shrink-0 p-0 md:p-4 mt-2 md:mt-0 h-auto md:h-auto"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
    >
      <div className={cn(
        "flex h-full flex-row md:flex-col items-center justify-between rounded-lg border border-border/50 px-4 py-2 md:p-4 glass-effect"
        )}>
        <Link href="/" className="hidden md:flex items-center justify-center text-primary w-8 mt-4">
          <Logo src={logoUrl} />
        </Link>
        <nav className="flex flex-row md:flex-col items-center justify-around md:justify-center w-full md:w-auto md:gap-10">
           {regularItems.map(renderNavItem)}
        </nav>
        <div className="flex flex-col items-center gap-4">
          {user && adminItem && (
            renderNavItem(adminItem)
          )}
          <div className="h-8 w-8 hidden md:block"></div>
        </div>
      </div>
    </motion.aside>
  );
}
