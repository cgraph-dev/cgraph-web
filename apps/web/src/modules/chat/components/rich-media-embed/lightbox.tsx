/**
 * Lightbox Component - Fullscreen media viewer overlay
 */
import { motion, AnimatePresence } from 'motion/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { HapticFeedback } from '@/lib/animations/animation-engine';
import { FADE_IN } from '@/lib/animations/transitions';

interface LightboxMedia {
  url: string;
  type: 'image' | 'video';
}

interface LightboxProps {
  lightboxMedia: LightboxMedia | null;
  setLightboxMedia: (media: LightboxMedia | null) => void;
}

/**
 * Lightbox component.
 */
export default function Lightbox({ lightboxMedia, setLightboxMedia }: LightboxProps) {
  return (
    <AnimatePresence>
      {lightboxMedia && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          {...FADE_IN}
          exit={{ opacity: 0 }}
          onClick={() => {
            setLightboxMedia(null);
            HapticFeedback.light();
          }}
        >
          <motion.button
            className="bg-[var(--token-card-bg)/0.4]/80 absolute right-4 top-4 rounded-full p-2 text-white transition-colors hover:bg-[var(--token-card-bg)]"
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxMedia(null);
              HapticFeedback.light();
            }}
          >
            <XMarkIcon className="h-6 w-6" />
          </motion.button>

          <motion.div
            className="max-h-[90vh] w-full max-w-7xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxMedia.type === 'image' ? (
              <img
                src={lightboxMedia.url}
                alt="Full size"
                className="mx-auto max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
                loading="lazy"
              />
            ) : (
              <video
                src={lightboxMedia.url}
                controls
                autoPlay
                className="mx-auto max-h-[90vh] max-w-full rounded-lg shadow-2xl"
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
