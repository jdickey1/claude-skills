// Unit tests for the gmail MCP tool layer. The Gmail client is mocked so
// tests run in milliseconds and don't need any auth or network.

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import type { gmail_v1 } from "googleapis";
import { searchEmails, readEmail, getThread, listLabels } from "./tools.js";
import { decodeBase64Url, extractBody, extractHeaders } from "./mime.js";

// ---------- helpers ----------

function b64url(s: string): string {
  return Buffer.from(s, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

interface MockGmailOpts {
  list?: (params: { q?: string; maxResults?: number }) => gmail_v1.Schema$ListMessagesResponse;
  get?: (params: { id: string; format?: string }) => gmail_v1.Schema$Message;
  threadGet?: (params: { id: string }) => gmail_v1.Schema$Thread;
  labels?: () => gmail_v1.Schema$ListLabelsResponse;
}

function mockGmail(opts: MockGmailOpts): gmail_v1.Gmail {
  return {
    users: {
      messages: {
        list: async (params: unknown) => ({
          data: opts.list?.(params as { q?: string; maxResults?: number }) ?? { messages: [] },
        }),
        get: async (params: unknown) => ({
          data: opts.get?.(params as { id: string; format?: string }) ?? {},
        }),
      },
      threads: {
        get: async (params: unknown) => ({
          data: opts.threadGet?.(params as { id: string }) ?? { messages: [] },
        }),
      },
      labels: {
        list: async () => ({ data: opts.labels?.() ?? { labels: [] } }),
      },
    },
  } as unknown as gmail_v1.Gmail;
}

const HEADERS_FOO: gmail_v1.Schema$MessagePartHeader[] = [
  { name: "From", value: "Foo <foo@example.com>" },
  { name: "To", value: "me@example.com" },
  { name: "Subject", value: "Hello" },
  { name: "Date", value: "Mon, 1 Jan 2024 12:00:00 -0500" },
];

// ---------- searchEmails ----------

describe("searchEmails", () => {
  test("returns empty array for empty query", async () => {
    const gmail = mockGmail({});
    const result = await searchEmails(gmail, "");
    assert.deepEqual(result, []);
  });

  test("returns empty array when list has no results", async () => {
    const gmail = mockGmail({ list: () => ({ messages: [] }) });
    const result = await searchEmails(gmail, "from:nobody@nowhere");
    assert.deepEqual(result, []);
  });

  test("projects a single hit with headers and snippet", async () => {
    const gmail = mockGmail({
      list: () => ({ messages: [{ id: "abc", threadId: "t1" }] }),
      get: () => ({
        id: "abc",
        threadId: "t1",
        snippet: "It&#39;s a test",
        labelIds: ["INBOX", "UNREAD"],
        payload: { headers: HEADERS_FOO },
      }),
    });
    const result = await searchEmails(gmail, "subject:Hello");
    assert.equal(result.length, 1);
    const hit = result[0]!;
    assert.equal(hit.id, "abc");
    assert.equal(hit.thread_id, "t1");
    assert.equal(hit.from, "Foo <foo@example.com>");
    assert.equal(hit.subject, "Hello");
    assert.equal(hit.snippet, "It's a test");
    assert.deepEqual(hit.label_ids, ["INBOX", "UNREAD"]);
    assert.equal(hit.has_attachment, false);
  });

  test("flags has_attachment when payload contains a filename part", async () => {
    const gmail = mockGmail({
      list: () => ({ messages: [{ id: "abc", threadId: "t1" }] }),
      get: () => ({
        id: "abc",
        threadId: "t1",
        labelIds: ["INBOX"],
        payload: {
          headers: HEADERS_FOO,
          parts: [
            { mimeType: "text/plain", body: { size: 100 } },
            { mimeType: "application/pdf", filename: "invoice.pdf", body: { size: 12345, attachmentId: "att1" } },
          ],
        },
      }),
    });
    const result = await searchEmails(gmail, "has:attachment");
    assert.equal(result[0]!.has_attachment, true);
  });

  test("caps max at 100", async () => {
    let received = 0;
    const gmail = mockGmail({
      list: (p) => {
        received = p.maxResults ?? -1;
        return { messages: [] };
      },
    });
    await searchEmails(gmail, "x", 9999);
    assert.equal(received, 100);
  });

  test("clamps max at 1", async () => {
    let received = 0;
    const gmail = mockGmail({
      list: (p) => {
        received = p.maxResults ?? -1;
        return { messages: [] };
      },
    });
    await searchEmails(gmail, "x", 0);
    assert.equal(received, 1);
  });
});

// ---------- readEmail ----------

describe("readEmail", () => {
  test("decodes a single text/plain body part", async () => {
    const gmail = mockGmail({
      get: () => ({
        id: "abc",
        threadId: "t1",
        snippet: "preview",
        labelIds: ["INBOX"],
        payload: {
          headers: HEADERS_FOO,
          mimeType: "text/plain",
          body: { data: b64url("Hello, world.") },
        },
      }),
    });
    const result = await readEmail(gmail, "abc");
    assert.equal(result.body_text, "Hello, world.");
    assert.equal(result.body_html, "");
    assert.deepEqual(result.attachments, []);
  });

  test("walks multipart/alternative and extracts text + html", async () => {
    const gmail = mockGmail({
      get: () => ({
        id: "abc",
        threadId: "t1",
        labelIds: [],
        payload: {
          headers: HEADERS_FOO,
          mimeType: "multipart/alternative",
          parts: [
            { mimeType: "text/plain", body: { data: b64url("plain text") } },
            { mimeType: "text/html", body: { data: b64url("<p>html</p>") } },
          ],
        },
      }),
    });
    const result = await readEmail(gmail, "abc");
    assert.equal(result.body_text, "plain text");
    assert.equal(result.body_html, "<p>html</p>");
  });

  test("collects attachment metadata", async () => {
    const gmail = mockGmail({
      get: () => ({
        id: "abc",
        threadId: "t1",
        labelIds: [],
        payload: {
          headers: HEADERS_FOO,
          mimeType: "multipart/mixed",
          parts: [
            { mimeType: "text/plain", body: { data: b64url("body") } },
            {
              mimeType: "application/pdf",
              filename: "report.pdf",
              body: { size: 9001, attachmentId: "att-xyz" },
            },
          ],
        },
      }),
    });
    const result = await readEmail(gmail, "abc");
    assert.equal(result.attachments.length, 1);
    assert.deepEqual(result.attachments[0], {
      filename: "report.pdf",
      mime_type: "application/pdf",
      size: 9001,
      attachment_id: "att-xyz",
    });
  });

  test("returns raw bytes when format=raw", async () => {
    const raw = b64url("From: foo\r\n\r\nbody bytes");
    const gmail = mockGmail({
      get: () => ({
        id: "abc",
        threadId: "t1",
        labelIds: [],
        snippet: "",
        raw,
        payload: { headers: HEADERS_FOO },
      }),
    });
    const result = await readEmail(gmail, "abc", "raw");
    assert.equal(result.raw, "From: foo\r\n\r\nbody bytes");
  });
});

// ---------- getThread ----------

describe("getThread", () => {
  test("returns ordered messages with full projection", async () => {
    const gmail = mockGmail({
      threadGet: () => ({
        id: "t1",
        historyId: "999",
        messages: [
          {
            id: "m1",
            threadId: "t1",
            labelIds: ["INBOX"],
            snippet: "first",
            payload: {
              headers: HEADERS_FOO,
              mimeType: "text/plain",
              body: { data: b64url("first message") },
            },
          },
          {
            id: "m2",
            threadId: "t1",
            labelIds: ["INBOX"],
            snippet: "second",
            payload: {
              headers: [
                { name: "From", value: "me@example.com" },
                { name: "To", value: "Foo <foo@example.com>" },
                { name: "Subject", value: "Re: Hello" },
                { name: "Date", value: "Mon, 1 Jan 2024 13:00:00 -0500" },
              ],
              mimeType: "text/plain",
              body: { data: b64url("reply") },
            },
          },
        ],
      }),
    });
    const thread = await getThread(gmail, "t1");
    assert.equal(thread.id, "t1");
    assert.equal(thread.history_id, "999");
    assert.equal(thread.messages.length, 2);
    assert.equal(thread.messages[0]!.body_text, "first message");
    assert.equal(thread.messages[1]!.subject, "Re: Hello");
  });
});

// ---------- listLabels ----------

describe("listLabels", () => {
  test("returns system + user labels with type tag", async () => {
    const gmail = mockGmail({
      labels: () => ({
        labels: [
          { id: "INBOX", name: "INBOX", type: "system" },
          { id: "Label_42", name: "Clients", type: "user" },
          { id: "", name: "" },
        ],
      }),
    });
    const labels = await listLabels(gmail);
    assert.equal(labels.length, 2);
    assert.deepEqual(labels[0], { id: "INBOX", name: "INBOX", type: "system" });
    assert.deepEqual(labels[1], { id: "Label_42", name: "Clients", type: "user" });
  });
});

// ---------- mime helpers ----------

describe("decodeBase64Url", () => {
  test("decodes standard base64url", () => {
    assert.equal(decodeBase64Url(b64url("hello")), "hello");
  });

  test("decodes content with padding restored", () => {
    assert.equal(decodeBase64Url(b64url("a")), "a");
    assert.equal(decodeBase64Url(b64url("ab")), "ab");
    assert.equal(decodeBase64Url(b64url("abc")), "abc");
  });

  test("decodes utf-8 multibyte content", () => {
    assert.equal(decodeBase64Url(b64url("café — 日本語")), "café — 日本語");
  });
});

describe("extractHeaders", () => {
  test("returns empty strings when payload is undefined", () => {
    const headers = extractHeaders(undefined);
    assert.equal(headers.from, "");
    assert.equal(headers.subject, "");
  });

  test("is case-insensitive on header names", () => {
    const headers = extractHeaders({
      headers: [
        { name: "from", value: "lower@case" },
        { name: "SUBJECT", value: "loud" },
      ],
    });
    assert.equal(headers.from, "lower@case");
    assert.equal(headers.subject, "loud");
  });
});

describe("extractBody", () => {
  test("returns empty when payload is undefined", () => {
    const body = extractBody(undefined);
    assert.equal(body.text, "");
    assert.equal(body.html, "");
    assert.deepEqual(body.attachments, []);
  });

  test("joins multiple text/plain parts with double newline", () => {
    const body = extractBody({
      mimeType: "multipart/mixed",
      parts: [
        { mimeType: "text/plain", body: { data: b64url("part one") } },
        { mimeType: "text/plain", body: { data: b64url("part two") } },
      ],
    });
    assert.equal(body.text, "part one\n\npart two");
  });
});
