
import { motion } from 'motion/react';
import { NavLink } from 'react-router-dom';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import type { ServerIconProps } from './types';
import { tweens, springs } from '@/lib/animation-presets';
import { getGroupRoute } from '@/modules/groups/routing';

export function ServerIcon({ group, isActive }: ServerIconProps) {
  return (
    <NavLink
      to={getGroupRoute(group)}
      onClick={() => HapticFeedback.medium()}
      className="group relative"
    >
      {/* Active indicator */}
      <motion.div
        className="absolute left-0 top-1/2 w-1 -translate-x-1 -translate-y-1/2 rounded-r-full bg-primary-400 shadow-[0_0_10px_color-mix(in_srgb,var(--color-brand-purple)_40%,transparent)]"
        animate={{
          height: isActive ? 40 : 0,
        }}
        whileHover={{
          height: isActive ? 40 : 20,
        }}
        style={{
          boxShadow: isActive
            ? '0 0 10px color-mix(in srgb, var(--color-brand-purple) 40%, transparent)'
            : 'none',
        }}
        transition={springs.bouncy}
      />

      {/* Icon */}
      <motion.div className="relative">
        <div
          className={`relative z-10 flex h-12 w-12 items-center justify-center overflow-hidden transition-all duration-300 ${
            isActive
              ? 'rounded-xl bg-gradient-to-br from-primary-600 to-violet-600'
              : 'group-hover:bg-primary-600/20 group-hover:border-primary-500/30 rounded-xl border border-[var(--token-border-muted)] bg-[var(--token-card-bg)/0.6]'
          }`}
          style={{
            boxShadow: isActive
              ? '0 4px 15px color-mix(in srgb, var(--color-brand-purple) 40%, transparent)'
              : '0 4px 15px rgba(0, 0, 0, 0.3)',
          }}
        >
          {group.iconUrl ? (
            <img
              src={group.iconUrl}
              alt={group.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-lg font-bold text-white">
              {group.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {/* Hover glow */}
        <motion.div
          className="bg-primary-600/20 pointer-events-none absolute inset-0 rounded-xl opacity-0 blur-lg group-hover:opacity-100"
          transition={tweens.standard}
        />
      </motion.div>
    </NavLink>
  );
}
