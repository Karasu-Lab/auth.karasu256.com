'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink } from '@fortawesome/free-solid-svg-icons';
import { Button, CardContent, CardHeader, Container, Input, Label, Spinner, toast } from '@karasu-lab/ui';
import { providerDefinitions } from '@/components/auth/provider-definitions';
import { useSdk } from '@/lib/auth/client';
import { getRedirectTo } from '@/lib/redirect';
import { cancelTemporarySignUp, completeTemporarySignUp, fetchTemporarySignUp, type TemporarySignUp } from '@/lib/temporary-sign-up';

type Phase = { kind: 'loading' } | { kind: 'form'; signUp: TemporarySignUp } | { kind: 'done' } | { kind: 'error'; message: string };

const definitions = new Map(providerDefinitions.map((definition) => [definition.id, definition]));

function SignUpCompleteContent() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const { config } = useSdk();
  const redirectTo = getRedirectTo(searchParams.get('next'), config);
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetchTemporarySignUp(config.authApiUrl)
      .then((result) => {
        if (result.kind === 'found') {
          setName(result.signUp.user.name ?? '');
          setEmail(result.signUp.user.email ?? '');
          setPhase({ kind: 'form', signUp: result.signUp });
        } else if (result.kind === 'none') {
          setPhase({ kind: 'done' });
        } else {
          setPhase({ kind: 'error', message: result.message });
        }
      })
      .catch((error: unknown) => {
        setPhase({ kind: 'error', message: error instanceof Error ? error.message : String(error) });
      });
  }, [config.authApiUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await completeTemporarySignUp(config.authApiUrl, { name: name.trim(), email: email.trim() }).catch((error: unknown) => ({
      kind: 'error' as const,
      message: error instanceof Error ? error.message : String(error),
    }));
    if (result.kind === 'error') {
      toast.error(result.message);
      setSubmitting(false);
      return;
    }
    if (redirectTo) {
      window.location.replace(redirectTo);
      return;
    }
    setPhase({ kind: 'done' });
  }

  async function handleCancel() {
    setCancelling(true);
    const result = await cancelTemporarySignUp(config.authApiUrl).catch((error: unknown) => ({
      kind: 'error' as const,
      message: error instanceof Error ? error.message : String(error),
    }));
    if (result.kind === 'error') {
      toast.error(result.message);
      setCancelling(false);
      return;
    }
    window.location.href = '/sign-in';
  }

  if (phase.kind === 'loading') {
    return (
      <Container className="max-w-sm">
        <CardContent className="flex items-center justify-center py-10">
          <Spinner />
        </CardContent>
      </Container>
    );
  }

  if (phase.kind === 'error') {
    return (
      <Container className="max-w-sm">
        <CardHeader className="text-lg font-semibold">{t('signUpComplete.title')}</CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{phase.message}</p>
        </CardContent>
      </Container>
    );
  }

  if (phase.kind === 'done') {
    return (
      <Container className="max-w-sm">
        <CardHeader className="text-lg font-semibold">{t('signUpComplete.title')}</CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('signUpComplete.message')}</p>
        </CardContent>
      </Container>
    );
  }

  const { signUp } = phase;

  return (
    <Container className="max-w-sm">
      <CardHeader className="text-lg font-semibold">{t('signUpComplete.formTitle')}</CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('signUpComplete.formDescription')}</p>
          <div className="space-y-2">
            <Label htmlFor="sign-up-complete-name">{t('signUpComplete.name')}</Label>
            <Input
              id="sign-up-complete-name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              required
              disabled={submitting || cancelling}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sign-up-complete-email">{t('signIn.email')}</Label>
            <Input
              id="sign-up-complete-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              disabled={submitting || cancelling}
            />
          </div>
          {signUp.providers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('signUpComplete.linkedProviders')}</p>
              <ul className="space-y-2">
                {signUp.providers.map((provider) => {
                  const definition = definitions.get(provider.providerId);
                  return (
                    <li key={`${provider.providerId}:${provider.accountId}`} className="flex items-center gap-3 rounded-lg px-3 py-2 ring-1 ring-foreground/10">
                      <FontAwesomeIcon icon={definition?.icon ?? faLink} className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{definition?.label ?? provider.providerId}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={submitting || cancelling || !name.trim() || !email.trim()}>
            {submitting ? t('signUpComplete.registering') : t('signUpComplete.register')}
          </Button>
          <Button type="button" variant="outline" className="w-full" disabled={submitting || cancelling} onClick={() => void handleCancel()}>
            {t('signUpComplete.cancel')}
          </Button>
        </form>
      </CardContent>
    </Container>
  );
}

export function SignUpCompleteClient() {
  return (
    <Suspense>
      <SignUpCompleteContent />
    </Suspense>
  );
}
