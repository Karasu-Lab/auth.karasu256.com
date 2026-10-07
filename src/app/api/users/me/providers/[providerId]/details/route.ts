import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth/server';
import { getProviderProfile } from '@/lib/auth/provider-profile';
import { notFound, unauthorized } from '@/lib/api/responses';

/**
 * Returns the authenticated user's profile for a single linked provider.
 *
 * GET /api/users/me/providers/[providerId]/details
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ providerId: string }> }) {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return unauthorized();

  const { providerId } = await params;
  const profile = await getProviderProfile(auth, session.user.id, providerId);
  if (!profile) return notFound();

  return NextResponse.json(profile);
}
