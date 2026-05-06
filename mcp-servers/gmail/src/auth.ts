// OAuth client construction. Reads credentials from the credential store and
// returns a configured OAuth2Client ready to drive the gmail.readonly API.

import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import {
  defaultCredentialStore,
  KEY_CLIENT_ID,
  KEY_CLIENT_SECRET,
  KEY_REFRESH_TOKEN,
  type CredentialStore,
} from "./credential-store.js";

export const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export type AuthFailureKind =
  | "missing_client_id"
  | "missing_client_secret"
  | "missing_refresh_token";

export interface AuthFailure {
  readonly kind: AuthFailureKind;
  readonly message: string;
}

export class AuthSetupError extends Error {
  constructor(readonly failure: AuthFailure) {
    super(failure.message);
    this.name = "AuthSetupError";
  }
}

export function buildOAuthClient(
  store: CredentialStore = defaultCredentialStore(),
): OAuth2Client {
  const clientId = store.read(KEY_CLIENT_ID);
  if (!clientId) {
    throw new AuthSetupError({
      kind: "missing_client_id",
      message:
        "OAuth client_id not found. Run `npx -p @jdickey1/mcp-gmail mcp-gmail-auth` with " +
        "GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET set, " +
        "or set MCP_GMAIL_CLIENT_ID in the environment. See README.md.",
    });
  }
  const clientSecret = store.read(KEY_CLIENT_SECRET);
  if (!clientSecret) {
    throw new AuthSetupError({
      kind: "missing_client_secret",
      message:
        "OAuth client_secret not found. Run `npx -p @jdickey1/mcp-gmail mcp-gmail-auth` with " +
        "GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET set, " +
        "or set MCP_GMAIL_CLIENT_SECRET in the environment. See README.md.",
    });
  }
  const refreshToken = store.read(KEY_REFRESH_TOKEN);
  if (!refreshToken) {
    throw new AuthSetupError({
      kind: "missing_refresh_token",
      message:
        "Refresh token not found. Run `npx -p @jdickey1/mcp-gmail mcp-gmail-auth` to authorize, " +
        "or set MCP_GMAIL_REFRESH_TOKEN in the environment.",
    });
  }

  const oauth2 = new google.auth.OAuth2({ clientId, clientSecret });
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}
