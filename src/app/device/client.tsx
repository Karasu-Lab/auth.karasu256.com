'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, CircleQuestionMark, Link2, LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Input, Label, UserAvatar, toast } from '@karasu-lab/ui';
import { ScopeList } from '@/components/auth/scope-list';
import { useSdk } from '@/lib/auth/client';

interface PublicClient {
  client_id: string;
  client_name?: string;
  logo_uri?: string;
}

interface DeviceVerification {
  user_code: string;
  status: string;
  client_id?: string;
  scope?: string;
}

type Phase = 'enter' | 'confirm' | 'done' | 'denied';

function errorText(error: unknown): string | null {
  if (typeof error !== 'object' || error === null) return null;
  const candidate = error as { error_description?: unknown; message?: unknown };
  if (typeof candidate.error_description === 'string') return candidate.error_description;
  if (typeof candidate.message === 'string') return candidate.message;
  return null;
}

function DeviceContent() {
  const {
    sdk: { authClient },
  } = useSdk();
  const t = useTranslations();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('user_code') ?? '';

  const { data: sessionData, isPending: sessionPending } = authClient.useSession();
  const [code, setCode] = useState(initialCode);
  const [verification, setVerification] = useState<DeviceVerification | null>(null);
  const [client, setClient] = useState<PublicClient | null>(null);
  const [phase, setPhase] = useState<Phase>('enter');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoVerified, setAutoVerified] = useState(false);

  useEffect(() => {
    if (sessionPending || sessionData) return;
    const next = encodeURIComponent(window.location.href);
    window.location.replace(`/sign-in?next=${next}`);
  }, [sessionPending, sessionData]);

  async function verify(rawCode: string) {
    const userCode = rawCode.trim();
    if (!userCode) return;
    setBusy(true);
    setError(null);
    try {
      const { data, error: fetchError } = await authClient.$fetch('/device', { query: { user_code: userCode } });
      if (fetchError) {
        setError(errorText(fetchError) ?? t('device.invalidCode'));
        return;
      }
      const result = data as DeviceVerification;
      setVerification(result);
      if (result.status === 'approved') {
        setPhase('done');
      } else if (result.status === 'denied') {
        setPhase('denied');
      } else if (result.status === 'pending') {
        setPhase('confirm');
        if (result.client_id) {
          const { data: clientData } = await authClient.oauth2.publicClient({ query: { client_id: result.client_id } });
          setClient(clientData as PublicClient | null);
        }
      } else {
        setError(t('device.invalidCode'));
      }
    } catch {
      setError(t('signIn.error.unknown'));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (autoVerified || !initialCode || sessionPending || !sessionData) return;
    setAutoVerified(true);
    void verify(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoVerified, initialCode, sessionPending, sessionData]);

  async function respond(approve: boolean) {
    if (!verification) return;
    setBusy(true);
    setError(null);
    try {
      const { error: fetchError } = await authClient.$fetch(approve ? '/device/approve' : '/device/deny', {
        method: 'POST',
        body: { userCode: verification.user_code },
      });
      if (fetchError) {
        const message = errorText(fetchError) ?? t('signIn.error.unknown');
        setError(message);
        toast.error(message);
        return;
      }
      setPhase(approve ? 'done' : 'denied');
    } catch {
      toast.error(t('signIn.error.unknown'));
    } finally {
      setBusy(false);
    }
  }

  const scopes = (verification?.scope ?? '').split(' ').filter(Boolean);

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-card text-sm text-card-foreground shadow-sm ring-1 ring-foreground/10">
      <div className="p-6 sm:p-8">
        {sessionPending || !sessionData ? (
          <div className="flex min-h-48 items-center justify-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : phase === 'done' || phase === 'denied' ? (
          <div className="flex min-h-48 flex-col items-center justify-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted ring-1 ring-foreground/10">
              <Check className="h-6 w-6 text-primary" />
            </span>
            <p className="mt-4">{phase === 'done' ? t('device.done') : t('device.denied')}</p>
          </div>
        ) : phase === 'confirm' && verification ? (
          <div>
            <h1 className="text-lg font-semibold">{t('device.title')}</h1>

            <div className="mt-6 flex items-center justify-center gap-4" aria-hidden>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-foreground/10">
                <UserAvatar uid={sessionData.user.id} iconUrl={sessionData.user.image} size={48} />
              </span>
              <Link2 className="h-5 w-5 shrink-0 text-muted-foreground" />
              {client?.logo_uri ? (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-foreground/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={client.logo_uri} alt="" className="h-full w-full object-cover" />
                </span>
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-foreground/10">
                  <CircleQuestionMark className="h-6 w-6 text-muted-foreground" />
                </span>
              )}
            </div>

            <div className="mt-6">
              <p className="text-sm">{t('device.requesting', { name: client?.client_name ?? verification.client_id ?? '' })}</p>
              {scopes.length > 0 && <ScopeList scopes={scopes} />}
            </div>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <div className="mt-8 flex flex-col gap-2">
              <Button className="w-full" disabled={busy} onClick={() => void respond(true)}>
                {t('oauthConsent.approve')}
              </Button>
              <Button variant="outline" className="w-full" disabled={busy} onClick={() => void respond(false)}>
                {t('oauthConsent.deny')}
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void verify(code);
            }}
          >
            <h1 className="text-lg font-semibold">{t('device.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('device.description')}</p>

            <div className="mt-5 space-y-2">
              <Label htmlFor="device-user-code">{t('device.codeLabel')}</Label>
              <Input
                id="device-user-code"
                value={code}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCode(event.target.value)}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

            <Button type="submit" className="mt-6 w-full" disabled={busy || !code.trim()}>
              {t('device.verify')}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export function DeviceClient() {
  return (
    <Suspense>
      <DeviceContent />
    </Suspense>
  );
}
