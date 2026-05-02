/**
 * User Profile Card Component
 *
 * Profile popup with hover and click triggers:
 * - Mini variant: Compact card shown on hover (320px)
 * - Full variant: Detailed card shown on click (360px)
 *
 * External API is unchanged — all consumers (<UserProfileCard userId={...} trigger="both">)
 * continue to work without modification.
 */

import { useState, useRef, useEffect} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { NewProfileCard } from './new-profile-card';
import { useProfileCardNavigation } from './hooks';
import { HOVER_DELAY_MS, DEFAULT_PLACEHOLDER_USER } from './constants';
import type { UserProfileCardProps, CardPosition, ProfileCardUser } from './types';
import { springs } from '@/lib/animation-presets';
import { FADE_IN } from '@/lib/animations/transitions';
import { useFriendStore } from '@/modules/social/store';

/** Profile popup card with hover (mini) and click (full) variants. */
export default function UserProfileCard({
  userId,
  user,
  variant = 'mini',
  trigger = 'click',
  onClose,
  children,
  className = '',
}: UserProfileCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [cardVariant, setCardVariant] = useState<'mini' | 'full'>(variant);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CardPosition>({ top: 0, left: 0 });

  const { handleViewProfile, handleMessage } = useProfileCardNavigation(userId);
  const { sendRequest } = useFriendStore();

  async function handleAddFriend() {
    if (userId) await sendRequest(userId);
  }

  // Calculate card position relative to trigger element
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const cardWidth = cardVariant === 'full' ? 360 : 320;
      const cardHeight = cardVariant === 'full' ? 480 : 280;

      // Anchor below trigger, centered horizontally on trigger
      let top = rect.bottom + 8;
      let left = rect.left + rect.width / 2;

      // If card would overflow bottom, show above trigger instead
      if (top + cardHeight > window.innerHeight - 16) {
        top = rect.top - cardHeight - 8;
      }
      // If card would overflow top (unlikely), clamp to viewport
      if (top < 16) top = 16;

      // Clamp horizontal so card stays on-screen
      const halfCard = cardWidth / 2;
      if (left - halfCard < 16) left = halfCard + 16;
      if (left + halfCard > window.innerWidth - 16) left = window.innerWidth - halfCard - 16;

      setPosition({ top, left });
    }
  }, [isOpen, cardVariant]);

  const handleMouseEnter = () => {
    if ((trigger === 'hover' || trigger === 'both') && variant === 'mini') {
      hoverTimeout.current = setTimeout(() => {
        setCardVariant('mini');
        setIsOpen(true);
      }, HOVER_DELAY_MS);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    if (cardVariant === 'mini' && (trigger === 'hover' || trigger === 'both')) {
      setIsOpen(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click' || trigger === 'both') {
      setCardVariant('full');
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const profileUser: ProfileCardUser = user || {
    ...DEFAULT_PLACEHOLDER_USER,
    id: userId,
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={className}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {isOpen &&
        createPortal(
          <>
            {/* Backdrop for full variant only */}
            {cardVariant === 'full' && (
              <motion.div
                {...FADE_IN}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            )}

            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={springs.stiff}
                className="pointer-events-auto fixed z-50"
                style={{
                  top: position.top,
                  left: position.left,
                  transform: 'translateX(-50%)',
                }}
                onMouseEnter={cardVariant === 'mini' ? handleMouseEnter : undefined}
                onMouseLeave={cardVariant === 'mini' ? handleMouseLeave : undefined}
              >
                {cardVariant === 'mini' ? (
                  <NewProfileCard
                    user={profileUser}
                    variant="mini"
                    mode="popout"
                    onMessage={handleMessage}
                    onViewProfile={handleViewProfile}
                    onAddFriend={handleAddFriend}
                    className="w-[320px]"
                  />
                ) : (
                  <NewProfileCard
                    user={profileUser}
                    variant="full"
                    mode="popout"
                    onMessage={handleMessage}
                    onViewProfile={handleViewProfile}
                    onAddFriend={handleAddFriend}
                    onClose={handleClose}
                    className="w-[360px]"
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </>,
          document.body
        )}
    </>
  );
}
