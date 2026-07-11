export type IntegrationType = "social" | "email" | "analytics" | "newsletter" | "ai";

export type IntegrationStatus = "pending" | "connected" | "error" | "disconnected";

export interface Integration {
  id: string;
  workspaceId: string;
  userId?: string;
  providerSlug: string;
  type: IntegrationType;
  status: IntegrationStatus;
  displayName?: string;
  config?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationProviderField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "url" | "textarea";
  placeholder?: string;
  required?: boolean;
}

export interface ProviderInfo {
  slug: string;
  name: string;
  type: IntegrationType;
  description: string;
  isConfigured: boolean;
  isWebview: boolean;
  connectFields?: IntegrationProviderField[];
  canSync: boolean;
  canPublish: boolean;
}

export interface IntegrationConfig {
  displayName?: string;
  config?: Record<string, unknown>;
  credentials?: Record<string, unknown>;
}

export interface SyncResult {
  ok: boolean;
  message?: string;
  updated?: unknown;
}

export interface IntegrationProvider {
  readonly slug: string;
  readonly name: string;
  readonly type: IntegrationType;
  readonly description: string;
  readonly isWebview: boolean;
  isConfigured(): boolean;
  getConnectFields?(): IntegrationProviderField[];
  connect(input: Record<string, unknown>): Promise<IntegrationConfig>;
  sync?(integration: Integration): Promise<SyncResult>;
  publish?(integration: Integration, payload: unknown): Promise<unknown>;
  getWebviewUrl?(config?: Record<string, unknown>): string | null | undefined;
}
