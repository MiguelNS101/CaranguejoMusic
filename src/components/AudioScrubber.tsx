import React, { useState, useRef, useEffect } from 'react';

interface AudioScrubberProps {
  currentTime: number;
  duration: number;
  fallbackDuration?: number;
  onSeek: (seconds: number) => void;
  formatTime: (seconds: number) => string;
  size?: 'sm' | 'md';
  className?: string;
}

export const AudioScrubber: React.FC<AudioScrubberProps> = ({
  currentTime,
  duration,
  fallbackDuration = 0,
  onSeek,
  formatTime,
  size = 'md',
  className = ''
}) => {
  // Use duration if valid, otherwise fallback
  const rawDuration = duration > 0 ? duration : (fallbackDuration > 0 ? fallbackDuration : 0);
  const effectiveDuration = Math.max(0, isFinite(rawDuration) ? rawDuration : 0);

  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState<number>(0);
  const [optimisticTime, setOptimisticTime] = useState<number | null>(null);
  const optTimerRef = useRef<any>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (optimisticTime !== null) {
      if (Math.abs(currentTime - optimisticTime) < 1.5) {
        setOptimisticTime(null);
      }
    }
  }, [currentTime, optimisticTime]);

  // Sync scrub value when dragging or right after seek
  const displayTime = isScrubbing
    ? scrubValue
    : (optimisticTime !== null ? optimisticTime : currentTime);

  const progressPercent = effectiveDuration > 0
    ? Math.min(100, Math.max(0, (displayTime / effectiveDuration) * 100))
    : 0;

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      setScrubValue(val);
      setIsScrubbing(true);
    }
  };

  const handleCommitSeek = (val?: number) => {
    const targetTime = typeof val === 'number' && !isNaN(val) ? val : scrubValue;
    setIsScrubbing(false);
    if (!isNaN(targetTime) && effectiveDuration > 0) {
      const clamped = Math.max(0, Math.min(effectiveDuration, targetTime));
      setOptimisticTime(clamped);
      if (optTimerRef.current) clearTimeout(optTimerRef.current);
      optTimerRef.current = setTimeout(() => {
        setOptimisticTime(null);
      }, 1200);
      onSeek(clamped);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || effectiveDuration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setHoverPos(ratio * 100);
    setHoverTime(ratio * effectiveDuration);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
  };

  return (
    <div
      className={`w-full flex items-center gap-2 font-mono ${size === 'sm' ? 'text-[11px]' : 'text-xs'} text-[#9E9E9E] ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Current Elapsed Time */}
      <span className={size === 'sm' ? 'w-9 text-right font-medium text-[#B0B8C4]' : 'w-10 text-right font-medium text-[#B0B8C4]'}>
        {formatTime(displayTime)}
      </span>

      {/* Interactive Progress Track Container */}
      <div ref={trackRef} className="relative flex-1 py-2 group select-none flex items-center">
        {/* Hover Tooltip */}
        {hoverTime !== null && effectiveDuration > 0 && (
          <div
            className="absolute -top-6 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#141619] border border-[#3D424D] text-[10px] font-mono text-[#E0E0E0] shadow-md pointer-events-none z-20 whitespace-nowrap"
            style={{ left: `${hoverPos}%` }}
          >
            {formatTime(hoverTime)}
          </div>
        )}

        {/* Visual Background Track */}
        <div className={`w-full ${size === 'sm' ? 'h-1.5' : 'h-2'} bg-[#22262B] group-hover:bg-[#282D34] rounded-full overflow-hidden transition-colors border border-[#2D3139] pointer-events-none`}>
          {/* Filled Progress Gradient Bar */}
          <div
            className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 rounded-full transition-all duration-75"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Playhead Knob */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-500 shadow-md pointer-events-none transition-transform duration-75 z-10 ${
            isScrubbing ? 'scale-125 ring-2 ring-indigo-400/50' : 'scale-0 group-hover:scale-100'
          }`}
          style={{ left: `${progressPercent}%` }}
        />

        {/* Native Input Range Overlay for 100% Reliable Seeking & Scrubbing */}
        <input
          type="range"
          min="0"
          max={effectiveDuration > 0 ? effectiveDuration : 100}
          step="0.1"
          disabled={effectiveDuration <= 0}
          value={displayTime}
          onChange={handleRangeChange}
          onMouseDown={() => setIsScrubbing(true)}
          onTouchStart={() => setIsScrubbing(true)}
          onMouseUp={(e) => handleCommitSeek(parseFloat((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => handleCommitSeek(parseFloat((e.target as HTMLInputElement).value))}
          onKeyUp={(e) => handleCommitSeek(parseFloat((e.target as HTMLInputElement).value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
          title="Clique ou arraste para avançar/retroceder"
        />
      </div>

      {/* Total Duration */}
      <span className={size === 'sm' ? 'w-9 text-left font-medium' : 'w-10 text-left font-medium'}>
        {formatTime(effectiveDuration)}
      </span>
    </div>
  );
};

