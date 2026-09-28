function base64urlToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function decodeBase64urlJson(value) {
  return JSON.parse(
    new TextDecoder().decode(base64urlToBytes(value))
  );
}

async function getGoogleDiscovery() {
  const response = await fetch(
    "https://accounts.google.com/.well-known/openid-configuration",
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );

  if (!response.ok) {
    throw new Error("Google OIDC discovery failed");
  }

  return response.json();
}

export async function verifyGoogleIdToken(idToken, expectedNonce, clientId) {
  const parts = idToken.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid Google ID token");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const header = decodeBase64urlJson(encodedHeader);
  const payload = decodeBase64urlJson(encodedPayload);

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Invalid Google ID token header");
  }

  const discovery = await getGoogleDiscovery();

  if (discovery.issuer !== "https://accounts.google.com") {
    throw new Error("Invalid Google issuer");
  }

  const jwksResponse = await fetch(discovery.jwks_uri, {
    headers: {
      "Cache-Control": "no-store"
    }
  });

  if (!jwksResponse.ok) {
    throw new Error("Google JWKS failed");
  }

  const jwks = await jwksResponse.json();
  const jwk = jwks.keys.find((key) => key.kid === header.kid);

  if (!jwk) {
    throw new Error("Google signing key not found");
  }

  const publicKey = await crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["verify"]
  );

  const signingInput = new TextEncoder().encode(
    `${encodedHeader}.${encodedPayload}`
  );

  const signature = base64urlToBytes(encodedSignature);

  const validSignature = await crypto.subtle.verify(
    {
      name: "RSASSA-PKCS1-v1_5"
    },
    publicKey,
    signature,
    signingInput
  );

  if (!validSignature) {
    throw new Error("Invalid Google ID token signature");
  }

  const now = Math.floor(Date.now() / 1000);

  if (payload.iss !== "https://accounts.google.com") {
    throw new Error("Invalid Google issuer");
  }

  if (payload.aud !== clientId) {
    throw new Error("Invalid Google audience");
  }

  if (!payload.exp || payload.exp <= now) {
    throw new Error("Expired Google ID token");
  }

  if (!payload.iat || payload.iat > now + 300) {
    throw new Error("Invalid Google issued-at time");
  }

  if (payload.nonce !== expectedNonce) {
    throw new Error("Invalid Google nonce");
  }

  if (!payload.sub) {
    throw new Error("Missing Google subject");
  }

  return {
    issuer: "https://accounts.google.com",
    subject: String(payload.sub),
    email: payload.email ?? null,
    displayName: payload.name ?? null
  };
}

export async function getGithubIdentity(accessToken, clientId, clientSecret) {
  if (!accessToken) {
    throw new Error("Missing GitHub access token");
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10"
    }
  });

  if (!userResponse.ok) {
    throw new Error("GitHub user request failed");
  }

  const user = await userResponse.json();

  if (!Number.isInteger(user.id)) {
    throw new Error("Invalid GitHub user");
  }

  const revokeResponse = await fetch(
    `https://api.github.com/applications/${encodeURIComponent(clientId)}/grant`,
    {
      method: "DELETE",
      headers: {
        Authorization:
          "Basic " +
          btoa(`${clientId}:${clientSecret}`),
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        access_token: accessToken
      })
    }
  );

  if (revokeResponse.status !== 204) {
    throw new Error("GitHub authorization revocation failed");
  }

  return {
    issuer: "https://github.com",
    subject: String(user.id),
    email: user.email ?? null,
    displayName: user.name ?? user.login ?? null
  };
}
