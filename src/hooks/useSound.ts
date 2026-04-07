import { useCallback } from 'react';

const SOUNDS = {
  correct: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  incorrect: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  submit: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  lose: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  key: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
};

export function useSound(enabled: boolean) {
  const playSound = useCallback((type: keyof typeof SOUNDS) => {
    if (!enabled) return;
    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.5;
    audio.play().catch(err => console.warn('Audio playback failed:', err));
  }, [enabled]);

  return { playSound };
}
