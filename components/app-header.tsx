"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandMenu } from "./command-menu";
import { UserNav } from "./user-nav";
import { NotificationsDropdown } from "./notifications/notifications-dropdown";

interface AppHeaderProps {
  onMenuClick: () => void;
}

function titleFromPath(path: string) {
  if (path === "/") return "Dashboard";
  return path.replace(/^\//, "").replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const pathname = usePathname();
  const title = titleFromPath(pathname || "/");

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#222222] bg-black/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden text-white"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
        <h1 className="text-base font-semibold tracking-tight capitalize md:text-lg">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <CommandMenu />
        <NotificationsDropdown />
        <UserNav />
      </div>
    </header>
  );
}
