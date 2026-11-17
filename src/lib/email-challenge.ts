/** The outcome of an email-challenge request, discriminated by `ok`. */
export type EmailChallengeResult = { ok: true } | { ok: false; status: number; code: string | null };

async function post(authApiUrl: string, path: string, body: Record<string, string>): Promise<EmailChallengeResult> {
  const base = authApiUrl.replace(/\/+$/, '');
  const res = await fetch(`${base}/api/auth/${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.ok) return { ok: true };
  const payload = (await res.json().catch(() => null)) as { code?: string } | null;
  return { ok: false, status: res.status, code: payload?.code ?? null };
}

/**
 * Emails a six-character sign-in code to the address and binds the challenge
 * to this browser through the challenge cookie.
 */
export function startEmailChallenge(authApiUrl: string, email: string): Promise<EmailChallengeResult> {
  return post(authApiUrl, 'sign-in/email-challenge', { email });
}

/**
 * Completes the challenge with the emailed code. The server hashes the code
 * as typed, so it is normalized to the uppercase form the server generates.
 */
export function verifyEmailChallengeOtp(authApiUrl: string, otp: string): Promise<EmailChallengeResult> {
  return post(authApiUrl, 'email-challenge/verify-otp', { otp: otp.trim().toUpperCase() });
}
