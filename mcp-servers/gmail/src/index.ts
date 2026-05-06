#!/usr/bin/env bun
// Gmail MCP server entry point. Reads OAuth credentials from the credential
// store (macOS keychain by default), constructs an authenticated Gmail client,
// and exposes four read-only tools over stdio.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { google } from "googleapis";
import { z } from "zod";
import { buildOAuthClient, AuthSetupError } from "./auth.ts";
import { searchEmails, readEmail, getThread, listLabels } from "./tools.ts";

const SERVER_NAME = "gmail";
const SERVER_VERSION = "0.1.0";

function jsonContent(value: unknown): { content: Array<{ type: "text"; text: string }> } {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

function errorContent(err: unknown): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: "text", text: message }], isError: true };
}

async function main(): Promise<void> {
  let oauth2;
  try {
    oauth2 = buildOAuthClient();
  } catch (err) {
    if (err instanceof AuthSetupError) {
      console.error(`[${SERVER_NAME}] ${err.message}`);
      process.exit(2);
    }
    throw err;
  }

  const gmail = google.gmail({ version: "v1", auth: oauth2 });

  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  server.registerTool(
    "search_emails",
    {
      description:
        "Search the authenticated user's Gmail using Gmail q-syntax (e.g. " +
        '"from:foo@example.com subject:invoice after:2024/01/01"). Returns up ' +
        "to `max` hits (default 20, cap 100) with id, headers, snippet, and " +
        "label ids — no full body. Use `read_email` to fetch a single message.",
      inputSchema: {
        query: z.string().min(1).describe("Gmail q-syntax search string."),
        max: z.number().int().min(1).max(100).optional().describe("Max hits (default 20, cap 100)."),
      },
    },
    async ({ query, max }) => {
      try {
        const hits = await searchEmails(gmail, query, max ?? 20);
        return jsonContent(hits);
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "read_email",
    {
      description:
        "Fetch a single Gmail message by id. Returns headers, snippet, decoded " +
        "plain-text and HTML bodies, label ids, and attachment metadata. Pass " +
        '`format: "raw"` to also include the original RFC 822 bytes (decoded ' +
        "from base64url) for full MIME fidelity.",
      inputSchema: {
        id: z.string().min(1).describe("Gmail message id (from search_emails)."),
        format: z
          .enum(["full", "raw"])
          .optional()
          .describe('Default "full" returns parsed body. "raw" adds the original RFC 822 bytes.'),
      },
    },
    async ({ id, format }) => {
      try {
        const message = await readEmail(gmail, id, format ?? "full");
        return jsonContent(message);
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "get_thread",
    {
      description:
        "Fetch all messages in a Gmail thread. Returns thread id, history id, " +
        "and an ordered list of messages — same shape as `read_email`.",
      inputSchema: {
        id: z.string().min(1).describe("Gmail thread id (matches threadId from search_emails hits)."),
      },
    },
    async ({ id }) => {
      try {
        const thread = await getThread(gmail, id);
        return jsonContent(thread);
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  server.registerTool(
    "list_labels",
    {
      description:
        "List the authenticated user's Gmail labels — system labels (INBOX, " +
        "SENT, DRAFT, ...) and user-defined labels. Use the returned ids in " +
        "Gmail q-syntax via `label:<name>` or in label-id filtering.",
      inputSchema: {},
    },
    async () => {
      try {
        const labels = await listLabels(gmail);
        return jsonContent(labels);
      } catch (err) {
        return errorContent(err);
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${SERVER_NAME}] fatal: ${message}`);
  process.exit(1);
});
