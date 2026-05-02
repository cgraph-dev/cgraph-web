import { useEffect, useState, type ReactElement } from 'react';
import {
  usePhoneRegistrationStore,
  type PermissionState,
} from '@/modules/auth/store/registration-store';

interface PermissionRequestsProps {
  readonly onContinue: () => Promise<void>;
}

function statusText(state: PermissionState): string {
  switch (state) {
    case 'granted':
      return 'Enabled';
    case 'denied':
      return 'Denied';
    case 'unsupported':
      return 'Not supported on this browser';
    case 'skipped':
      return 'Skipped for now';
    default:
      return 'Optional';
  }
}

type PendingPermission = 'contacts' | 'notifications' | null;

/**
 * Permission requests step — prompts for contacts then notification permissions, both optional.
 */
export function PermissionRequests({ onContinue }: PermissionRequestsProps): ReactElement {
  const contactsPermission = usePhoneRegistrationStore((state) => state.contactsPermission);
  const notificationsPermission = usePhoneRegistrationStore(
    (state) => state.notificationsPermission
  );
  const refreshPermissionStates = usePhoneRegistrationStore(
    (state) => state.refreshPermissionStates
  );
  const requestContactsPermission = usePhoneRegistrationStore(
    (state) => state.requestContactsPermission
  );
  const skipContactsPermission = usePhoneRegistrationStore((state) => state.skipContactsPermission);
  const requestNotificationsPermission = usePhoneRegistrationStore(
    (state) => state.requestNotificationsPermission
  );
  const skipNotificationsPermission = usePhoneRegistrationStore(
    (state) => state.skipNotificationsPermission
  );
  const [isContinuing, setIsContinuing] = useState(false);

  const currentPermission: PendingPermission =
    contactsPermission === 'idle'
      ? 'contacts'
      : notificationsPermission === 'idle'
        ? 'notifications'
        : null;

  useEffect(() => {
    void refreshPermissionStates();
  }, [refreshPermissionStates]);

  const handleContinue = async () => {
    setIsContinuing(true);
    await onContinue();
    setIsContinuing(false);
  };

  const title = currentPermission === 'contacts' ? 'Find your contacts' : 'Enable notifications';
  const body =
    currentPermission === 'contacts'
      ? 'CGraph can use your contacts to help you find people you already know.'
      : 'Let CGraph alert you when new messages arrive, even after you close this tab.';
  const actionLabel = currentPermission === 'contacts' ? 'Allow contacts' : 'Allow notifications';
  const status =
    currentPermission === 'contacts' ? contactsPermission : notificationsPermission;

  const handleAllow = () => {
    if (currentPermission === 'contacts') {
      void requestContactsPermission();
      return;
    }

    if (currentPermission === 'notifications') {
      void requestNotificationsPermission();
    }
  };

  const handleSkip = () => {
    if (currentPermission === 'contacts') {
      skipContactsPermission();
      return;
    }

    if (currentPermission === 'notifications') {
      skipNotificationsPermission();
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-white">Choose your permissions</h2>
        <p className="text-sm text-white/60">
          These are optional and help CGraph work better on this browser.
        </p>
      </div>

      <div className="space-y-3">
        {currentPermission ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm text-white/55">{body}</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                {statusText(status)}
              </span>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleAllow}
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-2 text-sm font-semibold text-white"
              >
                {actionLabel}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:border-white/20 hover:text-white"
              >
                Skip for now
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-white">Opening CGraph</h3>
            <p className="mt-2 text-sm text-white/55">
              All registration steps are complete. You can change permissions later in browser
              settings.
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => void handleContinue()}
        disabled={isContinuing || currentPermission !== null}
        className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isContinuing ? 'Opening CGraph…' : 'Continue to CGraph'}
      </button>
    </div>
  );
}
