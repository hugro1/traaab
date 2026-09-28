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

export function randomValue() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return base64url(bytes);
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);

  return crypto.subtle.digest("SHA-256", data);
}

export async function hash(value) {
  const digest = await sha256(value);

  return base64url(new Uint8Array(digest));
}
