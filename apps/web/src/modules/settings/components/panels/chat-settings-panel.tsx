/**
 * Global chat settings panel.
 *
 * Routes to the existing CGraph owners for global chat appearance and
 * server-owned conversation Spaces. It deliberately does not duplicate
 * per-conversation notification settings or introduce unowned preferences.
 */
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChatBubbleLeftRightIcon, FolderIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
import { GlassCard } from '@/shared/components/ui';
import { Button } from '@/components/ui/button';
import { FADE_UP } from '@/lib/animations/transitions';

interface ChatSettingsDestination {
  readonly title: string;
  readonly description: string;
  readonly action: string;
  readonly destination: string;
  readonly icon: typeof PaintBrushIcon;
}

const CHAT_SETTINGS_DESTINATIONS: readonly ChatSettingsDestination[] = [
  {
    title: 'Chat appearance',
    description: 'Themes, colors, wallpaper, and message bubbles',
    action: 'Open appearance',
    destination: '/me/appearance/bubbles',
    icon: PaintBrushIcon,
  },
  {
    title: 'Spaces',
    description: 'Organize conversations with saved folders and filters',
    action: 'Manage Spaces',
    destination: '/spaces',
    icon: FolderIcon,
  },
];

/** Global chat settings panel. */
export function ChatSettingsPanel(): ReactNode {
  const navigate = useNavigate();

  return (
    <motion.div {...FADE_UP} className="space-y-6">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--product-line)] bg-[var(--product-surface-recessed)]">
          <ChatBubbleLeftRightIcon className="h-5 w-5 text-[var(--token-interactive-primary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--token-text-primary)]">Chats</h1>
          <p className="text-sm text-[var(--token-text-secondary)]">
            Appearance and conversation organization
          </p>
        </div>
      </header>

      <div className="space-y-3">
        {CHAT_SETTINGS_DESTINATIONS.map((item) => {
          const Icon = item.icon;

          return (
            <GlassCard key={item.destination} variant="frosted" className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--token-bg-secondary)] text-[var(--token-interactive-primary)]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-[var(--token-text-primary)]">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--token-text-muted)]">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  animated={false}
                  onClick={() => navigate(item.destination)}
                  className="w-full shrink-0 sm:w-auto"
                >
                  {item.action}
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </motion.div>
  );
}

export default ChatSettingsPanel;
