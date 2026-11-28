'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, CardContent, CardHeader, ConfirmDialog, Container, LoadingView, UserAvatar, toast } from '@karasu-lab/ui';
import { useSdk } from '@/lib/auth/client';
import { useUser } from '@/lib/auth/use-user';
import { resolveSignInContinueMode } from '@/lib/sign-in-continue';

export function SignInContinueClient() {
  const t = useTranslations();
  const {
    sdk: { authClient },
    config,
  } = useSdk();
  const { user, isPending } = useUser();
  const mode = resolveSignInContinueMode(config.appEnv);
  const [signingOut, setSigningOut] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const { error } = await authClient.signOut();
      if (error) {
        toast.error(error.message || (error as { error?: string }).error || error.statusText);
        setSigningOut(false);
        return;
      }
      window.location.replace('/sign-in');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      setSigningOut(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const { error } = await authClient.deleteUser({});
      if (error) {
        toast.error(error.code === 'SESSION_EXPIRED' ? t('dangerZone.reauthRequired') : error.message || (error as { error?: string }).error || error.statusText);
        setDeleting(false);
        return;
      }
      window.location.replace('/sign-in');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
      setDeleting(false);
    }
  }

  useEffect(() => {
    if (mode === 'production') {
      window.location.replace(config.accountsUrl);
      return;
    }
    if (!isPending && !user) window.location.replace('/sign-in');
  }, [mode, config.accountsUrl, isPending, user]);

  if (mode === 'production') return <LoadingView message={t('oauthCallback.redirecting')} />;
  if (isPending || !user) return <LoadingView message={t('oauthCallback.redirecting')} />;

  return (
    <Container className="max-w-sm">
      <CardHeader className="text-lg font-semibold">{t('signInContinue.title')}</CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <UserAvatar uid={user.id} iconUrl={user.image} size={48} />
          <div className="min-w-0">
            <p className="truncate font-medium">{user.name ?? user.email}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{t('signInContinue.description')}</p>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="shrink-0 text-muted-foreground">{t('signInContinue.name')}</dt>
            <dd className="min-w-0 truncate">{user.name ?? ''}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-muted-foreground">{t('signIn.email')}</dt>
            <dd className="min-w-0 truncate">{user.email}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 text-muted-foreground">{t('signInContinue.userId')}</dt>
            <dd className="min-w-0 truncate">{user.id}</dd>
          </div>
        </dl>
        <Button variant="outline" className="w-full" disabled={signingOut || deleting} onClick={() => void handleSignOut()}>
          {signingOut ? t('settings.signingOut') : t('settings.signOut')}
        </Button>
        <Button variant="destructive" className="w-full" disabled={signingOut || deleting} onClick={() => setDeleteDialogOpen(true)}>
          {deleting ? t('dangerZone.deleting') : t('dangerZone.deleteAccount')}
        </Button>
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title={t('dangerZone.deleteAccount')}
          description={t('signInContinue.deleteConfirm')}
          confirmLabel={t('dangerZone.delete')}
          cancelLabel={t('dangerZone.cancel')}
          onConfirm={() => void handleDeleteAccount()}
        />
      </CardContent>
    </Container>
  );
}
