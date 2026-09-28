import {
  randomValue,
  hash
} from "../../_shared/crypto.js";

import {
  getProvider
} from "../../_shared/providers.js";

import {
  setOAuthTransactionCookie,
  jsonError
} from "../../_shared/cookies.js";

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

  if (!clientId) {
    return jsonError();
  }

  const transactionId =
    randomValue();

  const state =
    randomValue();

  const codeVerifier =
    randomValue();

  const codeChallenge =
    await hash(codeVerifier);

  const nonce =
    provider === "google"
      ? randomValue()
      : null;

  const now =
    Math.floor(Date.now() / 1000);

  const expiresAt =
    now + 10 * 60;

  const idHash =
    await hash(transactionId);

  const stateHash =
    await hash(state);

  await context.env.DB.prepare(
    `INSERT INTO oauth_transactions
      (
        id_hash,
        provider,
        state_hash,
        nonce,
        code_verifier,
        expires_at
      )
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(
      idHash,
      provider,
      stateHash,
      nonce,
      codeVerifier,
      expiresAt
    )
    .run();

  const redirectUri =
    `${context.env.PUBLIC_BASE_URL}/oauth/callback/${provider}`;

  const authorizationUrl =
    new URL(config.authorizationEndpoint);

  authorizationUrl.searchParams.set(
    "client_id",
    clientId
  );

  authorizationUrl.searchParams.set(
    "redirect_uri",
    redirectUri
  );

  authorizationUrl.searchParams.set(
    "response_type",
    "code"
  );

  authorizationUrl.searchParams.set(
    "state",
    state
  );

  authorizationUrl.searchParams.set(
    "code_challenge",
    codeChallenge
  );

  authorizationUrl.searchParams.set(
    "code_challenge_method",
    "S256"
  );

  if (provider === "google") {
    authorizationUrl.searchParams.set(
      "scope",
      "openid email profile"
    );

    authorizationUrl.searchParams.set(
      "nonce",
      nonce
    );
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location:
        authorizationUrl.toString(),

      "Set-Cookie":
        setOAuthTransactionCookie(
          transactionId
        ),

      "Cache-Control":
        "no-store"
    }
  });
}
