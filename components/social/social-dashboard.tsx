"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  useSocialPosts,
  useAddSocialPost,
  useUpdateSocialPost,
  useDeleteSocialPost,
} from "@/hooks/use-apex";
import { SocialPost, SocialPlatform, SocialStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const platformColor: Record<SocialPlatform, string> = {
  twitter: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  x: "bg-white/10 text-white border-white/20",
  linkedin: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  instagram: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  threads: "bg-white/10 text-white border-white/20",
  facebook: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  youtube: "bg-red-500/10 text-red-500 border-red-500/20",
  tiktok: "bg-white/10 text-white border-white/20",
  bluesky: "bg-sky-400/10 text-sky-400 border-sky-400/20",
};

function PostCard({
  post,
}: {
  post: SocialPost;
}) {
  const update = useUpdateSocialPost();
  const remove = useDeleteSocialPost();

  return (
    <div className="rounded border border-[#222222] bg-[#111111] p-4 space-y-3">
      <div className="flex items-start justify-between">
        <Badge variant="outline" className={platformColor[post.platform]}>
          {post.platform}
        </Badge>
        <button
          onClick={() => remove.mutate(post.id)}
          className="text-[#888888] hover:text-[#ff1a1a] text-xs"
        >
          Delete
        </button>
      </div>
      <p className="text-sm text-white whitespace-pre-wrap">{post.content}</p>
      <div className="flex items-center justify-between">
        <Select
          value={post.status}
          onValueChange={(v) =>
            update.mutate({
              id: post.id,
              patch: { status: v as SocialStatus },
            })
          }
        >
          <SelectTrigger className="h-7 w-32 bg-[#0a0a0a] border-[#222222] text-xs text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-[#222222] bg-[#0a0a0a] text-white">
            {["draft", "scheduled", "published"].map((s) => (
              <SelectItem key={s} value={s} className="text-white">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {post.publishedAt && (
          <span className="text-xs text-[#888888]">
            {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
          </span>
        )}
      </div>
      {post.metrics && (
        <div className="flex gap-4 text-xs text-[#888888]">
          <span>{post.metrics.likes} likes</span>
          <span>{post.metrics.shares} shares</span>
          <span>{post.metrics.comments} comments</span>
          <span>{post.metrics.impressions.toLocaleString()} impressions</span>
        </div>
      )}
    </div>
  );
}

function AddPostDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const add = useAddSocialPost();
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform>("twitter");
  const [status, setStatus] = useState<SocialStatus>("draft");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    add.mutate(
      { content, platform, status },
      { onSuccess: () => setOpen(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="border-[#222222] bg-[#0a0a0a] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="bg-[#111111] border-[#222222] text-white resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select
                value={platform}
                onValueChange={(v) => setPlatform(v as SocialPlatform)}
              >
                <SelectTrigger className="bg-[#111111] border-[#222222] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#222222] bg-[#0a0a0a] text-white">
                  {["twitter", "x", "linkedin", "instagram", "threads", "facebook", "youtube", "tiktok", "bluesky"].map((p) => (
                    <SelectItem key={p} value={p} className="text-white">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as SocialStatus)}>
                <SelectTrigger className="bg-[#111111] border-[#222222] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#222222] bg-[#0a0a0a] text-white">
                  {["draft", "scheduled", "published"].map((s) => (
                    <SelectItem key={s} value={s} className="text-white">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="submit"
            className="bg-[#ff1a1a] hover:bg-[#d60a0a] text-white"
          >
            Create Post
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SocialDashboard() {
  const { data, isLoading } = useSocialPosts();
  const [open, setOpen] = useState(false);

  const drafts = data?.filter((p) => p.status === "draft") || [];
  const scheduled = data?.filter((p) => p.status === "scheduled") || [];
  const published = data?.filter((p) => p.status === "published") || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[#888888]">Plan, schedule, and track social content.</p>
        <Button
          onClick={() => setOpen(true)}
          size="sm"
          className="bg-[#ff1a1a] hover:bg-[#d60a0a] text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> New post
        </Button>
      </div>
      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList className="bg-[#111111] border border-[#222222] text-[#888888]">
          <TabsTrigger value="scheduled" className="data-[active]:bg-[#ff1a1a] data-[active]:text-white">
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="drafts" className="data-[active]:bg-[#ff1a1a] data-[active]:text-white">
            Drafts
          </TabsTrigger>
          <TabsTrigger value="published" className="data-[active]:bg-[#ff1a1a] data-[active]:text-white">
            Published
          </TabsTrigger>
        </TabsList>
        <TabsContent value="scheduled" className="mt-4 space-y-3">
          {isLoading ? (
            <div className="h-48 animate-pulse rounded bg-[#111111]" />
          ) : (
            scheduled.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </TabsContent>
        <TabsContent value="drafts" className="mt-4 space-y-3">
          {drafts.map((post) => <PostCard key={post.id} post={post} />)}
        </TabsContent>
        <TabsContent value="published" className="mt-4 space-y-3">
          {published.map((post) => <PostCard key={post.id} post={post} />)}
        </TabsContent>
      </Tabs>
      <AddPostDialog open={open} setOpen={setOpen} />
    </div>
  );
}
