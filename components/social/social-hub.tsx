"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Briefcase,
  Image,
  ThumbsUp,
  Play,
  Music,
  MessageSquare,
  Cloud,
  Globe,
  Plus,
  ExternalLink,
  Smartphone,
  Unlink,
  BarChart3,
} from "lucide-react";
import {
  useSocialConnections,
  useAddSocialConnection,
  useDeleteSocialConnection,
} from "@/hooks/use-apex";
import { openSocialPlatform, platformUrl } from "@/lib/social";
import { SocialPlatform } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const platforms: {
  key: SocialPlatform;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  requiresApi: boolean;
}[] = [
  { key: "x", name: "X / Twitter", icon: AtSign, color: "text-white", requiresApi: true },
  { key: "linkedin", name: "LinkedIn", icon: Briefcase, color: "text-blue-500", requiresApi: true },
  { key: "instagram", name: "Instagram", icon: Image, color: "text-pink-500", requiresApi: true },
  { key: "facebook", name: "Facebook", icon: ThumbsUp, color: "text-blue-400", requiresApi: true },
  { key: "youtube", name: "YouTube", icon: Play, color: "text-red-500", requiresApi: true },
  { key: "tiktok", name: "TikTok", icon: Music, color: "text-white", requiresApi: true },
  { key: "threads", name: "Threads", icon: MessageSquare, color: "text-white", requiresApi: true },
  { key: "bluesky", name: "Bluesky", icon: Cloud, color: "text-sky-400", requiresApi: true },
];

function numberFmt(n?: number) {
  if (n === undefined || n === null) return "—";
  return n.toLocaleString();
}

export function SocialHub() {
  const router = useRouter();
  const { data: connections, isLoading } = useSocialConnections();
  const add = useAddSocialConnection();
  const remove = useDeleteSocialConnection();
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | null>(null);
  const [accountHandle, setAccountHandle] = useState("");
  const [accountName, setAccountName] = useState("");
  const [method, setMethod] = useState<"api" | "webview">("webview");

  const connectedByPlatform = new Map(
    (connections || []).map((c) => [c.platform, c])
  );

  function openConnect(platform: SocialPlatform) {
    setSelectedPlatform(platform);
    setAccountHandle("");
    setAccountName("");
    setMethod("webview");
  }

  function submitConnection(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlatform) return;
    add.mutate(
      {
        platform: selectedPlatform,
        accountHandle: accountHandle || undefined,
        accountName: accountName || undefined,
        profileUrl: platformUrl(selectedPlatform, accountHandle),
        connectionMethod: method,
        status: "connected",
        connectedAt: new Date().toISOString(),
      },
      {
        onSuccess: (conn) => {
          setSelectedPlatform(null);
          if (method === "webview") {
            openSocialPlatform(conn.platform, conn.accountHandle);
          }
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-lg bg-[#111111]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Connected platforms</h3>
          <p className="text-sm text-[#888888]">
            Link accounts and open them inside Apex HQ.
          </p>
        </div>
        <Button
          onClick={() => setSelectedPlatform("x")}
          size="sm"
          className="bg-[#ff1a1a] hover:bg-[#d60a0a] text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Add account
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {platforms.map((platform) => {
          const connection = connectedByPlatform.get(platform.key);
          const Icon = platform.icon;
          return (
            <Card
              key={platform.key}
              className="border-[#222222] bg-[#0a0a0a] transition-colors hover:border-[#333333]"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-[#111111] ${platform.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-white">{platform.name}</CardTitle>
                    <p className="text-xs text-[#888888]">
                      {connection ? connection.status : "Not connected"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {connection ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openSocialPlatform(platform.key, connection.accountHandle)}
                        className="h-8 w-8 text-[#888888] hover:text-white hover:bg-[#222222]"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove.mutate(connection.id)}
                        className="h-8 w-8 text-[#888888] hover:text-[#ff1a1a] hover:bg-[#222222]"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openConnect(platform.key)}
                      className="text-[#ff1a1a] hover:bg-[#222222] hover:text-white"
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {connection ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#888888]">
                        {connection.accountHandle || connection.accountName || "Account"}
                      </span>
                      <span className="text-xs text-[#666666]">
                        {connection.connectionMethod === "api" ? "API" : "In-app"}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded bg-[#111111] p-2">
                        <p className="text-xs text-[#888888]">Followers</p>
                        <p className="text-sm font-medium text-white">
                          {numberFmt(connection.metrics?.followers)}
                        </p>
                      </div>
                      <div className="rounded bg-[#111111] p-2">
                        <p className="text-xs text-[#888888]">Reach</p>
                        <p className="text-sm font-medium text-white">
                          {numberFmt(connection.metrics?.reach)}
                        </p>
                      </div>
                      <div className="rounded bg-[#111111] p-2">
                        <p className="text-xs text-[#888888]">Views</p>
                        <p className="text-sm font-medium text-white">
                          {numberFmt(connection.metrics?.views)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/social?platform=${platform.key}`)}
                      className="w-full border-[#222222] bg-[#111111] text-white hover:bg-[#222222]"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" /> View posts
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-[#888888]">
                      Connect to schedule, publish, and view analytics without leaving HQ.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openConnect(platform.key)}
                        className="flex-1 border-[#222222] bg-[#111111] text-white hover:bg-[#222222]"
                      >
                        <Smartphone className="mr-2 h-4 w-4" /> Open in app
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedPlatform} onOpenChange={(open) => !open && setSelectedPlatform(null)}>
        <DialogContent className="border-[#222222] bg-[#0a0a0a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Connect {selectedPlatform && platforms.find((p) => p.key === selectedPlatform)?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitConnection} className="space-y-4">
            <div className="space-y-2">
              <Label>Account name</Label>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="My Business"
                className="bg-[#111111] border-[#222222] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Handle / URL path</Label>
              <Input
                value={accountHandle}
                onChange={(e) => setAccountHandle(e.target.value)}
                placeholder="username"
                className="bg-[#111111] border-[#222222] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Connection method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={method === "webview" ? "default" : "outline"}
                  onClick={() => setMethod("webview")}
                  className={
                    method === "webview"
                      ? "bg-[#ff1a1a] text-white hover:bg-[#d60a0a]"
                      : "border-[#222222] bg-[#111111] text-white hover:bg-[#222222]"
                  }
                >
                  <Smartphone className="mr-2 h-4 w-4" /> In-app
                </Button>
                <Button
                  type="button"
                  variant={method === "api" ? "default" : "outline"}
                  onClick={() => setMethod("api")}
                  className={
                    method === "api"
                      ? "bg-[#ff1a1a] text-white hover:bg-[#d60a0a]"
                      : "border-[#222222] bg-[#111111] text-white hover:bg-[#222222]"
                  }
                >
                  <Globe className="mr-2 h-4 w-4" /> API / OAuth
                </Button>
              </div>
            </div>
            {method === "api" && (
              <p className="text-xs text-[#888888]">
                API/OAuth connections require Nango or a provider app. This will create a pending connection and open the platform in the app for now.
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-[#ff1a1a] hover:bg-[#d60a0a] text-white"
              disabled={add.isPending}
            >
              {add.isPending ? "Connecting..." : "Connect account"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
