'use client';

import { memo, useState, useEffect } from 'react';

interface TimerDisplayProps {
  isActive: boolean;
  sessionStartTime: number | null;
}

const TimerDisplay = memo(function TimerDisplay({ isActive, sessionStartTime }: TimerDisplayProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isActive && !sessionStartTime) {
      setElapsedTime(0);
    } else if (!isActive && sessionStartTime) {
      setElapsedTime(0);
    }
  }, [isActive, sessionStartTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && sessionStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, sessionStartTime]);

  return (
    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
      {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
    </span>
  );
});

export default TimerDisplay;
