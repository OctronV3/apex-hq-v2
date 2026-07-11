"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserNav() {
  const { user, signOut, signIn } = useAuth();

  if (!user) {
    return (
      <Button
        onClick={signIn}
        size="sm"
        className="bg-white text-black hover:bg-[#eeeeee]"
      >
        Sign in
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent hover:bg-[#111111] outline-none">
        <Avatar className="h-9 w-9 border border-[#222222]">
          <AvatarFallback className="bg-[#111111] text-white text-xs">
            {user.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase() || "OP"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 border-[#222222] bg-[#0a0a0a] text-white"
        align="end"
      >
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-[#888888]">{user.email}</p>
        </div>
        <DropdownMenuSeparator className="bg-[#222222]" />
        <DropdownMenuItem onClick={signOut} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
