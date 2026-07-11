import { IntegrationProvider, Integration, IntegrationConfig, SyncResult } from "../types";

export class SmtpProvider implements IntegrationProvider {
  readonly slug = "smtp";
  readonly name = "SMTP Email";
  readonly type = "email" as const;
  readonly description = "Send email via any SMTP provider";
  readonly isWebview = false;

  private getEnv() {
    return {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM,
    };
  }

  isConfigured(): boolean {
    const env = this.getEnv();
    return !!(env.host && env.user && env.pass);
  }

  getConnectFields() {
    return [
      { name: "host", label: "SMTP host", type: "text" as const, placeholder: "smtp.gmail.com", required: true },
      { name: "port", label: "Port", type: "number" as const, placeholder: "587", required: true },
      { name: "user", label: "Username", type: "email" as const, required: true },
      { name: "pass", label: "Password / app password", type: "password" as const, required: true },
      { name: "from", label: "From address", type: "email" as const, required: true },
      { name: "fromName", label: "From name", type: "text" as const, required: false },
      { name: "secure", label: "Use TLS (secure)", type: "text" as const, placeholder: "true / false", required: false },
    ];
  }

  async connect(input: Record<string, unknown>): Promise<IntegrationConfig> {
    const host = String(input.host || this.getEnv().host || "");
    const port = Number(input.port || this.getEnv().port || 587);
    const user = String(input.user || this.getEnv().user || "");
    const pass = String(input.pass || this.getEnv().pass || "");
    const from = String(input.from || this.getEnv().from || "");
    const fromName = input.fromName ? String(input.fromName) : undefined;
    const secure = input.secure ? String(input.secure).toLowerCase() === "true" : port === 465;

    if (!host || !user || !pass || !from) {
      throw new Error("SMTP host, user, password, and from address are required.");
    }

    return {
      displayName: fromName ? `${fromName} <${from}>` : from,
      credentials: { host, port, user, pass, secure },
      config: { from, fromName },
    };
  }

  async sync(integration: Integration): Promise<SyncResult> {
    void integration;
    return { ok: true, message: "SMTP only sends; use IMAP to receive." };
  }

  async publish(integration: Integration, payload: unknown): Promise<unknown> {
    const credentials = integration.credentials as { host: string; port: number; user: string; pass: string; secure: boolean } | undefined;
    const config = integration.config as { from: string; fromName?: string } | undefined;
    if (!credentials || !config) {
      throw new Error("SMTP credentials not configured");
    }

    const { host, port, user, pass, secure } = credentials;

    const nodemailer = await import("nodemailer") as { default?: { createTransport: (opts: unknown) => { sendMail: (opts: unknown) => Promise<{ messageId: string }> } } };
    const createTransport = nodemailer.default?.createTransport;
    if (!createTransport) throw new Error("Nodemailer createTransport not available");
    const transporter = createTransport({ host, port, secure, auth: { user, pass } });

    const { to, subject, body } = payload as { to: string; subject: string; body: string };
    const info = await transporter.sendMail({
      from: config.fromName ? `"${config.fromName}" <${config.from}>` : config.from,
      to,
      subject,
      text: body,
    });

    return { ok: true, messageId: info.messageId };
  }
}
