
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Images, Cat, Info, Mail, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";
import { motion } from "framer-motion";
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

  return (
    <motion.aside
      key={pathname} 
      initial={isMobile ? { y: "100%" } : { x: "100%" }}
      animate={{ x: 0, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full md:w-28 flex-shrink-0 p-0 md:p-4 mt-2 md:mt-0 h-[10vh] md:h-auto"
    >
      <div className={cn("flex h-full flex-row md:flex-col items-center justify-center md:justify-between rounded-lg border border-border/50 px-4 py-2 md:p-8 glass-effect")}>
        <Link href="/" className="hidden md:flex items-center gap-2 text-primary">
          <Cat className="h-8 w-8" />
        </Link>
        <nav className="flex flex-row md:flex-col items-center justify-around md:justify-center w-full md:w-auto md:gap-6">
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
                  "group relative flex h-12 w-12 items-center justify-center rounded-md transition-all duration-300 hover:scale-110",
                  isActive
                    ? "bg-destructive text-destructive-foreground scale-110"
                    : "text-foreground/70 glass-effect"
                )}
              >
                <item.icon className="h-6 w-6" />
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
