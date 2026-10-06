import { MissingEnvError } from '@Hashibutogarasu/utils/server';

const NEON_API_URL = 'https://console.neon.tech/api/v2';

const urlByBranch = new Map<string, Promise<string>>();

export class UnknownDbBranchError extends Error {
  constructor(branch: string) {
    super(`Unknown database branch: ${branch}`);
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new MissingEnvError(name);
  return value;
}

async function neon<T>(path: string): Promise<T> {
  const res = await fetch(`${NEON_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${requireEnv('NEON_API_KEY')}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Neon API ${path} responded ${res.status}`);
  return (await res.json()) as T;
}

async function fetchBranchUrl(branch: string): Promise<string> {
  const projectId = requireEnv('NEON_PROJECT_ID');
  const { branches } = await neon<{ branches: { id: string; name: string }[] }>(
    `/projects/${projectId}/branches?search=${encodeURIComponent(branch)}`
  );
  const match = branches.find((b) => b.name === branch);
  if (!match) throw new UnknownDbBranchError(branch);

  const query = new URLSearchParams({
    branch_id: match.id,
    database_name: requireEnv('NEON_DATABASE_NAME'),
    role_name: requireEnv('NEON_ROLE_NAME'),
    pooled: 'true',
  });
  const { uri } = await neon<{ uri: string }>(`/projects/${projectId}/connection_uri?${query.toString()}`);
  return uri;
}

export function resolveDatabaseUrl(branch: string): Promise<string> {
  const existing = urlByBranch.get(branch);
  if (existing) return existing;
  const pending = fetchBranchUrl(branch);
  pending.catch(() => urlByBranch.delete(branch));
  urlByBranch.set(branch, pending);
  return pending;
}
