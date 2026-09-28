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

export async function onRequestPost(context) {
  const origin = context.request.headers.get("Origin");

  if (origin !== context.env.PUBLIC_BASE_URL) {
    return new Response(null, {
      status: 403,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  const sessionId = getCookie(
    context.request,
    "__Host-session"
  );

  if (sessionId) {
    const sessionHash = await hash(sessionId);

    await context.env.DB.prepare(
      `DELETE FROM sessions
       WHERE id_hash = ?`
    )
      .bind(sessionHash)
      .run();
  }

  return new Response(null, {
    status: 204,
    headers: {
      "Set-Cookie":
        "__Host-session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
      "Cache-Control": "no-store"
    }
  });
}
