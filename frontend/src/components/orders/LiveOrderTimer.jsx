import { useState, useEffect } from 'react';
import { FiClock } from 'react-icons/fi';

export const LiveOrderTimer = ({
  createdAt,
  estimatedPrepTime = 20,
  isFinished = false,
  className = '',
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => {
    if (!createdAt) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
  });

  useEffect(() => {
    if (isFinished || !createdAt) return;

    const timer = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)));
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt, isFinished]);

  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const isOverdue = mins >= estimatedPrepTime;
  const isUrgent = mins >= estimatedPrepTime + 5;

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  if (isUrgent) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse';
  } else if (isOverdue) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-300';
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-xs font-extrabold px-2 py-0.5 rounded-md border ${colorClasses} ${className}`}
      title={`Elapsed: ${mins}m ${secs}s (Target: ${estimatedPrepTime}m)`}
    >
      <FiClock className="w-3 h-3 shrink-0" />
      <span>{formattedTime}</span>
    </span>
  );
};

