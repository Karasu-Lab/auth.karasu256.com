'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { useTranslations } from 'next-intl';
import { toast } from '@karasu-lab/ui';
import { useSdk } from '@/lib/auth/client';
import { Button, Checkbox, Input, Label, PasswordInput, Turnstile, type TurnstileHandle } from '@karasu-lab/ui';
import { LocalizedPasswordStrengthIndicator } from './localized-password-strength-indicator';

/**
 * Account creation form: email and password with a strength indicator and
 * a terms agreement, against better-auth. On success it shows the account
 * created page, which asks the user to check their email.
 */
export function SignUpForm({ next }: { next: string | null }) {
  const t = useTranslations();
  const router = useRouter();
  const {
    sdk: { authClient },
    config,
  } = useSdk();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Bot verification: while a site key is configured, registration
  // waits for the widget's single-use token and carries it along.
  const turnstileSiteKey = config.turnstileSiteKey;
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);

  const registerDisabled = loading || !email || !password || !agreedToTerms || (Boolean(turnstileSiteKey) && !turnstileToken);
  const termsUrl = `${config.appUrl ?? ''}/terms`;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await authClient.signUp.email(
      { email, password, name: email, callbackURL: next ? `/email/verify/complete?next=${encodeURIComponent(next)}` : undefined },
      {
        headers: turnstileToken ? { 'cf-turnstile-response': turnstileToken } : undefined,
        onSuccess: () => {
          router.push('/sign-up/complete');
        },
        onError: (ctx) => {
          turnstileRef.current?.reset();
          if (ctx.error.code === 'VERIFICATION_EMAIL_RESENT') {
            toast.success(t('emailVerifyComplete.resent'), { autoClose: true });
          } else if (ctx.error.code === 'VERIFICATION_EMAIL_RATE_LIMITED') {
            toast.error(t('emailVerifyComplete.rateLimited'));
          } else {
            console.error(ctx.error);
            toast.error(ctx.error.message || (ctx.error as { error?: string }).error || ctx.error.statusText);
          }
          setLoading(false);
        },
      }
    );
  }

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="register-email">{t('signIn.email')}</Label>
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-password">{t('signIn.password')}</Label>
        <PasswordInput
          id="register-password"
          name="new-password"
          autoComplete="new-password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <LocalizedPasswordStrengthIndicator password={password} />
      </div>
      <div className="flex items-start gap-2">
        <Checkbox id="register-terms" checked={agreedToTerms} onCheckedChange={setAgreedToTerms} className="mt-0.5" disabled={loading} />
        <Label htmlFor="register-terms" className="font-normal text-sm leading-snug">
          {t.rich('signIn.agreeToTerms', {
            terms: (chunks) => (
              <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                {chunks}
              </a>
            ),
          })}
        </Label>
      </div>
      {turnstileSiteKey && (
        <div className="flex justify-center">
          <Turnstile ref={turnstileRef} siteKey={turnstileSiteKey} action="sign-up" onTokenChange={setTurnstileToken} />
        </div>
      )}
      <Button type="submit" className="w-full" disabled={registerDisabled}>
        <FontAwesomeIcon icon={faUserPlus} />
        {loading ? t('signIn.creatingAccount') : t('signIn.createAccount')}
      </Button>
    </form>
  );
}
