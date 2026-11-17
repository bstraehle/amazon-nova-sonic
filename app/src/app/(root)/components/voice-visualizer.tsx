'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { AudioSource } from '../useSpeechToSpeech';

const BAR_COUNT = 24;
const MIN_SCALE = 0.08;

interface VoiceVisualizerProps {
  getAnalyser: (source: AudioSource) => AnalyserNode | null;
  source: AudioSource | null;
  className?: string;
}

export default function VoiceVisualizer({ getAnalyser, source, className }: VoiceVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef(source);

  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  useEffect(() => {
    const bars = Array.from(containerRef.current?.children ?? []) as HTMLElement[];
    const levels = bars.map(() => 0);
    const bands = Math.ceil(bars.length / 2);
    let samples = new Uint8Array(0);
    let frame = 0;

    const draw = () => {
      const analyser = sourceRef.current ? getAnalyser(sourceRef.current) : null;
      if (analyser) {
        if (samples.length !== analyser.fftSize) {
          samples = new Uint8Array(analyser.fftSize);
        }
        analyser.getByteTimeDomainData(samples);
      }
      const bandSize = Math.floor(samples.length / bands);

      bars.forEach((bar, i) => {
        const band = Math.floor(Math.abs(i - (bars.length - 1) / 2));
        let target = 0;
        if (analyser && bandSize > 0) {
          let sum = 0;
          for (let s = band * bandSize; s < (band + 1) * bandSize; s++) {
            const value = samples[s] / 128 - 1;
            sum += value * value;
          }
          const rms = Math.sqrt(sum / bandSize);
          target = Math.min(1, Math.sqrt(rms) * 1.8) * (1 - (0.5 * band) / bands);
        }
        levels[i] += (target - levels[i]) * (target > levels[i] ? 0.5 : 0.12);
        bar.style.transform = `scaleY(${Math.max(MIN_SCALE, levels[i]).toFixed(3)})`;
      });

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [getAnalyser]);

  return (
    <div ref={containerRef} className={cn('flex h-10 items-center gap-1', className)} aria-hidden="true">
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <span key={i} className="h-full w-1 rounded-full bg-current" style={{ transform: `scaleY(${MIN_SCALE})` }} />
      ))}
    </div>
  );
}
