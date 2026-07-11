"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  useEmails,
  useSendEmail,
  useUpdateEmail,
  useDeleteEmail,
} from "@/hooks/use-apex";
import { EmailMessage, EmailFolder } from "@/types";
import { IntegrationGrid } from "@/components/integrations/integration-grid";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

function EmailRow({
  email,
  onClick,
}: {
  email: EmailMessage;
  onClick: (email: EmailMessage) => void;
}) {
  return (
    <div
      onClick={() => onClick(email)}
      className={`cursor-pointer rounded border border-[#222222] p-3 transition-colors hover:bg-[#111111] ${
        email.read ? "bg-[#0a0a0a]" : "bg-[#111111]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-sm truncate ${email.read ? "text-white" : "text-white font-semibold"}`}>
            {email.from}
          </p>
          <p className="text-xs text-[#888888] truncate">{email.subject}</p>
        </div>
        <span className="text-xs text-[#888888] whitespace-nowrap">
          {formatDistanceToNow(new Date(email.sentAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

function ComposeEmail({ onSent }: { onSent: () => void }) {
  const send = useSendEmail();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    send.mutate(
      { from: "bruce@apex.hq", to, subject, body },
      { onSuccess: () => {
        setTo("");
        setSubject("");
        setBody("");
        onSent();
      }}
    );
  }

  return (
    <Card className="border-[#222222] bg-[#0a0a0a]">
      <CardContent className="p-4 space-y-4">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white">To</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} className="bg-[#111111] border-[#222222] text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} className="bg-[#111111] border-[#222222] text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-white">Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} className="bg-[#111111] border-[#222222] text-white resize-none" />
          </div>
          <Button type="submit" className="bg-[#ff1a1a] hover:bg-[#d60a0a] text-white">Send</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function EmailPreview({
  email,
  onClose,
}: {
  email: EmailMessage;
  onClose: () => void;
}) {
  const remove = useDeleteEmail();

  return (
    <Card className="border-[#222222] bg-[#0a0a0a] h-full">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-[#222222] pb-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{email.subject}</h3>
            <p className="text-xs text-[#888888]">From: {email.from}</p>
            <p className="text-xs text-[#888888]">To: {email.to}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#222222] text-white hover:bg-[#111111]"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-[#222222] text-[#ff1a1a] hover:bg-[#111111]"
              onClick={() => remove.mutate(email.id)}
            >
              Delete
            </Button>
          </div>
        </div>
        <div className="text-sm text-white whitespace-pre-wrap">{email.body}</div>
        {email.labels.length > 0 && (
          <div className="flex gap-2 pt-2">
            {email.labels.map((label) => (
              <Badge key={label} variant="outline" className="border-[#222222] text-[#888888]">
                {label}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmailList({ folder }: { folder: EmailFolder }) {
  const { data, isLoading } = useEmails(folder);
  const update = useUpdateEmail();
  const [selected, setSelected] = useState<EmailMessage | null>(null);

  function openEmail(email: EmailMessage) {
    if (!email.read) {
      update.mutate({ id: email.id, patch: { read: true } });
    }
    setSelected({ ...email, read: true });
  }

  if (selected) {
    return <EmailPreview email={selected} onClose={() => setSelected(null)} />;
  }

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="h-48 animate-pulse rounded bg-[#111111]" />
      ) : (
        data?.map((email) => (
          <EmailRow key={email.id} email={email} onClick={openEmail} />
        ))
      )}
    </div>
  );
}

export function EmailClient() {
  const [activeTab, setActiveTab] = useState("inbox");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="bg-[#111111] border border-[#222222] text-[#888888]">
        <TabsTrigger value="inbox" className="data-[active]:bg-[#ff1a1a] data-[active]:text-white">Inbox</TabsTrigger>
        <TabsTrigger value="sent" className="data-[active]:bg-[#ff1a1a] data-[active]:text-white">Sent</TabsTrigger>
        <TabsTrigger value="compose" className="data-[active]:bg-[#ff1a1a] data-[active]:text-white">Compose</TabsTrigger>
        <TabsTrigger value="integrations" className="data-[active]:bg-[#ff1a1a] data-[active]:text-white">Integrations</TabsTrigger>
      </TabsList>
      <TabsContent value="inbox" className="mt-4">
        <EmailList folder="inbox" />
      </TabsContent>
      <TabsContent value="sent" className="mt-4">
        <EmailList folder="sent" />
      </TabsContent>
      <TabsContent value="compose" className="mt-4">
        <ComposeEmail onSent={() => setActiveTab("sent")} />
      </TabsContent>
      <TabsContent value="integrations" className="mt-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Email providers</h3>
          <IntegrationGrid type="email" />
        </div>
      </TabsContent>
    </Tabs>
  );
}
