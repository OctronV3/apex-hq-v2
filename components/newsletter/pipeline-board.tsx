"use client";

import { useState } from "react";
import { Plus, Send, Calendar, PenTool, Lightbulb } from "lucide-react";
import {
  useNewsletters,
  useUpdateNewsletter,
  useDeleteNewsletter,
  useAddNewsletter,
} from "@/hooks/use-apex";
import { NewsletterItem, PipelineStage } from "@/types";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const stages: { key: PipelineStage; label: string; icon: typeof Lightbulb }[] = [
  { key: "idea", label: "Idea", icon: Lightbulb },
  { key: "writing", label: "Writing", icon: PenTool },
  { key: "scheduled", label: "Scheduled", icon: Calendar },
  { key: "sent", label: "Sent", icon: Send },
];

function stageColor(stage: PipelineStage) {
  switch (stage) {
    case "idea":
      return "bg-[#111111] text-[#888888] border-[#222222]";
    case "writing":
      return "bg-[#111111] text-white border-[#222222]";
    case "scheduled":
      return "bg-[#ff1a1a]/10 text-[#ff1a1a] border-[#ff1a1a]/20";
    case "sent":
      return "bg-white/10 text-white border-white/20";
  }
}

function AddNewsletterDialog({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [stage, setStage] = useState<PipelineStage>("idea");
  const add = useAddNewsletter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    add.mutate(
      { title, author: author || "Operator", stage, tags: [] },
      { onSuccess: () => setOpen(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="border-[#222222] bg-[#0a0a0a] text-white">
        <DialogHeader>
          <DialogTitle>New Newsletter Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#111111] border-[#222222] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Author</Label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="bg-[#111111] border-[#222222] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label>Stage</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as PipelineStage)}>
              <SelectTrigger className="bg-[#111111] border-[#222222] text-white">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent className="border-[#222222] bg-[#0a0a0a] text-white">
                {stages.map((s) => (
                  <SelectItem key={s.key} value={s.key} className="text-white">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="bg-[#ff1a1a] hover:bg-[#d60a0a] text-white">
            Add to pipeline
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PipelineCard({ item }: { item: NewsletterItem }) {
  const update = useUpdateNewsletter();
  const remove = useDeleteNewsletter();

  function moveStage(stage: PipelineStage) {
    update.mutate({ id: item.id, patch: { stage } });
  }

  return (
    <div className="rounded border border-[#222222] bg-[#111111] p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-white">{item.title}</p>
        <button
          onClick={() => remove.mutate(item.id)}
          className="text-[#888888] hover:text-[#ff1a1a] text-xs"
        >
          ×
        </button>
      </div>
      <p className="text-xs text-[#888888]">{item.author}</p>
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className={stageColor(item.stage)}>
          {item.stage}
        </Badge>
        <Select value={item.stage} onValueChange={(v) => moveStage(v as PipelineStage)}>
          <SelectTrigger className="h-7 w-28 bg-[#0a0a0a] border-[#222222] text-xs text-white">
            <SelectValue placeholder="Move" />
          </SelectTrigger>
          <SelectContent className="border-[#222222] bg-[#0a0a0a] text-white">
            {stages.map((s) => (
              <SelectItem key={s.key} value={s.key} className="text-white">
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {item.stage === "sent" && (
        <div className="flex gap-3 text-xs text-[#888888]">
          <span>{item.openRate}% open</span>
          <span>{item.clickRate}% click</span>
        </div>
      )}
    </div>
  );
}

function PipelineColumn({
  label,
  icon: Icon,
  items,
}: {
  label: string;
  icon: typeof Lightbulb;
  items: NewsletterItem[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded border border-[#222222] bg-[#050505] p-3 min-h-[200px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Icon className="h-4 w-4 text-[#ff1a1a]" />
          {label}
        </div>
        <span className="text-xs text-[#888888]">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <PipelineCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export function PipelineBoard() {
  const { data, isLoading } = useNewsletters();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-64 animate-pulse rounded border border-[#222222] bg-[#0a0a0a]" />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[#888888]">
          Move items through the pipeline to manage content lifecycle.
        </p>
        <Button
          onClick={() => setOpen(true)}
          size="sm"
          className="bg-[#ff1a1a] hover:bg-[#d60a0a] text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> New item
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage) => (
          <PipelineColumn
            key={stage.key}
            label={stage.label}
            icon={stage.icon}
            items={data?.filter((n) => n.stage === stage.key) || []}
          />
        ))}
      </div>
      <AddNewsletterDialog open={open} setOpen={setOpen} />
    </div>
  );
}
