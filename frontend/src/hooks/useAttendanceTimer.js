import { useState, useEffect } from 'react';

/**
 * Custom hook for real-time workday attendance timer and shift progress.
 * Computes active shift duration, lunch break intervals, and overtime tracking.
 */
export function useAttendanceTimer(checkInTime, standardHours = 8.0) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [formattedDuration, setFormattedDuration] = useState('00h 00m 00s');
  const [progressPercent, setProgressPercent] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);

  useEffect(() => {
    if (!checkInTime) {
      setElapsedSeconds(0);
      setFormattedDuration('00h 00m 00s');
      setProgressPercent(0);
      setIsOvertime(false);
      return;
    }

    const calculateElapsed = () => {
      // Parse check-in time (e.g., "08:45 AM" or ISO string)
      const now = new Date();
      let startTime = new Date();

      if (typeof checkInTime === 'string' && checkInTime.includes(':')) {
        const [timePart, modifier] = checkInTime.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        startTime.setHours(hours, minutes, 0, 0);
      } else {
        startTime = new Date(checkInTime);
      }

      const diffSecs = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diffSecs);

      const hrs = Math.floor(diffSecs / 3600);
      const mins = Math.floor((diffSecs % 3600) / 60);
      const secs = diffSecs % 60;

      setFormattedDuration(
        `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`
      );

      const targetSecs = standardHours * 3600;
      const progress = Math.min(100, Math.round((diffSecs / targetSecs) * 100));
      setProgressPercent(progress);
      setIsOvertime(diffSecs > targetSecs);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [checkInTime, standardHours]);

  return {
    elapsedSeconds,
    formattedDuration,
    progressPercent,
    isOvertime,
  };
}
