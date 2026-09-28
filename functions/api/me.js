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

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  return crypto.subtle.digest("SHA-256", data);
}

async function hash(value) {
  return base64url(
    new Uint8Array(await sha256(value))
  );
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

export async function onRequestGet(context) {
  const sessionId = getCookie(
    context.request,
    "__Host-session"
  );

  if (!sessionId) {
    return new Response(null, {
      status: 401,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  const sessionHash = await hash(sessionId);

  const session = await context.env.DB.prepare(
    `SELECT
      issuer,
      subject,
      email,
      display_name,
      expires_at
     FROM sessions
     WHERE id_hash = ?
       AND expires_at > ?`
  )
    .bind(
      sessionHash,
      Math.floor(Date.now() / 1000)
    )
    .first();

  if (!session) {
    return new Response(null, {
      status: 401,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  return Response.json(
    {
      issuer: session.issuer,
      subject: session.subject,
      email: session.email,
      displayName: session.display_name
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
