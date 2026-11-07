import { getClientConfig } from '@/lib/auth/client-config';

export const dynamic = 'force-dynamic';

/** Returns the client configuration resolved from the server's environment. */
export function GET(): Response {
  return Response.json(getClientConfig());
}
