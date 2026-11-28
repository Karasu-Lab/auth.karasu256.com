export interface TemporaryUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface TemporaryProvider {
  providerId: string;
  accountId: string;
}

export interface TemporarySignUp {
  user: TemporaryUser;
  providers: TemporaryProvider[];
}

export type FetchTemporarySignUpResult = { kind: 'found'; signUp: TemporarySignUp } | { kind: 'none' } | { kind: 'error'; message: string };

export interface CompletedUser {
  id: string;
  name: string | null;
  email: string | null;
}

export type CompleteTemporarySignUpResult = { kind: 'completed'; user: CompletedUser } | { kind: 'error'; message: string };

export type CancelTemporarySignUpResult = { kind: 'cancelled' } | { kind: 'error'; message: string };

function errorMessage(payload: unknown, status: number): string {
  if (typeof payload === 'object' && payload !== null) {
    const candidate = payload as { message?: unknown; error_description?: unknown; error?: unknown; code?: unknown };
    for (const value of [candidate.message, candidate.error_description, candidate.error, candidate.code]) {
      if (typeof value === 'string' && value) return value;
    }
  }
  return `Request failed (${status})`;
}

export async function fetchTemporarySignUp(authApiUrl: string): Promise<FetchTemporarySignUpResult> {
  const base = authApiUrl.replace(/\/+$/, '');
  const res = await fetch(`${base}/api/auth/sign-up/temporary`, { credentials: 'include' });
  if (res.status === 404) return { kind: 'none' };
  const payload: unknown = await res.json().catch(() => null);
  if (!res.ok) return { kind: 'error', message: errorMessage(payload, res.status) };
  const signUp = payload as TemporarySignUp | null;
  if (!signUp || typeof signUp.user !== 'object' || signUp.user === null || !Array.isArray(signUp.providers)) {
    return { kind: 'error', message: errorMessage(payload, res.status) };
  }
  return { kind: 'found', signUp };
}

export async function completeTemporarySignUp(authApiUrl: string, input: { name: string; email: string }): Promise<CompleteTemporarySignUpResult> {
  const base = authApiUrl.replace(/\/+$/, '');
  const res = await fetch(`${base}/api/auth/sign-up/complete`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload: unknown = await res.json().catch(() => null);
  if (!res.ok) return { kind: 'error', message: errorMessage(payload, res.status) };
  const user = (payload as { user?: CompletedUser } | null)?.user;
  if (!user) return { kind: 'error', message: errorMessage(payload, res.status) };
  return { kind: 'completed', user };
}

export async function cancelTemporarySignUp(authApiUrl: string): Promise<CancelTemporarySignUpResult> {
  const base = authApiUrl.replace(/\/+$/, '');
  const res = await fetch(`${base}/api/auth/sign-up/cancel`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const payload: unknown = await res.json().catch(() => null);
    return { kind: 'error', message: errorMessage(payload, res.status) };
  }
  return { kind: 'cancelled' };
}
