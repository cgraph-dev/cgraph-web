/**
 * NotificationSoundSettings - Configure notification sounds
 * Different sounds for messages, mentions, calls, friend requests
 */

import { useState} from 'react';
import { motion } from 'motion/react';
import { entranceVariants, springs } from '@/lib/animation-presets';
import { SpeakerWaveIcon, PlayIcon } from '@heroicons/react/24/outline';
import { createLogger } from '@/lib/logger';
import { STORAGE_KEYS } from '@/lib/storage/namespaces';

const logger = createLogger('NotificationSoundSettings');

interface SoundCategory {
  key: string;
  label: string;
  description: string;
}

const CATEGORIES: SoundCategory[] = [
  { key: 'message', label: 'New Message', description: 'When you receive a new message' },
  { key: 'mention', label: 'Mention', description: 'When someone mentions you' },
  { key: 'call', label: 'Incoming Call', description: 'When you receive a call' },
  {
    key: 'friend_request',
    label: 'Friend Request',
    description: 'When someone sends you a friend request',
  },
  { key: 'join', label: 'User Joined', description: 'When someone joins a voice channel' },
];

const SOUNDS = [
  { id: 'default', name: 'Default' },
  { id: 'chime', name: 'Chime' },
  { id: 'bell', name: 'Bell' },
  { id: 'pop', name: 'Pop' },
  { id: 'ding', name: 'Ding' },
  { id: 'none', name: 'None (Silent)' },
];

export function NotificationSoundSettings() {
  const [selectedSounds, setSelectedSounds] = useState<Record<string, string>>({
    message: 'default',
    mention: 'default',
    call: 'default',
    friend_request: 'default',
    join: 'default',
  });
  const [volume, setVolume] = useState(70);

  function handleSoundChange(category: string, soundId: string) {
    setSelectedSounds((prev) => ({ ...prev, [category]: soundId }));
    // Persist to localStorage
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.notificationSounds) || '{}');
    settings[category] = soundId;
    localStorage.setItem(STORAGE_KEYS.notificationSounds, JSON.stringify(settings));
  }

  function handlePreview(_soundId: string) {
      // In a real implementation, play the audio file
      // For now, use Web Audio API to generate a simple beep
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.value = (volume / 100) * 0.3;
        osc.frequency.value = 800;
        osc.type = 'sine';
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch (error) {
        logger.warn('Audio context blocked or unavailable', error);
      }
    }

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        variants={entranceVariants.fadeUp}
        initial="initial"
        animate="animate"
        transition={springs.gentle}
        className="mb-6"
      >
        <div className="mb-2 flex items-center gap-3">
          <SpeakerWaveIcon className="h-6 w-6 text-primary-400" />
          <h2 className="text-xl font-bold text-white">Notification Sounds</h2>
        </div>
        <p className="text-sm text-white/40">Customize sounds for different notification types</p>
      </motion.div>

      {/* Volume slider */}
      <div className="aurora-social-panel mb-6 rounded-2xl p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-white">Volume</span>
          <span className="text-xs text-white/40">{volume}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full accent-primary-500"
        />
      </div>

      {/* Sound categories */}
      <div className="space-y-3">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="aurora-social-option flex items-center justify-between rounded-xl px-4 py-3">
            <div>
              <span className="text-sm font-medium text-white">{cat.label}</span>
              <p className="text-xs text-white/30">{cat.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedSounds[cat.key]}
                onChange={(e) => handleSoundChange(cat.key, e.target.value)}
                className="aurora-social-select rounded-xl px-3 py-1.5 text-sm text-white"
              >
                {SOUNDS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handlePreview(selectedSounds[cat.key] ?? '')}
                className="rounded-lg p-1.5 text-white/30 hover:bg-white/10 hover:text-white"
                title="Preview"
              >
                <PlayIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
