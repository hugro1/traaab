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

function base64urlToBytes(value) {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const padded =
    base64 + "=".repeat((4 - (base64.length % 4)) % 4);

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);

  return crypto.subtle.digest("SHA-256", data);
}

function bufferToBase64url(buffer) {
  return base64url(new Uint8Array(buffer));
}

async function hash(value) {
  return bufferToBase64url(await sha256(value));
}

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie");

  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [key, ...rest] = part.trim().split("=");

    if (key === name) {
      return rest.join("=");
    }
  }

  return null;
}

function jsonError(status = 400) {
  return new Response("Bad Request", {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

function decodeJwtPart(value) {
  const bytes = base64urlToBytes(value);
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function validateGoogleIdToken(
  idToken,
  nonce,
  clientId
) {
  const parts = idToken.split(".");

  if (parts.length !== 3) {
    throw new Error("invalid_token");
  }

  const header = decodeJwtPart(parts[0]);
  const payload = decodeJwtPart(parts[1]);

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("invalid_token");
  }

  const discoveryResponse = await fetch(
    "https://accounts.google.com/.well-known/openid-configuration"
  );

  if (!discoveryResponse.ok) {
    throw new Error("oidc_discovery");
  }

  const discovery = await discoveryResponse.json();

  if (
    discovery.issuer !==
    "https://accounts.google.com"
  ) {
    throw new Error("invalid_issuer");
  }

  const jwksResponse = await fetch(
    discovery.jwks_uri
  );

  if (!jwksResponse.ok) {
    throw new Error("jwks_error");
  }

  const jwks = await jwksResponse.json();

  const jwk = jwks.keys.find(
    (key) => key.kid === header.kid
  );

  if (!jwk) {
    throw new Error("unknown_key");
  }

  const publicKey =
    await crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256"
      },
      false,
      ["verify"]
    );

  const signingInput =
    `${parts[0]}.${parts[1]}`;

  const signature =
    base64urlToBytes(parts[2]);

  const valid =
    await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      signature,
      new TextEncoder().encode(signingInput)
    );

  if (!valid) {
    throw new Error("invalid_signature");
  }

  const now = Math.floor(Date.now() / 1000);

  if (
    payload.iss !== "https://accounts.google.com" ||
    payload.aud !== clientId ||
    typeof payload.exp !== "number" ||
    payload.exp <= now ||
    typeof payload.iat !== "number" ||
    payload.iat > now + 300 ||
    payload.nonce !== nonce ||
    !payload.sub
  ) {
    throw new Error("invalid_claims");
  }

  return {
    issuer: "https://accounts.google.com",
    subject: String(payload.sub),
    email: payload.email ?? null,
    displayName: payload.name ?? null
  };
}

async function exchangeGoogleCode(
  code,
  codeVerifier,
  context
) {
  const body = new URLSearchParams({
    code,
    client_id: context.env.GOOGLE_CLIENT_ID,
    client_secret: context.env.GOOGLE_CLIENT_SECRET,
    redirect_uri:
      `${context.env.PUBLIC_BASE_URL}/oauth/callback/google`,
    grant_type: "authorization_code",
    code_verifier: codeVerifier
  });

  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body
    }
  );

  if (!response.ok) {
    throw new Error("token_exchange");
  }

  return response.json();
}

async function exchangeGithubCode(
  code,
  codeVerifier,
  context
) {
  const body = new URLSearchParams({
    code,
    client_id: context.env.GITHUB_CLIENT_ID,
    client_secret: context.env.GITHUB_CLIENT_SECRET,
    redirect_uri:
      `${context.env.PUBLIC_BASE_URL}/oauth/callback/github`,
    code_verifier: codeVerifier
  });

  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body
    }
  );

  if (!response.ok) {
    throw new Error("token_exchange");
  }

  return response.json();
}

async function getGithubProfile(accessToken) {
  const response = await fetch(
    "https://api.github.com/user",
    {
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
        Accept:
          "application/vnd.github+json",
        "X-GitHub-Api-Version":
          "2026-03-10"
      }
    }
  );

  if (!response.ok) {
    throw new Error("github_profile");
  }

  const profile = await response.json();

  if (
    !Number.isInteger(profile.id)
  ) {
    throw new Error("github_profile");
  }

  return profile;
}

async function revokeGithubAuthorization(
  accessToken,
  context
) {
  const credentials =
    `${context.env.GITHUB_CLIENT_ID}:${context.env.GITHUB_CLIENT_SECRET}`;

  const basic =
    btoa(credentials);

  const response = await fetch(
    `https://api.github.com/applications/${context.env.GITHUB_CLIENT_ID}/grant`,
    {
      method: "DELETE",
      headers: {
        Authorization:
          `Basic ${basic}`,
        Accept:
          "application/vnd.github+json",
        "Content-Type":
          "application/json",
        "X-GitHub-Api-Version":
          "2026-03-10"
      },
      body: JSON.stringify({
        access_token: accessToken
      })
    }
  );

  if (response.status !== 204) {
    throw new Error("github_revoke");
  }
}

function randomValue() {
  const bytes = new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return base64url(bytes);
}

export async function onRequestGet(context) {
  const { provider } = context.params;

  if (
    provider !== "google" &&
    provider !== "github"
  ) {
    return jsonError(404);
  }

  const url = new URL(context.request.url);

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (error || !code || !state) {
    return jsonError();
  }

  const transactionCookie =
    getCookie(
      context.request,
      "__Host-oauth-tx"
    );

  if (!transactionCookie) {
    return jsonError();
  }

  const idHash =
    await hash(transactionCookie);

  const stateHash =
    await hash(state);

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
         AND expires_at > ?`
    )
      .bind(
        idHash,
        Math.floor(Date.now() / 1000)
      )
      .first();

  if (!transaction) {
    return jsonError();
  }

  if (
    transaction.provider !== provider ||
    transaction.state_hash !== stateHash
  ) {
    return jsonError();
  }

  await context.env.DB.prepare(
    `DELETE FROM oauth_transactions
     WHERE id_hash = ?`
  )
    .bind(idHash)
    .run();

  try {
    let identity;

    if (provider === "google") {
      const tokens =
        await exchangeGoogleCode(
          code,
          transaction.code_verifier,
          context
        );

      if (!tokens.id_token) {
        throw new Error("missing_id_token");
      }

      identity =
        await validateGoogleIdToken(
          tokens.id_token,
          transaction.nonce,
          context.env.GOOGLE_CLIENT_ID
        );
    } else {
      const tokens =
        await exchangeGithubCode(
          code,
          transaction.code_verifier,
          context
        );

      if (
        !tokens.access_token ||
        (
          tokens.token_type &&
          tokens.token_type.toLowerCase() !==
            "bearer"
        )
      ) {
        throw new Error("invalid_github_token");
      }

      const profile =
        await getGithubProfile(
          tokens.access_token
        );

      await revokeGithubAuthorization(
        tokens.access_token,
        context
      );

      identity = {
        issuer: "https://github.com",
        subject: String(profile.id),
        email: profile.email ?? null,
        displayName:
          profile.name ??
          profile.login ??
          null
      };
    }

    const sessionId =
      randomValue();

    const sessionHash =
      await hash(sessionId);

    const now =
      Math.floor(Date.now() / 1000);

    const expiresAt =
      now + 8 * 60 * 60;

    await context.env.DB.prepare(
      `INSERT INTO sessions
        (
          id_hash,
          issuer,
          subject,
          email,
          display_name,
          expires_at,
          created_at
        )
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        sessionHash,
        identity.issuer,
        identity.subject,
        identity.email,
        identity.displayName,
        expiresAt,
        now
      )
      .run();

    return new Response(null, {
      status: 302,
      headers: {
        Location:
          context.env.PUBLIC_BASE_URL,
        "Set-Cookie":
          `__Host-session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`,
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return jsonError();
  }
}
