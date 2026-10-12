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
    <div className="flex items-start gap-3 rounded-2xl border border-fuchsia-500/10 bg-gradient-to-br from-fuchsia-50/80 to-violet-50/50 p-3 text-[12px] text-neutral-700">
      <button
        type="button"
        onClick={handleToggle}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm transition hover:scale-105 hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400 motion-reduce:transition-none"
        aria-label={isPlaying ? 'Pause talk clip' : `Play talk clip at ${fmt(clip.startSec)}`}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5" />}
      </button>
      <div className="min-w-0 space-y-0.5">
        <div className="font-semibold text-neutral-900">
          Hackathon keynote <span className="font-normal tabular-nums text-fuchsia-600">· {fmt(clip.startSec)}</span>
        </div>
        <q className="leading-relaxed text-neutral-600">{clip.text.length > 220 ? `${clip.text.slice(0, 220)}…` : clip.text}</q>
      </div>
      <audio
        ref={audio}
        src="/talk.mp3"
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
