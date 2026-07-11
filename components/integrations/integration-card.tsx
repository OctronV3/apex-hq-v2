"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProviderInfo, Integration } from "@/lib/integrations";
import { openIntegrationWebview } from "@/lib/integrations";
import { useConnectIntegration, useSyncIntegration, useDeleteIntegration } from "@/hooks/use-apex";

interface IntegrationCardProps {
  provider: ProviderInfo;
  integration?: Integration;
}

export function IntegrationCard({ provider, integration }: IntegrationCardProps) {
  const [open, setOpen] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const connect = useConnectIntegration();
  const sync = useSyncIntegration();
  const remove = useDeleteIntegration();

  const isConnected = integration?.status === "connected";
  const url = provider.isWebview && integration?.config
    ? (integration.config as Record<string, unknown>).profileUrl as string | undefined
    : undefined;

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await connect.mutateAsync({ providerSlug: provider.slug, input: inputs });
    setOpen(false);
    if (provider.isWebview && result.webviewUrl) {
      await openIntegrationWebview(provider.slug, result.webviewUrl);
    }
  };

  const handleOpen = () => {
    if (url) openIntegrationWebview(provider.slug, url);
  };

  const handleSync = () => {
    if (integration) sync.mutate({ providerSlug: provider.slug, id: integration.id });
  };

  const handleRemove = () => {
    if (integration && confirm("Disconnect this integration?")) remove.mutate(integration.id);
  };

  return (
    <Card className="border border-slate-800 bg-slate-900/50 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{provider.name}</CardTitle>
        <CardDescription className="text-slate-400 text-xs">{provider.description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : provider.isConfigured ? "bg-yellow-500" : "bg-slate-500"}`} />
          <span className="text-xs capitalize">{isConnected ? "connected" : provider.isConfigured ? "ready to connect" : "needs credentials"}</span>
        </div>
        {integration && (
          <p className="mt-2 text-xs text-slate-400">{integration.displayName}</p>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {isConnected ? (
          <>
            {provider.canSync && (
              <Button variant="outline" size="sm" onClick={handleSync} disabled={sync.isPending}>
                {sync.isPending ? "Syncing" : "Sync"}
              </Button>
            )}
            {provider.isWebview && url && (
              <Button variant="outline" size="sm" onClick={handleOpen}>Open</Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleRemove}>Disconnect</Button>
          </>
        ) : (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button variant="outline" size="sm">Connect</Button>} />
            <DialogContent className="bg-slate-900 border-slate-800 text-white">
              <form onSubmit={handleConnect}>
                <DialogHeader>
                  <DialogTitle>Connect {provider.name}</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    {provider.isConfigured
                      ? "Credentials are configured on the server. You can connect without entering them."
                      : "Enter the details for this integration. Secrets are stored on the server."}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {provider.connectFields?.map((field) => (
                    <div key={field.name} className="grid gap-2">
                      <Label htmlFor={field.name}>{field.label}{field.required && " *"}</Label>
                      <Input
                        id={field.name}
                        name={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        required={field.required && !provider.isConfigured}
                        value={inputs[field.name] || ""}
                        onChange={(e) => setInputs((s) => ({ ...s, [field.name]: e.target.value }))}
                        className="bg-slate-950 border-slate-800"
                      />
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={connect.isPending}>
                    {connect.isPending ? "Connecting" : "Connect"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}
