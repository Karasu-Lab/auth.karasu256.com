import { NextRequest, NextResponse } from 'next/server';
import { getRequestAuth } from '@/lib/auth/server';
import { getProviderProfile } from '@/lib/auth/provider-profile';
import { requireSession } from '@/lib/api/require-session';

/**
 * Returns the authenticated user's profile for a single linked provider.
 *
 * GET /api/users/me/providers/[providerId]/details
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ providerId: string }> }) {
  const { user, error } = await requireSession();
  if (error) return error;

  const { providerId } = await params;
  const profile = await getProviderProfile(await getRequestAuth(request.headers), user.id, providerId);
  if (!profile) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(profile);
}
