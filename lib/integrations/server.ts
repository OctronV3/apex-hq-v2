import { getRegistry as getBrowserRegistry, getProvider as getBrowserProvider } from "./registry";
import { SmtpProvider } from "./providers/smtp";
import { ImapProvider } from "./providers/imap";
import { IntegrationProvider } from "./types";

export function getServerRegistry(): IntegrationProvider[] {
  return [new SmtpProvider(), new ImapProvider(), ...getBrowserRegistry()];
}

export function getServerProvider(slug: string): IntegrationProvider | undefined {
  return getServerRegistry().find((p) => p.slug === slug) || getBrowserProvider(slug);
}
