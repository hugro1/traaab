function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function randomValue() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  return crypto.subtle.digest("SHA-256", data);
}

function bytesToBase64url(buffer) {
  return base64url(new Uint8Array(buffer));
}

async function hash(value) {
  return bytesToBase64url(await sha256(value));
}

export async function onRequestGet(context) {
  const { provider } = context.params;

  if (provider !== "google" && provider !== "github") {
    return new Response("Not Found", { status: 404 });
  }

  const baseUrl = context.env.PUBLIC_BASE_URL;

  const transactionId = randomValue();
  const state = randomValue();
  const codeVerifier = randomValue();

  const codeChallenge = await hash(codeVerifier);
  const idHash = await hash(transactionId);
  const stateHash = await hash(state);

  const nonce = provider === "google" ? randomValue() : null;

  const expiresAt = Math.floor(Date.now() / 1000) + 600;

  await context.env.DB.prepare(
    `INSERT INTO oauth_transactions
      (id_hash, provider, state_hash, nonce, code_verifier, expires_at)
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
    `${baseUrl}/oauth/callback/${provider}`;

  const params = new URLSearchParams({
    client_id:
      provider === "google"
        ? context.env.GOOGLE_CLIENT_ID
        : context.env.GITHUB_CLIENT_ID,

    redirect_uri: redirectUri,
    response_type: "code",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256"
  });

  if (provider === "google") {
    params.set("scope", "openid email profile");
    params.set("nonce", nonce);

    const authorizationUrl =
      "https://accounts.google.com/o/oauth2/v2/auth?" +
      params.toString();

    return new Response(null, {
      status: 302,
      headers: {
        Location: authorizationUrl,
        "Set-Cookie":
          `__Host-oauth-tx=${transactionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
        "Cache-Control": "no-store"
      }
    });
  }

  const authorizationUrl =
    "https://github.com/login/oauth/authorize?" +
    params.toString();

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizationUrl,
      "Set-Cookie":
        `__Host-oauth-tx=${transactionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      "Cache-Control": "no-store"
    }
  });
}
