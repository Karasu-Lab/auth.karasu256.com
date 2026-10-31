'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, ChevronLeft, CircleQuestionMark, Link2, LoaderCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, SlideStep, SlideSteps, UserAvatar, toast } from '@karasu-lab/ui';
import { authClient } from '@/lib/auth/client';

interface PublicClient {
  client_id: string;
  client_name?: string;
  logo_uri?: string;
}

interface DeviceSessionEntry {
  session: { token: string };
  user: { id: string; name: string; email: string; image?: string | null };
}

type Step = 'account' | 'consent';

/** The sliding panels, in order: account selection, then the connection itself. */
const STEPS: readonly Step[] = ['account', 'consent'];

/** Indeterminate bar pinned to the top edge of the container while a step is working. */
function ProgressBar({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className={`absolute inset-x-0 top-0 z-10 h-1 overflow-hidden bg-primary/15 transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="h-full w-1/3 bg-primary [animation:sign-in-progress_1.1s_ease-in-out_infinite]" />
    </div>
  );
}

/**
 * Consent screen for the OAuth provider's authorization flow. The flow is
 * account selection, then authorization: the first step is an account
 * chooser listing the device sessions already signed in on this device
 * (multi-session), and picking one slides to the consent step. The
 * consent step is composed, from the top, of a row holding the user's
 * icon, a connection icon, and the destination app's icon (a question
 * mark placeholder when the client has no logo); the permission scopes
 * the client requests, translated on the client; and, pinned to the
 * bottom, the approve and deny buttons stacked vertically. Approving
 * activates the chosen account when it is not the active session,
 * records the consent, and redirects to the URL the authorization
 * server returns; denying records a refusal the same way.
 */
function ConsentContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client_id');
  const scope = searchParams.get('scope') ?? '';

  const { data: sessionData } = authClient.useSession();
  const [client, setClient] = useState<PublicClient | null>(null);
  const [sessions, setSessions] = useState<DeviceSessionEntry[] | null>(null);
  const [selected, setSelected] = useState<DeviceSessionEntry | null>(null);
  const [step, setStep] = useState<Step>('account');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    authClient.oauth2.publicClient({ query: { client_id: clientId } }).then(({ data }) => setClient(data as PublicClient | null));
  }, [clientId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await authClient.multiSession.listDeviceSessions();
      if (cancelled) return;
      setSessions((data ?? []) as DeviceSessionEntry[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // The authorization flow only reaches this page with a session, so when
  // the device list is empty (or has not loaded the active entry) the
  // current session's user is the account to connect.
  const activeEntry: DeviceSessionEntry | null =
    sessions?.find((entry) => entry.session.token === sessionData?.session.token) ??
    (sessionData
      ? {
          session: { token: sessionData.session.token },
          user: {
            id: sessionData.user.id,
            name: sessionData.user.name,
            email: sessionData.user.email,
            image: sessionData.user.image,
          },
        }
      : null);
  const accounts: DeviceSessionEntry[] | null =
    sessions === null ? null : sessions.length > 0 ? sessions : activeEntry ? [activeEntry] : [];
  const chosen = selected ?? activeEntry;

  function selectAccount(entry: DeviceSessionEntry) {
    setSelected(entry);
    setStep('consent');
  }

  async function respond(accept: boolean) {
    if (!chosen) return;
    setSubmitting(true);
    try {
      // Consent is recorded against the active session, so activate the
      // chosen account first when it is not the active one.
      if (chosen.session.token !== sessionData?.session.token) {
        const { error } = await authClient.multiSession.setActive({ sessionToken: chosen.session.token });
        if (error) {
          toast.error(t('signIn.error.unknown'));
          setSubmitting(false);
          return;
        }
      }
      const { data } = await authClient.oauth2.consent({ accept, scope });
      const url = (data as { url?: string } | null)?.url;
      if (url) {
        window.location.href = url;
        return;
      }
      setSubmitting(false);
    } catch {
      toast.error(t('signIn.error.unknown'));
      setSubmitting(false);
    }
  }

  const scopes = scope.split(' ').filter(Boolean);
  const stepIndex = Math.max(0, STEPS.indexOf(step));

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-card text-sm text-card-foreground shadow-sm ring-1 ring-foreground/10">
      <ProgressBar active={submitting} />
      <div className="p-6 sm:p-8">
        {accounts === null ? (
          <div className="flex min-h-48 items-center justify-center">
            <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <SlideSteps index={stepIndex}>
            <SlideStep aria-hidden={step !== 'account'}>
              <div>
                <h1 className="text-lg font-semibold">{t('oauthConsent.account.title')}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t('oauthConsent.account.description')}</p>

                <div className="mt-5 max-h-64 overflow-y-auto pr-1">
                  <ul className="divide-y divide-foreground/10">
                    {accounts.map((entry) => (
                      <li key={entry.session.token}>
                        <button
                          type="button"
                          disabled={submitting || step !== 'account'}
                          onClick={() => selectAccount(entry)}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-50"
                        >
                          <UserAvatar uid={entry.user.id} iconUrl={entry.user.image} size={36} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{entry.user.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">{entry.user.email}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SlideStep>

            <SlideStep aria-hidden={step !== 'consent'}>
              <div className="flex h-full flex-col">
                <button
                  type="button"
                  disabled={submitting || step !== 'consent'}
                  onClick={() => setStep('account')}
                  className="flex max-w-full items-center gap-1 self-start rounded-full py-1 pr-3 pl-1 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span className="truncate">{chosen?.user.email}</span>
                </button>

                <div className="mt-6 flex items-center justify-center gap-4" aria-hidden>
                  {chosen ? (
                    <span className="rounded-full ring-1 ring-foreground/10">
                      <UserAvatar uid={chosen.user.id} iconUrl={chosen.user.image} size={48} />
                    </span>
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted ring-1 ring-foreground/10" />
                  )}
                  <Link2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                  {client?.logo_uri ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={client.logo_uri} alt="" className="h-12 w-12 rounded-full object-cover ring-1 ring-foreground/10" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted ring-1 ring-foreground/10">
                      <CircleQuestionMark className="h-6 w-6 text-muted-foreground" />
                    </span>
                  )}
                </div>

                <h1 className="mt-5 text-center text-lg font-semibold">{t('oauthConsent.title')}</h1>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  {t('oauthConsent.description', { name: client?.client_name ?? clientId ?? '' })}
                </p>

                {scopes.length > 0 && (
                  <ul className="mt-6 space-y-2.5">
                    {scopes.map((s) => {
                      const key = `oauthConsent.scopes.${s}`;
                      return (
                        <li key={s} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{t.has(key) ? t(key) : s}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="mt-auto flex flex-col gap-2 pt-8">
                  <Button className="w-full" disabled={submitting || step !== 'consent' || !chosen} onClick={() => void respond(true)}>
                    {t('oauthConsent.approve')}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={submitting || step !== 'consent' || !chosen}
                    onClick={() => void respond(false)}
                  >
                    {t('oauthConsent.deny')}
                  </Button>
                </div>
              </div>
            </SlideStep>
          </SlideSteps>
        )}
      </div>
    </div>
  );
}

export function ConsentClient() {
  return (
    <Suspense>
      <ConsentContent />
    </Suspense>
  );
}
