import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DeviceClient } from './client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t('device.title') };
}

export default function DevicePage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <DeviceClient />
    </main>
  );
}
