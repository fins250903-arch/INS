const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token';

export type DecapOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export function getDecapOAuthConfig(request: Request): DecapOAuthConfig | null {
  const clientId = import.meta.env.DECAP_GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.DECAP_GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const siteUrl = (import.meta.env.DECAP_SITE_URL || new URL(request.url).origin).replace(/\/$/, '');
  const redirectUri = `${siteUrl}/api/decap/callback`;

  return { clientId, clientSecret, redirectUri };
}

export function buildGitHubAuthorizeUrl(config: DecapOAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'repo,user',
    state
  });
  return `${GITHUB_AUTHORIZE}?${params.toString()}`;
}

export async function exchangeGitHubCode(
  config: DecapOAuthConfig,
  code: string
): Promise<{ accessToken: string } | { error: string }> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri
  });

  const response = await fetch(GITHUB_TOKEN, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  const data = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !data.access_token) {
    const message = data.error_description || data.error || 'Token exchange failed';
    return { error: message };
  }

  return { accessToken: data.access_token };
}

export function renderDecapOAuthCallbackHtml(status: 'success' | 'error', payload: unknown): string {
  const provider = 'github';
  const serialized = JSON.stringify(payload);
  const message =
    status === 'success'
      ? `authorization:${provider}:success:${serialized}`
      : `authorization:${provider}:error:${serialized}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Decap CMS</title></head>
  <body>
    <script>
      (function () {
        var provider = ${JSON.stringify(provider)};
        var message = ${JSON.stringify(message)};
        function receiveMessage(event) {
          if (window.opener) {
            window.opener.postMessage(message, event.origin);
            window.removeEventListener('message', receiveMessage, false);
          }
        }
        window.addEventListener('message', receiveMessage, false);
        if (window.opener) {
          window.opener.postMessage('authorizing:' + provider, '*');
        }
      })();
    </script>
  </body>
</html>`;
}
