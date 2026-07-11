import { IntegrationProvider } from "./types";
import { PlausibleProvider } from "./providers/plausible";
import { socialWebviewProviders } from "./providers/social-webview";
import { BeehiivProvider } from "./providers/beehiiv";

let registry: IntegrationProvider[] | null = null;

function buildRegistry(): IntegrationProvider[] {
  return [
    new PlausibleProvider(),
    new BeehiivProvider(),
    ...socialWebviewProviders(),
  ];
}

export function getRegistry(): IntegrationProvider[] {
  if (!registry) {
    registry = buildRegistry();
  }
  return registry;
}

export function getProvider(slug: string): IntegrationProvider | undefined {
  return getRegistry().find((p) => p.slug === slug);
}
