import { IntegrationProvider, Integration, IntegrationConfig, SyncResult } from "../types";

export class ImapProvider implements IntegrationProvider {
  readonly slug = "imap";
  readonly name = "IMAP Inbox";
  readonly type = "email" as const;
  readonly description = "Receive email via any IMAP provider";
  readonly isWebview = false;

  isConfigured(): boolean {
    return !!(process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASS);
  }

  getConnectFields() {
    return [
      { name: "host", label: "IMAP host", type: "text" as const, placeholder: "imap.gmail.com", required: true },
      { name: "port", label: "Port", type: "number" as const, placeholder: "993", required: true },
      { name: "user", label: "Username", type: "email" as const, required: true },
      { name: "pass", label: "Password / app password", type: "password" as const, required: true },
      { name: "tls", label: "Use TLS", type: "text" as const, placeholder: "true / false", required: false },
    ];
  }

  async connect(input: Record<string, unknown>): Promise<IntegrationConfig> {
    const host = String(input.host || process.env.IMAP_HOST || "");
    const port = Number(input.port || process.env.IMAP_PORT || 993);
    const user = String(input.user || process.env.IMAP_USER || "");
    const pass = String(input.pass || process.env.IMAP_PASS || "");
    const tls = input.tls ? String(input.tls).toLowerCase() === "true" : port === 993;

    if (!host || !user || !pass) {
      throw new Error("IMAP host, user, and password are required.");
    }

    return {
      displayName: user,
      credentials: { host, port, user, pass, tls },
      config: { user, tls },
    };
  }

  async sync(integration: Integration): Promise<SyncResult> {
    const credentials = integration.credentials as { host: string; port: number; user: string; pass: string; tls: boolean } | undefined;
    if (!credentials) return { ok: false, message: "Missing IMAP credentials" };

    // Dynamic import so the server bundle can still build if imap is not installed.
    const Imap = await import("imap").then((m) => m.default || m);

    return new Promise((resolve) => {
      const imap = new Imap({
        host: credentials.host,
        port: credentials.port,
        tls: credentials.tls,
        user: credentials.user,
        password: credentials.pass,
        connTimeout: 10000,
      });

      const emails: { from: string; to: string; subject: string; body: string; sentAt: string }[] = [];

      imap.once("ready", () => {
        imap.openBox("INBOX", true, (err: unknown) => {
          if (err) {
            resolve({ ok: false, message: err instanceof Error ? err.message : String(err) });
            return imap.end();
          }

          imap.search(["UNSEEN", ["SINCE", "2025-01-01"]], (searchErr: unknown, results: unknown) => {
            if (searchErr) {
              resolve({ ok: false, message: searchErr instanceof Error ? searchErr.message : String(searchErr) });
              return imap.end();
            }
            const resultIds = results as unknown as number[];
            if (!resultIds?.length) {
              resolve({ ok: true, message: "No new messages", updated: { emails } });
              return imap.end();
            }

            const f = imap.fetch(resultIds, { bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE)", struct: false });
            f.on("message", (msg: unknown) => {
              const message = msg as {
                on: (event: string, cb: (stream: unknown) => void) => void;
                once: (event: string, cb: () => void) => void;
              };
              let header = "";
              message.on("body", (stream: unknown) => {
                const s = stream as { on: (event: string, cb: (chunk: Buffer) => void) => void };
                s.on("data", (chunk: Buffer) => {
                  header += chunk.toString("utf8");
                });
              });
              message.once("end", () => {
                const parsed = parseHeader(header);
                emails.push({
                  from: parsed.from || "unknown",
                  to: parsed.to || credentials.user,
                  subject: parsed.subject || "",
                  body: "",
                  sentAt: parsed.date ? new Date(parsed.date).toISOString() : new Date().toISOString(),
                });
              });
            });

            f.once("error", (fetchErr: unknown) => {
              resolve({ ok: false, message: fetchErr instanceof Error ? fetchErr.message : String(fetchErr) });
            });

            f.once("end", () => {
              resolve({ ok: true, message: `Synced ${emails.length} messages`, updated: { emails } });
              imap.end();
            });
          });
        });
      });

      imap.once("error", (err: unknown) => {
        resolve({ ok: false, message: err instanceof Error ? err.message : String(err) });
      });

      imap.connect();
    });
  }
}

function parseHeader(raw: string) {
  const fromMatch = raw.match(/from: (.*)/i);
  const toMatch = raw.match(/to: (.*)/i);
  const subjectMatch = raw.match(/subject: (.*)/i);
  const dateMatch = raw.match(/date: (.*)/i);
  return {
    from: fromMatch?.[1]?.trim(),
    to: toMatch?.[1]?.trim(),
    subject: subjectMatch?.[1]?.trim(),
    date: dateMatch?.[1]?.trim(),
  };
}
