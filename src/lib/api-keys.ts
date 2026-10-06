import { getRequestAuth, type Auth } from '@/lib/auth/server';

export interface IssuedApiKey {
  id: string;
  name: string | null;
  start: string | null;
  createdAt: string;
  key: string;
}

export async function issueApiKey(auth: Auth, userId: string, name: string): Promise<IssuedApiKey> {
  const created = await auth.api.createApiKey({ body: { name, userId } });
  return {
    id: created.id,
    name: created.name ?? null,
    start: created.start ?? null,
    createdAt: new Date(created.createdAt).toISOString(),
    key: created.key,
  };
}

/** Only key validity is checked here; api.karasu256.com resolves the key's permissions. */
export async function verifyApiKey(headers: Headers, key: string): Promise<{ userId: string; keyId: string } | null> {
  const auth = await getRequestAuth(headers);
  const result = await auth.api.verifyApiKey({ body: { key } });
  if (!result.valid || !result.key) return null;
  return { userId: result.key.referenceId, keyId: result.key.id };
}
