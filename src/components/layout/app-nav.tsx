
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

  const accessibleNavItems = navItems.filter(item => item.public || user);
  
  const renderNavItem = (item: (typeof navItems)[0]) => {
    const isActive = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
    const isAdminButton = item.label === 'Admin';

    const navButton = (
      <Link
        href={item.href}
        className={cn(
          "group relative flex items-center justify-center rounded-full transition-all duration-300 hover:scale-110 aspect-square",
          "h-10 w-10 md:h-10 md:w-10",
          "text-white", 
          isActive
            ? isAdminButton
              ? "bg-green-500"
              : "bg-destructive text-destructive-foreground shadow-[0_0_15px_hsl(var(--primary)/0.8),_0_0_20px_hsl(var(--primary)/0.6)]"
            : isAdminButton
              ? "bg-green-500/80 hover:bg-green-500"
              : "text-foreground/70 glass-effect",
           isActive && isAdminButton && "shadow-[0_0_15px_#22c55e80,_0_0_20px_#22c55e60]",
        )}
      >
        <FontAwesomeIcon icon={item.icon} className={cn("transition-transform duration-300 group-hover:rotate-[360deg] h-[50%] w-[50%]")} />
      </Link>
    );

    if (isMobile) {
      return (
        <div className="h-full flex items-center justify-center">
            {navButton}
        </div>
      );
    }

    return (
      <TooltipProvider key={item.href}>
        <Tooltip>
          <TooltipTrigger asChild>
            {navButton}
          </TooltipTrigger>
          <TooltipContent side="right" className="glass-effect rounded-md">
            <p>{item.label}</p>
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
          <nav className="flex h-full flex-1 justify-center items-center gap-8">
            {accessibleNavItems.map(item => <div key={item.href} className="flex h-full items-center justify-center">{renderNavItem(item)}</div>)}
          </nav>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.aside
      className="w-full md:w-auto flex-shrink-0 p-0 md:p-2"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
    >
      <div className={cn(
        "flex h-full flex-row md:flex-col items-center justify-between rounded-lg border border-border/50 px-2 py-2 md:p-4 glass-effect"
        )}>
        <Link href="/" className="hidden md:block relative group mt-4">
            <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full animate-spinning-circle-border bg-gradient-to-r from-primary via-transparent to-transparent"></div>
                <div className="relative bg-background rounded-full p-1 w-10 h-10 flex items-center justify-center">
                    <Logo src={logoUrl} />
                </div>
            </div>
        </Link>
        <nav className="flex flex-row md:flex-col items-center justify-around md:justify-center w-full md:w-auto md:gap-10">
           {accessibleNavItems.map(renderNavItem)}
        </nav>
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 hidden md:block"></div>
        </div>
      </div>
    </motion.aside>
  );
}
