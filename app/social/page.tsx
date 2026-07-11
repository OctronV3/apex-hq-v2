"use client";

import { useState } from "react";
import { SocialHub } from "@/components/social/social-hub";
import { SocialDashboard } from "@/components/social/social-dashboard";
import { Button } from "@/components/ui/button";

export default function SocialPage() {
  const [tab, setTab] = useState<"hub" | "posts">("hub");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Social Media</h2>
          <p className="text-[#888888]">Manage accounts, open platforms, and schedule posts.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={tab === "hub" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("hub")}
            className={
              tab === "hub"
                ? "bg-[#ff1a1a] text-white hover:bg-[#d60a0a]"
                : "border-[#222222] bg-[#111111] text-white hover:bg-[#222222]"
            }
          >
            Hub
          </Button>
          <Button
            variant={tab === "posts" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("posts")}
            className={
              tab === "posts"
                ? "bg-[#ff1a1a] text-white hover:bg-[#d60a0a]"
                : "border-[#222222] bg-[#111111] text-white hover:bg-[#222222]"
            }
          >
            Posts
          </Button>
        </div>
      </div>
      {tab === "hub" ? <SocialHub /> : <SocialDashboard />}
    </div>
  );
}
