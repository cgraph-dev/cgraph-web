import { useActionState, useState } from 'react';
import { AtSign } from 'lucide-react';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { http } from '@/lib/api-client';
import { createLogger } from '@/lib/logger';
import { useAuthStore } from '@/modules/auth/store';
import { getApiErrorMessage } from '@/modules/auth/store/authStore.utils';
import { Button, Card, Input, toast } from '@/shared/components/ui';
import type { SaveProfileState } from './account-settings.types';
import { AvatarSection } from './avatar-section';
import { ProfileFormFields } from './profile-form-fields';

const logger = createLogger('AccountSettings');

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function nullableFormString(formData: FormData, key: string): string | null {
  const value = getFormString(formData, key).trim();
  return value.length > 0 ? value : null;
}

function profileUpdatePayload(formData: FormData): {
  displayName: string | null;
  bio: string;
  pronouns: string | null;
  user: {
    display_name?: string;
    bio: string;
    pronouns?: string;
  };
} {
  const displayName = nullableFormString(formData, 'displayName');
  const bio = getFormString(formData, 'bio').trim();
  const pronouns = nullableFormString(formData, 'pronouns');
  const userPayload: { display_name?: string; bio: string; pronouns?: string } = { bio };

  if (displayName) userPayload.display_name = displayName;
  if (pronouns) userPayload.pronouns = pronouns;

  return { displayName, bio, pronouns, user: userPayload };
}

export function AccountSettings() {
  const { user, updateUser } = useAuthStore();
  const [username, setUsername] = useState(user?.username || '');
  const [isChangingUsername, setIsChangingUsername] = useState(false);

  const canChangeUsername = user?.canChangeUsername ?? true;
  const nextChangeDate = user?.usernameNextChangeAt
    ? new Date(user.usernameNextChangeAt).toLocaleDateString()
    : null;

  const [saveState, saveAction, isSaving] = useActionState(
    async (_previous: SaveProfileState, formData: FormData): Promise<SaveProfileState> => {
      const payload = profileUpdatePayload(formData);

      try {
        const response = await http.put('/api/v1/me', { user: payload.user });
        const updated = response.data.data ?? response.data.user ?? response.data;

        updateUser({
          displayName:
            updated.display_name ??
            updated.displayName ??
            payload.displayName ??
            user?.displayName ??
            user?.username ??
            '',
          bio: updated.bio ?? payload.bio,
          pronouns: updated.pronouns ?? payload.pronouns ?? '',
        });
        toast.success('Settings saved');
        HapticFeedback.success();
        return { error: null };
      } catch (error) {
        logger.error('Failed to save settings:', error);
        toast.error('Failed to save settings');
        return { error: 'Failed to save settings' };
      }
    },
    { error: null }
  );

  async function handleChangeUsername(): Promise<void> {
    if (!username.trim() || username === user?.username) return;

    setIsChangingUsername(true);
    try {
      const response = await http.put('/api/v1/me/username', { username });
      updateUser({
        username: response.data.data.username,
        canChangeUsername: false,
        usernameNextChangeAt: response.data.data.username_next_change_at,
      });
      toast.success('Username changed successfully');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to change username'));
    } finally {
      setIsChangingUsername(false);
    }
  }

  return (
    <div className="space-y-6">
      <AvatarSection user={user} />

      <Card padding="lg">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[var(--token-text-primary)]">Username</h2>
            <p className="mt-1 text-sm text-[var(--token-text-muted)]">
              Letters, numbers, and underscores only.
            </p>
          </div>
          {!canChangeUsername && nextChangeDate && (
            <span className="text-xs font-medium text-[var(--token-feedback-warning)]">
              Locked until {nextChangeDate}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="Public username"
            type="text"
            value={username}
            onChange={(event) =>
              setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
            }
            disabled={!canChangeUsername}
            placeholder={user?.username || 'Choose a username'}
            leftIcon={<AtSign aria-hidden="true" />}
            autoComplete="username"
            minLength={3}
          />
          {canChangeUsername && username !== user?.username && username.length >= 3 && (
            <Button
              variant="secondary"
              isLoading={isChangingUsername}
              className="shrink-0"
              onClick={() => {
                void handleChangeUsername();
                HapticFeedback.medium();
              }}
            >
              Change username
            </Button>
          )}
        </div>

        <p className="mt-3 text-xs text-[var(--token-text-muted)]">
          {canChangeUsername
            ? 'You can change your username once every 14 days.'
            : `You changed your username recently. Next change available on ${nextChangeDate}.`}
        </p>
      </Card>

      <form action={saveAction}>
        <ProfileFormFields
          user={user}
          isSaving={isSaving}
          saveError={saveState.error}
        />
      </form>
    </div>
  );
}

export default AccountSettings;
