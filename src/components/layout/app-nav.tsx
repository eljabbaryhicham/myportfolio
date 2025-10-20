
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
  
  const visibleNavItems = navItems.filter(item => item.public || (!item.public && user));


  const renderNavItem = (item: (typeof navItems)[0]) => {
    const isActive = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
    const isAdminButton = item.label === 'Admin';

    if (isAdminButton) {
      return (
         <Link
          key={item.label}
          href={item.href}
          className={cn(
            "group relative flex items-center justify-center rounded-md transition-all duration-300 hover:scale-110",
            "h-12 w-12 text-white",
            isActive
              ? "bg-green-500 scale-110 animate-green-glow"
              : "bg-green-500/80 hover:bg-green-500",
          )}
        >
          <FontAwesomeIcon icon={item.icon} className="h-7 w-7 transition-transform duration-300" />
          <span className={cn(
              "absolute whitespace-nowrap rounded-md bg-card px-3 py-1.5 text-sm font-medium text-card-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
              isMobile ? "bottom-full mb-2" : "left-full ml-4"
          )}>
            {item.label}
          </span>
        </Link>
      )
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        className={cn(
          "group relative flex h-10 w-10 items-center justify-center rounded-md transition-all duration-300 hover:scale-110",
          isActive
            ? "bg-destructive text-destructive-foreground scale-110 animate-glow"
            : "text-foreground/70 glass-effect",
        )}
      >
        <FontAwesomeIcon icon={item.icon} className="h-6 w-6 transition-transform duration-300" />
        <span className={cn(
            "absolute whitespace-nowrap rounded-md bg-card px-3 py-1.5 text-sm font-medium text-card-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
            isMobile ? "bottom-full mb-2" : "left-full ml-4"
        )}>
          {item.label}
        </span>
      </Link>
    );
  };
  
  const finalNavItems = [...regularItems];
  if (adminItem && visibleNavItems.includes(adminItem)) {
    finalNavItems.push(adminItem);
  }


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
          <nav className="flex flex-row items-center justify-around w-full">
            {finalNavItems.map(renderNavItem)}
          </nav>
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
        <nav className="flex flex-row md:flex-col items-center justify-around md:justify-center w-full md:w-auto md:gap-8">
           {finalNavItems.map(renderNavItem)}
        </nav>
        <div className="hidden md:flex flex-col items-center gap-4">
          <div className="h-8 w-8 hidden md:block"></div>
        </div>
      </div>
    </motion.aside>
  );
}
