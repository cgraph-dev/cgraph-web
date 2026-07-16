import { ArrowRight, LoaderCircle } from 'lucide-react';
import { AvatarUploadCropper } from '@/components/avatar/avatar-upload-cropper';
import { useOnboarding } from './useOnboarding';

export default function Onboarding() {
  const { user, displayName, isLoading, error, setDisplayName, handleAvatarCropped, submit } =
    useOnboarding();

  return (
    <div className="flex min-h-full w-full flex-1 items-center justify-center overflow-y-auto bg-[var(--token-bg-primary)] px-5 py-10 sm:px-8">
      <div className="w-full max-w-lg">
        <header className="mb-9">
          <p className="mb-3 text-sm font-semibold text-primary-300">Profile setup</p>
          <h1 className="text-3xl font-semibold text-[var(--token-text-primary)] sm:text-4xl">
            Choose how people see you
          </h1>
          <p className="mt-3 max-w-md text-base leading-7 text-[var(--token-text-secondary)]">
            Add your name now. A profile picture is optional and can be changed later.
          </p>
        </header>

        <form
          className="space-y-8"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <AvatarUploadCropper
            avatarUrl={user?.avatarUrl}
            displayName={displayName}
            disabled={isLoading}
            size="xlarge"
            label="Profile picture"
            helperText="Optional"
            saveLabel="Use picture"
            onAvatarCropped={handleAvatarCropped}
            className="items-start"
          />

          <div>
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <label
                htmlFor="onboarding-display-name"
                className="text-sm font-medium text-[var(--token-text-primary)]"
              >
                Display name
              </label>
              <span className="text-xs text-[var(--token-text-tertiary)]">
                {displayName.length}/100
              </span>
            </div>
            <input
              id="onboarding-display-name"
              name="displayName"
              type="text"
              autoComplete="name"
              autoFocus
              required
              maxLength={100}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={isLoading}
              className="h-12 w-full rounded-lg border border-white/15 bg-black/20 px-4 text-base text-[var(--token-text-primary)] outline-none transition-colors placeholder:text-[var(--token-text-tertiary)] focus:border-primary-400 focus:ring-2 focus:ring-primary-400/25 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Your name"
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isLoading || displayName.trim().length === 0}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 font-semibold text-white transition-colors hover:bg-primary-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--token-bg-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                Saving profile
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
