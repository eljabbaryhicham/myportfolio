
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Images, Cat, Info, Mail, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";
import { motion } from "framer-motion";
import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { href: "/", label: "Home", icon: Home, public: true },
  { href: "/work", label: "Work", icon: Images, public: true },
  { href: "/about", label: "About", icon: Info, public: true },
  { href: "/contact", label: "Contact", icon: Mail, public: true },
  { href: "/admin", label: "Admin", icon: Shield, public: false },
];

export function AppNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const isMobile = useIsMobile();

  const visibleNavItems = navItems.filter(item => item.public || (!item.public && user));

  if (isMobile) {
    return (
      <motion.div
        className="fixed bottom-0 left-0 right-0 h-[5vh] z-50"
        style={{ margin: '5%', height: '5vh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
      >
        <div className={cn(
          "flex h-full flex-row items-center justify-around rounded-lg border border-border/50 glass-effect"
          )}>
          <nav className="flex flex-row items-center justify-around w-full">
            {visibleNavItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "group relative flex h-14 w-14 items-center justify-center rounded-md transition-all duration-300 hover:scale-110",
                    isActive
                      ? "bg-destructive text-destructive-foreground scale-110"
                      : "text-foreground/70 glass-effect"
                  )}
                >
                  <item.icon className="h-8 w-8" />
                  <span className="absolute bottom-full mb-2 hidden whitespace-nowrap rounded-md bg-card px-3 py-1.5 text-sm font-medium text-card-foreground group-hover:flex">
                    {item.label}
                  </span>
                </Link>
              );
            })}
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
        "flex h-full flex-row md:flex-col items-center justify-around md:justify-between rounded-lg border border-border/50 px-4 py-2 md:p-8 glass-effect"
        )}>
        <Link href="/" className="hidden md:flex items-center gap-2 text-primary">
          <Cat className="h-10 w-10" />
        </Link>
        <nav className="flex flex-row md:flex-col items-center justify-around md:justify-center w-full md:w-auto md:gap-8">
          {visibleNavItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "group relative flex h-14 w-14 items-center justify-center rounded-md transition-all duration-300 hover:scale-110",
                  isActive
                    ? "bg-destructive text-destructive-foreground scale-110"
                    : "text-foreground/70 glass-effect"
                )}
              >
                <item.icon className="h-8 w-8" />
                <span className="absolute bottom-full mb-2 md:left-full md:bottom-auto md:mb-0 md:ml-4 hidden whitespace-nowrap rounded-md bg-card px-3 py-1.5 text-sm font-medium text-card-foreground group-hover:flex">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:flex flex-col items-center gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 hidden md:block"></div>
        </div>
      </div>
    </motion.aside>
  );
}
