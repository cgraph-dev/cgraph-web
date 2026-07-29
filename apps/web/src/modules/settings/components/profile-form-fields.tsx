import { Save } from 'lucide-react';
import { Select as FieldSelect } from '@/components/ui/input';
import type { User } from '@/modules/auth/store/authStore.types';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  Input,
  Textarea,
} from '@/shared/components/ui';

interface ProfileFormFieldsProps {
  user: User | null;
  isSaving: boolean;
  saveError: string | null;
}

const PRONOUN_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'he/him', label: 'he/him' },
  { value: 'she/her', label: 'she/her' },
  { value: 'they/them', label: 'they/them' },
  { value: 'he/they', label: 'he/they' },
  { value: 'she/they', label: 'she/they' },
  { value: 'any', label: 'Any pronouns' },
  { value: 'ask', label: 'Ask me' },
] as const;

export function ProfileFormFields({ user, isSaving, saveError }: ProfileFormFieldsProps) {
  return (
    <div className="space-y-4">
      {saveError && (
        <Alert variant="error">
          <AlertTitle>Profile was not saved</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <Card padding="lg">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-[var(--token-text-primary)]">
            Profile information
          </h2>
          <p className="mt-1 text-sm text-[var(--token-text-muted)]">
            This information appears on your public profile.
          </p>
        </div>

        <div className="space-y-5">
          <Input
            id="profile-display-name"
            label="Display name"
            type="text"
            name="displayName"
            defaultValue={user?.displayName || ''}
            placeholder="How should we call you?"
            maxLength={50}
            disabled={isSaving}
            autoComplete="name"
          />
          <Textarea
            id="profile-bio"
            label="About me"
            name="bio"
            defaultValue={user?.bio || ''}
            placeholder="Tell others about yourself..."
            maxLength={300}
            rows={3}
            disabled={isSaving}
          />
          <FieldSelect
            id="profile-pronouns"
            label="Pronouns"
            name="pronouns"
            defaultValue={user?.pronouns || ''}
            options={PRONOUN_OPTIONS}
            disabled={isSaving}
          />
          <Input
            id="profile-email"
            label="Email"
            type="email"
            value={user?.email || ''}
            readOnly
            disabled
            autoComplete="email"
          />
        </div>
      </Card>

      <Button
        type="submit"
        isLoading={isSaving}
        leftIcon={<Save aria-hidden="true" />}
        className="w-full sm:w-auto"
      >
        Save changes
      </Button>
    </div>
  );
}
