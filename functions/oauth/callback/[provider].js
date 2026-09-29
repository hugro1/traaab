import {
  randomValue,
  hash
} from "../../_shared/crypto.js";

import {
  getProvider
} from "../../_shared/providers.js";

import {
  getCookie,
  clearOAuthTransactionCookie,
  setSessionCookie,
  jsonError
} from "../../_shared/cookies.js";

import {
  verifyGoogleIdToken,
  getGithubIdentity
} from "../../_shared/oidc.js";

export async function onRequestGet(context) {
  const { provider } = context.params;

  if (
    provider !== "google" &&
    provider !== "github"
  ) {
    return jsonError(404);
  }

  const config = getProvider(provider);

  if (!config) {
    return jsonError(404);
  }

  const clientId =
    context.env[config.clientIdEnv];

  const clientSecret =
    context.env[config.clientSecretEnv];

  if (!clientId || !clientSecret) {
    return jsonError();
  }

  const url =
    new URL(context.request.url);

  const code =
    url.searchParams.get("code");

  const state =
    url.searchParams.get("state");

  if (!code || !state) {
    return jsonError(400);
  }

  const transactionId =
    getCookie(
      context.request,
      "__Host-oauth-tx"
    );

  if (!transactionId) {
    return jsonError(401);
  }

  const transactionHash =
    await hash(transactionId);

  const stateHash =
    await hash(state);

  const now =
    Math.floor(Date.now() / 1000);

  const transaction =
    await context.env.DB.prepare(
      `SELECT
        id_hash,
        provider,
        state_hash,
        nonce,
        code_verifier,
        expires_at
       FROM oauth_transactions
       WHERE id_hash = ?
         AND provider = ?
         AND state_hash = ?
         AND expires_at > ?`
    )
      .bind(
        transactionHash,
        provider,
        stateHash,
        now
      )
      .first();

  if (!transaction) {
    return jsonError(401);
  }

  await context.env.DB.prepare(
    `DELETE FROM oauth_transactions
     WHERE id_hash = ?`
  )
    .bind(transactionHash)
    .run();

  const redirectUri =
    `${context.env.PUBLIC_BASE_URL}/oauth/callback/${provider}`;

  const tokenBody =
    new URLSearchParams();

  tokenBody.set(
    "client_id",
    clientId
  );

  tokenBody.set(
    "client_secret",
    clientSecret
  );

  tokenBody.set(
    "code",
    code
  );

  tokenBody.set(
    "redirect_uri",
    redirectUri
  );

  tokenBody.set(
    "grant_type",
    "authorization_code"
  );

  tokenBody.set(
    "code_verifier",
    transaction.code_verifier
  );

  const tokenResponse =
    await fetch(
      config.tokenEndpoint,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",

          "Accept":
            "application/json"
        },

        body:
          tokenBody.toString()
      }
    );

  if (!tokenResponse.ok) {
    return jsonError(401);
  }

  const tokenData =
    await tokenResponse.json();

  let identity;

  try {
    if (provider === "google") {
      if (!tokenData.id_token) {
        return jsonError(401);
      }

      identity =
        await verifyGoogleIdToken(
          tokenData.id_token,
          transaction.nonce,
          clientId
        );
    } else {
      if (!tokenData.access_token) {
        return jsonError(401);
      }

      identity =
        await getGithubIdentity(
          tokenData.access_token,
          clientId,
          clientSecret
        );
    }
  } catch {
    return jsonError(401);
  }

  const sessionId =
    randomValue();

  const sessionHash =
    await hash(sessionId);

  const sessionExpiresAt =
    now + 8 * 60 * 60;

  await context.env.DB.prepare(
    `INSERT INTO sessions
      (
        id_hash,
        issuer,
        subject,
        email,
        display_name,
        expires_at
      )
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      sessionHash,
      identity.issuer,
      identity.subject,
      identity.email,
      identity.displayName,
      sessionExpiresAt
    )
    .run();

  const headers = new Headers();

  headers.set(
    "Location",
    context.env.PUBLIC_BASE_URL
  );

  headers.append(
    "Set-Cookie",
    setSessionCookie(sessionId)
  );

  headers.append(
    "Set-Cookie",
    clearOAuthTransactionCookie()
  );

  headers.set(
    "Cache-Control",
    "no-store"
  );

  return new Response(null, {
    status: 302,
    headers
  });
}
