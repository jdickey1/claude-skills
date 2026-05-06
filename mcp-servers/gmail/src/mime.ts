// MIME body extraction helpers. Walks Gmail's nested payload structure,
// decodes base64url, and prefers text/plain over text/html. Pure functions
// with no I/O — easy to test and easy to audit.

import type { gmail_v1 } from "googleapis";

export interface ParsedAttachment {
  readonly filename: string;
  readonly mime_type: string;
  readonly size: number;
  readonly attachment_id: string;
}

export interface ParsedHeaders {
  readonly from: string;
  readonly to: string;
  readonly cc: string;
  readonly bcc: string;
  readonly subject: string;
  readonly date: string;
  readonly message_id: string;
  readonly reply_to: string;
}

export function decodeBase64Url(data: string): string {
  // Gmail uses base64url (RFC 4648 §5): "-" for "+", "_" for "/", no padding.
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf-8");
}

function header(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  if (!headers) return "";
  const target = name.toLowerCase();
  for (const h of headers) {
    if (h.name && h.name.toLowerCase() === target) return h.value ?? "";
  }
  return "";
}

export function extractHeaders(payload: gmail_v1.Schema$MessagePart | undefined): ParsedHeaders {
  const h = payload?.headers;
  return {
    from: header(h, "From"),
    to: header(h, "To"),
    cc: header(h, "Cc"),
    bcc: header(h, "Bcc"),
    subject: header(h, "Subject"),
    date: header(h, "Date"),
    message_id: header(h, "Message-ID"),
    reply_to: header(h, "Reply-To"),
  };
}

// Walks the payload tree, collecting both inline body parts and attachments.
function walk(
  part: gmail_v1.Schema$MessagePart,
  acc: {
    text: string[];
    html: string[];
    attachments: ParsedAttachment[];
  },
): void {
  const mime = (part.mimeType ?? "").toLowerCase();
  const filename = part.filename ?? "";
  const bodyData = part.body?.data;
  const attachmentId = part.body?.attachmentId;

  // An attachment is any part with a non-empty filename, or a part whose body
  // references an attachmentId (Gmail returns the data separately).
  if (filename && (bodyData || attachmentId)) {
    acc.attachments.push({
      filename,
      mime_type: mime,
      size: part.body?.size ?? 0,
      attachment_id: attachmentId ?? "",
    });
  } else if (bodyData) {
    if (mime === "text/plain") acc.text.push(decodeBase64Url(bodyData));
    else if (mime === "text/html") acc.html.push(decodeBase64Url(bodyData));
  }

  for (const child of part.parts ?? []) walk(child, acc);
}

export interface ExtractedBody {
  readonly text: string;
  readonly html: string;
  readonly attachments: ReadonlyArray<ParsedAttachment>;
}

export function extractBody(payload: gmail_v1.Schema$MessagePart | undefined): ExtractedBody {
  if (!payload) return { text: "", html: "", attachments: [] };
  const acc = { text: [] as string[], html: [] as string[], attachments: [] as ParsedAttachment[] };
  walk(payload, acc);
  return {
    text: acc.text.join("\n\n"),
    html: acc.html.join("\n\n"),
    attachments: acc.attachments,
  };
}
