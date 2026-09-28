export function getCookie(request, name) {
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

export function setOAuthTransactionCookie(value) {
  return `__Host-oauth-tx=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
}

export function clearOAuthTransactionCookie() {
  return "__Host-oauth-tx=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

export function setSessionCookie(value) {
  return `__Host-session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
}

export function clearSessionCookie() {
  return "__Host-session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
}

export function jsonError(status = 400) {
  return Response.json(
    { error: "request_failed" },
    {
      status,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
