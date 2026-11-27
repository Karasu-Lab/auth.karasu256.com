export async function generateOneTimeToken(authApiUrl: string, state: string, fetcher: typeof fetch = fetch): Promise<string> {
  const response = await fetcher(`${authApiUrl.replace(/\/+$/, '')}/api/auth/one-time-token/generate?state=${encodeURIComponent(state)}`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('one_time_token_failed');
  const body = (await response.json()) as { token?: string };
  if (!body.token) throw new Error('one_time_token_failed');
  return body.token;
}
