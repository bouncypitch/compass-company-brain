'use client';

import { useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { BrainTalkClip } from '@app-starter/shared';

const fmt = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Plays one cited moment of the hackathon talk recording, from its start second. */
export const ClipPlayer = ({ clip }: { clip: BrainTalkClip }) => {
  const audio = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggle = (): void => {
    const el = audio.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      return;
    }
    el.currentTime = clip.startSec;
    void el.play();
  };

  return (
    <div className="flex items-start gap-2 rounded-md border border-fuchsia-300 bg-fuchsia-50 p-2 text-xs text-fuchsia-950">
      <button
        type="button"
        onClick={handleToggle}
        className="mt-0.5 rounded-full bg-fuchsia-600 p-1.5 text-white hover:bg-fuchsia-700"
        aria-label={isPlaying ? 'Pause talk clip' : `Play talk clip at ${fmt(clip.startSec)}`}
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </button>
      <div>
        <div className="font-semibold">Dave Nielsen, hackathon talk · {fmt(clip.startSec)}</div>
        <q className="italic">{clip.text.length > 220 ? `${clip.text.slice(0, 220)}…` : clip.text}</q>
      </div>
      <audio
        ref={audio}
        src="/talk.m4a"
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => {
          if (e.currentTarget.currentTime >= clip.endSec) e.currentTarget.pause();
        }}
      />
    </div>
  );
};
