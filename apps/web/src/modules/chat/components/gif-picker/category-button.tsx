import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { CategoryButtonProps } from './types';

/**
 */
/**
 * Category Button component.
 */
export function CategoryButton({ category, isActive, onClick }: CategoryButtonProps) {
  return (
    <motion.button
      whileHover={{ opacity: 0.9 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary-600 text-white'
          : 'bg-[var(--token-card-bg)/0.6] text-gray-400 hover:bg-[var(--token-card-bg)/0.8] hover:text-white'
      )}
    >
      {category.icon}
      <span>{category.name}</span>
    </motion.button>
  );
}
