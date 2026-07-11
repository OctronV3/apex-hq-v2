"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  Mail,
  Menu,
  Newspaper,
  Share2,
  Shield,
  Users,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AppSidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Newsletter", href: "/newsletter", icon: Newspaper },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Sponsors", href: "/sponsors", icon: Users },
  { name: "Social", href: "/social", icon: Share2 },
  { name: "Email", href: "/email", icon: Mail },
];

export function AppSidebar({ mobileOpen, setMobileOpen }: AppSidebarProps) {
  const pathname = usePathname();

  const NavList = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-[#ff1a1a] text-black">
          <Shield className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Apex HQ</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[#111111] text-white border-l-2 border-[#ff1a1a]"
                  : "text-[#888888] hover:bg-[#111111] hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 text-xs text-[#888888]">
        <div className="rounded border border-[#222222] bg-[#0a0a0a] p-3">
          <p className="font-medium text-white">v0.1.0</p>
          <p className="mt-1">Centralized command online.</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r border-[#222222] bg-black md:flex">
        {NavList}
      </aside>

      {/* Mobile */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md text-white hover:bg-[#111111]">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 border-[#222222] bg-black p-0">
          {NavList}
        </SheetContent>
      </Sheet>
    </>
  );
}
