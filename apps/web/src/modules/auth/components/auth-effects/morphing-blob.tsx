/**
 * Auth page morphing blob animation.
 */
import { memo } from 'react';
import { motion } from 'motion/react';
import { prefersReducedMotion, DEFAULT_COLOR, DEFAULT_BLOB_SIZE, BLOB_PATHS } from './constants';
import type { MorphingBlobProps } from './types';

export const MorphingBlob = memo(function MorphingBlob({
  color = DEFAULT_COLOR,
  size = DEFAULT_BLOB_SIZE,
  className = '',
}: MorphingBlobProps) {
  if (prefersReducedMotion()) {
    return (
      <svg
        className={`absolute ${className}`}
        width={size}
        height={size}
        viewBox="-100 -100 200 200"
        style={{ filter: `drop-shadow(0 0 40px ${color}40)` }}
      >
        <path d={BLOB_PATHS[0]} fill={`${color}15`} />
      </svg>
    );
  }

  return (
    <motion.svg
      className={`absolute ${className}`}
      width={size}
      height={size}
      viewBox="-100 -100 200 200"
      style={{ filter: `drop-shadow(0 0 40px ${color}40)` }}
      animate={{
        scale: [1, 1.1, 1],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 30,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <path d={BLOB_PATHS[0]} fill={`${color}15`} />
    </motion.svg>
  );
});

export default MorphingBlob;
