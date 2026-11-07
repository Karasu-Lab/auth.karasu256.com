'use client';

import { useEffect } from 'react';

export function RootRedirectClient() {
  useEffect(() => {
    window.location.replace(`/sign-in${window.location.search}`);
  }, []);

  return null;
}
