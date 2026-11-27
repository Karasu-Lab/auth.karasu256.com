import { type NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname !== '/.well-known/assetlinks.json') return NextResponse.next();

  const authApiUrl = process.env.AUTH_API_URL;
  if (!authApiUrl) {
    return NextResponse.json(
      { error: 'android_asset_links_unavailable', reason: 'AUTH_API_URL is not configured.' },
      { status: 503 },
    );
  }
  return NextResponse.rewrite(new URL(request.nextUrl.pathname, authApiUrl));
}

export const config = {
  matcher: ['/.well-known/assetlinks.json'],
};
