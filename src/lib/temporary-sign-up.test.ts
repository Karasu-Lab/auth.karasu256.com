import { afterEach, describe, expect, it, vi } from 'vitest';
import { cancelTemporarySignUp, completeTemporarySignUp, fetchTemporarySignUp } from './temporary-sign-up';

const authApiUrl = 'https://api-auth.example.com';

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTemporarySignUp', () => {
  it('returns found with the user and providers on 200', async () => {
    const signUp = {
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com', image: null },
      providers: [{ providerId: 'google', accountId: 'google-1' }],
    };
    const fetchMock = stubFetch(jsonResponse(200, signUp));

    const result = await fetchTemporarySignUp(`${authApiUrl}/`);

    expect(result).toEqual({ kind: 'found', signUp });
    expect(fetchMock).toHaveBeenCalledWith(`${authApiUrl}/api/auth/sign-up/temporary`, { credentials: 'include' });
  });

  it('returns none on 404', async () => {
    stubFetch(jsonResponse(404, { error: 'temporary_signup_not_found' }));

    await expect(fetchTemporarySignUp(authApiUrl)).resolves.toEqual({ kind: 'none' });
  });

  it('returns the server error message on failure', async () => {
    stubFetch(jsonResponse(500, { message: 'message wins', error_description: 'description', error: 'error', code: 'code' }));

    await expect(fetchTemporarySignUp(authApiUrl)).resolves.toEqual({ kind: 'error', message: 'message wins' });
  });

  it('falls back through error_description, error and code in order', async () => {
    stubFetch(jsonResponse(500, { error_description: 'description wins', error: 'error', code: 'code' }));
    await expect(fetchTemporarySignUp(authApiUrl)).resolves.toEqual({ kind: 'error', message: 'description wins' });

    stubFetch(jsonResponse(500, { error: 'error wins', code: 'code' }));
    await expect(fetchTemporarySignUp(authApiUrl)).resolves.toEqual({ kind: 'error', message: 'error wins' });

    stubFetch(jsonResponse(500, { code: 'code wins' }));
    await expect(fetchTemporarySignUp(authApiUrl)).resolves.toEqual({ kind: 'error', message: 'code wins' });

    stubFetch(jsonResponse(500, {}));
    await expect(fetchTemporarySignUp(authApiUrl)).resolves.toEqual({ kind: 'error', message: 'Request failed (500)' });
  });

  it('returns error when a 200 payload has an invalid shape', async () => {
    stubFetch(jsonResponse(200, { user: { id: 'user-1' } }));

    await expect(fetchTemporarySignUp(authApiUrl)).resolves.toEqual({ kind: 'error', message: 'Request failed (200)' });
  });
});

describe('completeTemporarySignUp', () => {
  it('posts the name and email as JSON and returns the completed user', async () => {
    const user = { id: 'user-1', name: 'Test User', email: 'test@example.com' };
    const fetchMock = stubFetch(jsonResponse(200, { user }));

    const result = await completeTemporarySignUp(authApiUrl, { name: 'Test User', email: 'test@example.com' });

    expect(result).toEqual({ kind: 'completed', user });
    expect(fetchMock).toHaveBeenCalledWith(`${authApiUrl}/api/auth/sign-up/complete`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com' }),
    });
  });

  it('returns the server error message on failure', async () => {
    stubFetch(jsonResponse(400, { error: 'invalid_sign_up_input' }));

    await expect(completeTemporarySignUp(authApiUrl, { name: 'Test User', email: 'test@example.com' })).resolves.toEqual({
      kind: 'error',
      message: 'invalid_sign_up_input',
    });
  });

  it('returns error when a 200 payload has no user', async () => {
    stubFetch(jsonResponse(200, {}));

    await expect(completeTemporarySignUp(authApiUrl, { name: 'Test User', email: 'test@example.com' })).resolves.toEqual({
      kind: 'error',
      message: 'Request failed (200)',
    });
  });
});

describe('cancelTemporarySignUp', () => {
  it('returns cancelled on success', async () => {
    const fetchMock = stubFetch(jsonResponse(200, { status: true }));

    await expect(cancelTemporarySignUp(authApiUrl)).resolves.toEqual({ kind: 'cancelled' });
    expect(fetchMock).toHaveBeenCalledWith(`${authApiUrl}/api/auth/sign-up/cancel`, { method: 'POST', credentials: 'include' });
  });

  it('returns the server error message on failure', async () => {
    stubFetch(jsonResponse(404, { error: 'temporary_signup_not_found' }));

    await expect(cancelTemporarySignUp(authApiUrl)).resolves.toEqual({ kind: 'error', message: 'temporary_signup_not_found' });
  });
});
