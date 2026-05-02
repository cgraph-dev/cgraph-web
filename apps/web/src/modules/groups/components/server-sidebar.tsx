import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { MicrophoneIcon, SpeakerWaveIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';
import { MicrophoneIcon as MicOffIcon } from '@heroicons/react/24/outline';
import { ScrollArea } from '@/components/ui/scroll-area';
import Tooltip from '@/components/ui/tooltip';
import { ServerHeader } from './server-header';
import { ServerBanner } from './server-banner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/modules/auth/store';

interface ServerSidebarProps {
  className?: string;
  server?: {
    id: string;
    name: string;
    bannerUrl?: string;
  };
  user?: UserBarUser | null;
  children?: ReactNode;
}

interface UserBarUser {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
}

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  idle: 'bg-yellow-500',
  dnd: 'bg-red-500',
  offline: 'bg-gray-500',
};

function UserBar({ user }: { readonly user: UserBarUser }) {
  const isMuted = false;
  const isDeafened = false;

  return (
    <div className="flex items-center gap-2 border-t border-[var(--token-border-muted)] bg-[var(--token-bg-tertiary)] px-2 py-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="relative flex-shrink-0">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[var(--color-brand-purple)]">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-white">
                {user.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[2.5px] border-[#232428]',
              statusColors[user.status ?? 'offline']
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">{user.displayName}</p>
          <p className="truncate text-[10px] text-gray-400">{user.customStatus ?? user.username}</p>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <Tooltip content={isMuted ? 'Unmute' : 'Mute'} side="top">
          <motion.button
            whileTap={{ scale: 0.88 }}
            className="rounded p-1.5 hover:bg-[var(--token-card-bg)]"
          >
            {isMuted ? (
              <MicOffIcon className="h-4 w-4 text-red-400" />
            ) : (
              <MicrophoneIcon className="h-4 w-4 text-gray-400" />
            )}
          </motion.button>
        </Tooltip>

        <Tooltip content={isDeafened ? 'Undeafen' : 'Deafen'} side="top">
          <motion.button
            whileTap={{ scale: 0.88 }}
            className="rounded p-1.5 hover:bg-[var(--token-card-bg)]"
          >
            <SpeakerWaveIcon
              className={cn('h-4 w-4', isDeafened ? 'text-red-400' : 'text-gray-400')}
            />
          </motion.button>
        </Tooltip>

        <Tooltip content="User Settings" side="top">
          <motion.button
            whileTap={{ scale: 0.88 }}
            className="rounded p-1.5 hover:bg-[var(--token-card-bg)]"
          >
            <Cog6ToothIcon className="h-4 w-4 text-gray-400" />
          </motion.button>
        </Tooltip>
      </div>
    </div>
  );
}

function resolveUserBarUser(
  user: ReturnType<typeof useAuthStore.getState>['user']
): UserBarUser | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    displayName: user.displayName || user.username || 'CGraph user',
    username: user.username || user.uid,
    avatarUrl: user.avatarUrl ?? undefined,
    status: user.status,
    customStatus: user.statusMessage ?? undefined,
  };
}

export function ServerSidebar({
  className,
  server,
  user: userOverride,
  children,
}: ServerSidebarProps) {
  const authUser = useAuthStore((state) => state.user);
  const user = userOverride ?? resolveUserBarUser(authUser);
  const serverName = server?.name ?? 'CGraph';

  return (
    <div className={cn('flex h-full w-60 flex-col bg-[var(--token-card-bg)]', className)}>
      <ServerHeader serverName={serverName} />

      {server?.bannerUrl && <ServerBanner imageUrl={server.bannerUrl} />}

      <ScrollArea className="flex-1">
        <div className="py-2">{children}</div>
      </ScrollArea>

      {user && <UserBar user={user} />}
    </div>
  );
}

export default ServerSidebar;
