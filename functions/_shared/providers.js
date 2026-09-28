export const PROVIDERS = {
  google: {
    authorizationEndpoint:
      "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint:
      "https://oauth2.googleapis.com/token",
    clientIdEnv:
      "GOOGLE_CLIENT_ID",
    clientSecretEnv:
      "GOOGLE_CLIENT_SECRET",
    scope:
      "openid email profile",
  },

  github: {
    authorizationEndpoint:
      "https://github.com/login/oauth/authorize",
    tokenEndpoint:
      "https://github.com/login/oauth/access_token",
    clientIdEnv:
      "GITHUB_CLIENT_ID",
    clientSecretEnv:
      "GITHUB_CLIENT_SECRET",
  },
};

export function getProvider(name) {
  return PROVIDERS[name] ?? null;
}
