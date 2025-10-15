
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Images, Cat, Cog, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home, public: true },
  { href: "/work", label: "Work", icon: Images, public: true },
  { href: "/admin", label: "Admin", icon: Cog, public: false },
];

export function AppNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const visibleNavItems = navItems.filter(item => item.public || (!item.public && user));

  return (
    <aside className="w-24 flex-shrink-0 p-4 mr-4">
      <div className="flex h-full flex-col items-center justify-between rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl p-4">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <Cat className="h-8 w-8" />
        </Link>
        <nav className="flex flex-col items-center gap-4">
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
                  "group relative flex h-12 w-12 items-center justify-center rounded-2xl text-foreground/70 transition-all duration-300",
                  "glass-effect hover:scale-110",
                  isActive && "bg-destructive text-white scale-110"
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="absolute left-full ml-4 hidden whitespace-nowrap rounded-md bg-card px-3 py-1.5 text-sm font-medium text-card-foreground group-hover:flex">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-4">
          {(!isClient || isUserLoading) ? (
            <div className="h-12 w-12 rounded-2xl bg-muted/50" />
          ) : !user ? (
            <Link
                href="/login"
                className={cn(
                    "group relative flex h-12 w-12 items-center justify-center rounded-2xl text-foreground/70 transition-all duration-300",
                    "glass-effect hover:scale-110",
                    pathname === "/login" && "bg-destructive text-white scale-110"
                )}
            >
                <LogIn className="h-6 w-6" />
                  <span className="absolute left-full ml-4 hidden whitespace-nowrap rounded-md bg-card px-3 py-1.5 text-sm font-medium text-card-foreground group-hover:flex">
                    Login
                </span>
            </Link>
          ) : <div className="h-12 w-12"></div>}
        </div>
      </div>
    </aside>
  );
}
