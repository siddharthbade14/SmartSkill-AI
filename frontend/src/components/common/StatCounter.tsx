import React, { useEffect, useRef, useState } from 'react';

interface StatCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number; // ms
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  color: 'blue' | 'amber' | 'emerald' | 'purple' | 'teal';
}

const COLOR_MAP = {
  blue:    { bg: 'from-blue-50 to-blue-100/60',    border: 'border-blue-200',    icon: 'bg-blue-100 border-blue-300 text-blue-700',   num: 'text-blue-900',   glow: 'shadow-blue-200/60'   },
  amber:   { bg: 'from-amber-50 to-amber-100/60',  border: 'border-amber-200',   icon: 'bg-amber-100 border-amber-300 text-amber-700', num: 'text-amber-900',  glow: 'shadow-amber-200/60'  },
  emerald: { bg: 'from-emerald-50 to-emerald-100/60', border: 'border-emerald-200', icon: 'bg-emerald-100 border-emerald-300 text-emerald-700', num: 'text-emerald-900', glow: 'shadow-emerald-200/60' },
  purple:  { bg: 'from-purple-50 to-purple-100/60', border: 'border-purple-200', icon: 'bg-purple-100 border-purple-300 text-purple-700', num: 'text-purple-900', glow: 'shadow-purple-200/60' },
  teal:    { bg: 'from-teal-50 to-teal-100/60',    border: 'border-teal-200',    icon: 'bg-teal-100 border-teal-300 text-teal-700',   num: 'text-teal-900',   glow: 'shadow-teal-200/60'   },
};

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export const StatCounter: React.FC<StatCounterProps> = ({
  end, suffix = '', prefix = '', duration = 1800, label, sublabel, icon, color,
}) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const c = COLOR_MAP[color];

  // Intersection Observer — start counting when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  // RAF-based counter
  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    let frame: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(easeOutQuart(progress) * end));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [started, end, duration]);

  return (
    <div
      ref={ref}
      className={`card-hover bg-gradient-to-br ${c.bg} rounded-2xl border ${c.border} p-6 flex flex-col items-center text-center gap-3 shadow-lg ${c.glow}`}
    >
      <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${c.icon} shadow-sm`}>
        {icon}
      </div>
      <div>
        <div className={`text-3xl sm:text-4xl font-black tabular-nums tracking-tight ${c.num}`}>
          {prefix}{count.toLocaleString('en-IN')}{suffix}
        </div>
        <div className="text-sm font-bold text-slate-700 mt-1">{label}</div>
        {sublabel && <div className="text-xs text-slate-500 mt-0.5 font-medium">{sublabel}</div>}
      </div>
    </div>
  );
};
