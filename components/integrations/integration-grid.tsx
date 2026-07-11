"use client";

import { useIntegrations, useAvailableProviders } from "@/hooks/use-apex";
import { IntegrationCard } from "./integration-card";

interface IntegrationGridProps {
  type?: string;
}

export function IntegrationGrid({ type }: IntegrationGridProps) {
  const { data: integrations, isLoading: loadingIntegrations } = useIntegrations(type);
  const { data: providers, isLoading: loadingProviders } = useAvailableProviders();

  if (loadingIntegrations || loadingProviders) {
    return <div className="text-sm text-slate-400">Loading integrations...</div>;
  }

  const filtered = providers?.filter((p) => (type ? p.type === type : true)) || [];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((provider) => (
        <IntegrationCard
          key={provider.slug}
          provider={provider}
          integration={integrations?.find((i) => i.providerSlug === provider.slug)}
        />
      ))}
      {filtered.length === 0 && (
        <p className="text-sm text-slate-400">No integrations available for this category.</p>
      )}
    </div>
  );
}
