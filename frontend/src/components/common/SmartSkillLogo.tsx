import React from 'react';

interface SmartSkillLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export const SmartSkillLogo: React.FC<SmartSkillLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  textClassName = '',
}) => {
  // Dimensions based on size
  const sizeMap = {
    sm: { box: 'w-8 h-8', svg: 32 },
    md: { box: 'w-10 h-10', svg: 40 },
    lg: { box: 'w-12 h-12', svg: 48 },
    xl: { box: 'w-16 h-16', svg: 64 },
  };

  const { box, svg } = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Visual Logo Emblem */}
      <div className={`relative ${box} flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#06162B] via-[#0B2545] to-[#113A6E] p-1 shadow-md border border-blue-400/30 overflow-hidden group`}>
        {/* Subtle Ambient Radial Glow inside Emblem */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-amber-500/10 to-teal-400/20 pointer-events-none" />

        <svg
          width={svg}
          height={svg}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 transform group-hover:scale-105 transition-transform duration-300"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="ss-saffron" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>

            <linearGradient id="ss-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>

            <linearGradient id="ss-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            <filter id="ss-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Protective Geometric Hex Shield / MoSPI Anchor */}
          <path
            d="M24 4L39 12.5V27.5L24 44L9 27.5V12.5L24 4Z"
            stroke="url(#ss-blue)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="none"
            opacity="0.4"
          />

          {/* Upward Statistical Bar Vector 1 (Foundation) */}
          <rect x="13" y="27" width="4.5" height="7" rx="1.5" fill="url(#ss-blue)" opacity="0.85" />
          
          {/* Upward Statistical Bar Vector 2 (Intermediate) */}
          <rect x="20" y="22" width="4.5" height="12" rx="1.5" fill="url(#ss-blue)" opacity="0.95" />

          {/* Upward Statistical Bar Vector 3 (Mastery / Peak) */}
          <rect x="27" y="17" width="4.5" height="17" rx="1.5" fill="url(#ss-saffron)" />

          {/* AI Neural Pathways & Synthesizer Trendline */}
          <path
            d="M15 25L22 19L29 14L35 9"
            stroke="url(#ss-saffron)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#ss-glow)"
          />

          {/* Neural Synapse Nodes (AI Data Interconnects) */}
          <circle cx="15" cy="25" r="2.2" fill="#60A5FA" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="22" cy="19" r="2.2" fill="#93C5FD" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="29" cy="14" r="2.5" fill="#FBBF24" stroke="#FFFFFF" strokeWidth="1" />
          <circle cx="35" cy="9" r="2.8" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.2" />

          {/* Central AI Spark Core */}
          <path
            d="M24 10L25.2 13.8L29 15L25.2 16.2L24 20L22.8 16.2L19 15L22.8 13.8L24 10Z"
            fill="#FFFFFF"
            opacity="0.95"
          />

          {/* Base Gov Verification Indicator Dot */}
          <circle cx="24" cy="40" r="1.5" fill="url(#ss-emerald)" />
        </svg>

        {/* Live Accredited Pulse Indicator at bottom-right */}
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#06162B] rounded-full shadow-2xs"></span>
      </div>

      {/* Optional Side Text */}
      {showText && (
        <div className={`flex flex-col ${textClassName}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg sm:text-xl font-black text-white tracking-tight font-sans">
              SmartSkill<span className="text-amber-400">AI</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-blue-500/25 text-blue-200 border border-blue-400/30">
              MoSPI
            </span>
          </div>
          <span className="text-xs text-slate-300 font-medium tracking-tight">
            Official Statistics Micro-Learning & Competency Engine
          </span>
        </div>
      )}
    </div>
  );
};
