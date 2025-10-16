
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Images, Cat, LogIn, Info, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/firebase";

const navItems = [
  { href: "/", label: "Home", icon: Home, public: true },
  { href: "/work", label: "Work", icon: Images, public: true },
  { href: "/about", label: "About", icon: Info, public: true },
  { href: "/contact", label: "Contact", icon: Mail, public: true },
];

export function AppNav() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  const visibleNavItems = navItems.filter(item => item.public);

  return (
    <aside className="w-full md:w-28 flex-shrink-0 p-0 md:p-4 mt-2 md:mt-0">
      <div className={cn("flex h-auto md:h-full flex-row md:flex-col items-center justify-between rounded-lg border border-border/50 p-4 md:p-8 glass-effect")}>
        <Link href="/" className="flex items-center gap-2 text-primary">
          <Cat className="h-8 w-8" />
        </Link>
        <nav className="flex flex-row md:flex-col items-center gap-4 md:gap-6">
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
                  "group relative flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-md transition-all duration-300 hover:scale-110",
                  isActive
                    ? "bg-destructive text-destructive-foreground scale-110"
                    : "text-foreground/70 glass-effect"
                )}
              >
                <item.icon className="h-5 w-5 md:h-6 md:w-6" />
                <span className="absolute bottom-full mb-2 md:left-full md:bottom-auto md:mb-0 md:ml-4 hidden whitespace-nowrap rounded-md bg-card px-3 py-1.5 text-sm font-medium text-card-foreground group-hover:flex">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 md:h-12 md:w-12 hidden md:block"></div>
        </div>
      </div>
    </aside>
  );
}
