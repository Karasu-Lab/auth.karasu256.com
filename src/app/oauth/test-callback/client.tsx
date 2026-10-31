'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Callback confirmation screen for OAuth authorization tests: the test
 * dialog (in the accounts developer settings) opens this app's real
 * authorization page in a popup with a client whose callback URI points
 * here, and this page hands the resulting code back to the opener via
 * `postMessage` and closes itself.
 */
function TestCallbackContent() {
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get('code') ?? undefined;
    const state = params.get('state') ?? undefined;
    const error = params.get('error') ?? undefined;

    if (window.opener) {
      window.opener.postMessage({ type: 'oauth_test_callback', code, state, error }, '*');
      window.close();
    }
  }, [params]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Processing…</p>
    </div>
  );
}

export function TestCallbackClient() {
  return (
    <Suspense>
      <TestCallbackContent />
    </Suspense>
  );
}
