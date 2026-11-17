import { useEffect, useState } from 'react';
import type { AudioSource } from './index';

const POLL_INTERVAL_MS = 100;
const SOURCES: AudioSource[] = ['input', 'output'];
const THRESHOLD: Record<AudioSource, number> = { input: 0.025, output: 0.005 };
const HOLD_MS: Record<AudioSource, number> = { input: 300, output: 700 };
const IDLE = { input: false, output: false };

const getRms = (analyser: AnalyserNode) => {
  const samples = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(samples);
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const value = samples[i] / 128 - 1;
    sum += value * value;
  }
  return Math.sqrt(sum / samples.length);
};

export const useVoiceActivity = (getAnalyser: (source: AudioSource) => AnalyserNode | null, enabled: boolean) => {
  const [activity, setActivity] = useState(IDLE);

  useEffect(() => {
    if (!enabled) return;

    const lastActiveAt: Record<AudioSource, number> = { input: -Infinity, output: -Infinity };
    const interval = setInterval(() => {
      const now = performance.now();
      for (const source of SOURCES) {
        const analyser = getAnalyser(source);
        if (analyser && getRms(analyser) > THRESHOLD[source]) {
          lastActiveAt[source] = now;
        }
      }
      const input = now - lastActiveAt.input < HOLD_MS.input;
      const output = now - lastActiveAt.output < HOLD_MS.output;
      setActivity((prev) => (prev.input === input && prev.output === output ? prev : { input, output }));
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      setActivity(IDLE);
    };
  }, [enabled, getAnalyser]);

  return activity;
};
