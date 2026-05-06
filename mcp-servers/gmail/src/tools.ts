// Tool implementations. Pure-ish functions over a `gmail_v1.Gmail` client —
// the client is injected so tests can supply a mock without going through
// auth or HTTP. Every public function returns a stable, projected shape;
// raw Gmail API types never leak past this module.

import type { gmail_v1 } from "googleapis";
import {
  decodeBase64Url,
  extractBody,
  extractHeaders,
  type ParsedAttachment,
} from "./mime.ts";

export interface SearchHit {
  readonly id: string;
  readonly thread_id: string;
  readonly from: string;
  readonly to: string;
  readonly subject: string;
  readonly date: string;
  readonly snippet: string;
  readonly label_ids: ReadonlyArray<string>;
  readonly has_attachment: boolean;
}

export interface FullMessage {
  readonly id: string;
  readonly thread_id: string;
  readonly from: string;
  readonly to: string;
  readonly cc: string;
  readonly bcc: string;
  readonly subject: string;
  readonly date: string;
  readonly snippet: string;
  readonly body_text: string;
  readonly body_html: string;
  readonly label_ids: ReadonlyArray<string>;
  readonly attachments: ReadonlyArray<ParsedAttachment>;
}

export interface ThreadResult {
  readonly id: string;
  readonly history_id: string;
  readonly messages: ReadonlyArray<FullMessage>;
}

export interface LabelInfo {
  readonly id: string;
  readonly name: string;
  readonly type: "system" | "user";
}

const SEARCH_FIELDS = "messages(id,threadId,labelIds,snippet,payload(headers,parts(filename,mimeType,body/size)))";
const FULL_FIELDS = "id,threadId,labelIds,snippet,payload";

function projectHit(message: gmail_v1.Schema$Message): SearchHit {
  const headers = extractHeaders(message.payload ?? undefined);
  const labels = (message.labelIds ?? []).filter((s): s is string => Boolean(s));
  const hasAttachment = scanForAttachment(message.payload ?? undefined);
  return {
    id: message.id ?? "",
    thread_id: message.threadId ?? "",
    from: headers.from,
    to: headers.to,
    subject: headers.subject,
    date: headers.date,
    snippet: decodeSnippet(message.snippet ?? ""),
    label_ids: labels,
    has_attachment: hasAttachment,
  };
}

// Gmail snippets are HTML-escaped (`&#39;` etc.). Decode the common entities so
// callers can read the snippet as plain text.
function decodeSnippet(snippet: string): string {
  return snippet
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function scanForAttachment(part: gmail_v1.Schema$MessagePart | undefined): boolean {
  if (!part) return false;
  if (part.filename && part.filename.length > 0) return true;
  for (const child of part.parts ?? []) {
    if (scanForAttachment(child)) return true;
  }
  return false;
}

function projectFull(message: gmail_v1.Schema$Message): FullMessage {
  const headers = extractHeaders(message.payload ?? undefined);
  const body = extractBody(message.payload ?? undefined);
  const labels = (message.labelIds ?? []).filter((s): s is string => Boolean(s));
  return {
    id: message.id ?? "",
    thread_id: message.threadId ?? "",
    from: headers.from,
    to: headers.to,
    cc: headers.cc,
    bcc: headers.bcc,
    subject: headers.subject,
    date: headers.date,
    snippet: decodeSnippet(message.snippet ?? ""),
    body_text: body.text,
    body_html: body.html,
    label_ids: labels,
    attachments: body.attachments,
  };
}

// Search messages using Gmail's q-syntax. Returns lightweight hits: headers,
// snippet, and label ids — no body. Use `read_email` to fetch a full message.
//
// Two API calls per search: one `messages.list` to get ids, then one
// `messages.batchGet`-style fan-out (sequential `messages.get` with format=metadata).
// This costs more quota than `format=minimal`, but the headers are essential
// for the caller to triage results without a follow-up read.
export async function searchEmails(
  gmail: gmail_v1.Gmail,
  query: string,
  max: number = 20,
): Promise<ReadonlyArray<SearchHit>> {
  if (!query.trim()) return [];
  const capped = Math.min(Math.max(max, 1), 100);

  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: capped,
  });

  const ids = (listRes.data.messages ?? [])
    .map((m) => m.id)
    .filter((id): id is string => Boolean(id));

  if (ids.length === 0) return [];

  // Sequential metadata fetch. Gmail does have a batch endpoint, but it's not
  // exposed in the official client and adds nontrivial complexity. For the
  // typical search size (under 50 hits) this is fast enough.
  const hits: SearchHit[] = [];
  for (const id of ids) {
    const res = await gmail.users.messages.get({
      userId: "me",
      id,
      format: "metadata",
      metadataHeaders: ["From", "To", "Subject", "Date"],
      fields: SEARCH_FIELDS,
    });
    hits.push(projectHit(res.data));
  }
  return hits;
}

// Fetch a full message including decoded body and attachment metadata.
// Pass `format: "raw"` to get the original RFC 822 bytes (base64url) — useful
// when a caller needs full MIME fidelity (e.g. signature parsers).
export async function readEmail(
  gmail: gmail_v1.Gmail,
  id: string,
  format: "full" | "raw" = "full",
): Promise<FullMessage & { raw?: string }> {
  if (format === "raw") {
    const res = await gmail.users.messages.get({ userId: "me", id, format: "raw" });
    const projected = projectFull(res.data);
    return {
      ...projected,
      raw: res.data.raw ? decodeBase64Url(res.data.raw) : "",
    };
  }
  const res = await gmail.users.messages.get({
    userId: "me",
    id,
    format: "full",
    fields: FULL_FIELDS,
  });
  return projectFull(res.data);
}

// Fetch all messages in a thread.
export async function getThread(
  gmail: gmail_v1.Gmail,
  id: string,
): Promise<ThreadResult> {
  const res = await gmail.users.threads.get({ userId: "me", id, format: "full" });
  const messages = (res.data.messages ?? []).map(projectFull);
  return {
    id: res.data.id ?? "",
    history_id: res.data.historyId ?? "",
    messages,
  };
}

// List the user's labels (system labels like INBOX/SENT plus user-defined ones).
export async function listLabels(gmail: gmail_v1.Gmail): Promise<ReadonlyArray<LabelInfo>> {
  const res = await gmail.users.labels.list({ userId: "me" });
  const labels = res.data.labels ?? [];
  return labels
    .filter((l) => Boolean(l.id) && Boolean(l.name))
    .map((l) => ({
      id: l.id ?? "",
      name: l.name ?? "",
      type: l.type === "user" ? "user" : "system",
    }));
}
