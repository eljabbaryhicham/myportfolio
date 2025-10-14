
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Images, Cat, Cog } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/work", label: "Work", icon: Images },
  { href: "/admin", label: "Admin", icon: Cog },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <aside className="w-24 flex-shrink-0 p-4 mr-4">
      <div className="flex h-full flex-col items-center justify-between rounded-lg border border-border/50 bg-background/50 backdrop-blur-xl p-4">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <Cat className="h-8 w-8" />
        </Link>
        <nav className="flex flex-col items-center gap-4">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "relative flex h-12 w-12 items-center justify-center rounded-md text-foreground/70 transition-all duration-300",
                  "glass-effect hover:scale-110",
                  isActive && "bg-accent/10 text-accent scale-110"
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="absolute left-full ml-4 hidden whitespace-nowrap bg-card px-3 py-1.5 text-sm font-medium text-card-foreground group-hover:flex">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div />
      </div>
    </aside>
  );
}
