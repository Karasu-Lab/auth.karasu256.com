import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ResetPasswordConfirmClient } from './client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: t('resetPasswordConfirm.title') };
}

export default function ResetPasswordConfirmPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Suspense>
        <ResetPasswordConfirmClient />
      </Suspense>
    </main>
  );
}
