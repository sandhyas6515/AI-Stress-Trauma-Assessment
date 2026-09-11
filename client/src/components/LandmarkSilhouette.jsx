import React from 'react';

export default function LandmarkSilhouette({ theme = 'dark' }) {
  const isDark = theme === 'dark';
  // Subtle tint matching screenshot
  const fillColor = isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.04)';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '80px',
        left: 0,
        right: 0,
        height: '140px',
        pointerEvents: 'none',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        opacity: 0.95,
        zIndex: 0
      }}
    >
      <svg
        viewBox="0 0 1200 160"
        preserveAspectRatio="none"
        width="100%"
        height="140px"
        fill={fillColor}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ground Line */}
        <rect x="0" y="152" width="1200" height="8" />

        {/* Left Monument (India Gate / Secretariat style) */}
        <path d="M 120 152 L 120 90 Q 155 70 190 90 L 190 152 Z" />
        <rect x="145" y="105" width="20" height="47" rx="10" fill={isDark ? '#000000' : '#f8fafc'} />
        <rect x="100" y="115" width="110" height="6" />

        {/* Central Left Parliament Colonnade */}
        <rect x="230" y="110" width="160" height="42" />
        {/* Pillars */}
        <line x1="245" y1="115" x2="245" y2="152" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="4" />
        <line x1="265" y1="115" x2="265" y2="152" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="4" />
        <line x1="285" y1="115" x2="285" y2="152" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="4" />
        <line x1="305" y1="115" x2="305" y2="152" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="4" />
        <line x1="325" y1="115" x2="325" y2="152" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="4" />
        <line x1="345" y1="115" x2="345" y2="152" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="4" />
        <line x1="365" y1="115" x2="365" y2="152" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="4" />

        {/* Small Dome Left */}
        <path d="M 290 110 Q 310 85 330 110 Z" />

        {/* Central Rashtrapati Bhavan Dome */}
        <rect x="520" y="112" width="160" height="40" />
        {/* Base drum */}
        <rect x="555" y="75" width="90" height="37" />
        {/* Central Dome */}
        <path d="M 550 75 Q 600 25 650 75 Z" />
        {/* Finial / Spire */}
        <rect x="598" y="15" width="4" height="15" />
        <circle cx="600" cy="14" r="3" />

        {/* Center Pillars */}
        <line x1="565" y1="80" x2="565" y2="112" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="3" />
        <line x1="580" y1="80" x2="580" y2="112" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="3" />
        <line x1="600" y1="80" x2="600" y2="112" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="3" />
        <line x1="620" y1="80" x2="620" y2="112" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="3" />
        <line x1="635" y1="80" x2="635" y2="112" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="3" />

        {/* Central Right Parliament Colonnade */}
        <rect x="800" y="105" width="180" height="47" />
        {/* Pillars */}
        <line x1="820" y1="110" x2="820" y2="152" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="4" />
        <line x1="840" y1="110" x2="840" y2="152" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="4" />
        <line x1="860" y1="110" x2="860" y2="152" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="4" />
        <line x1="880" y1="110" x2="880" y2="152" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="4" />
        <line x1="900" y1="110" x2="900" y2="152" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="4" />
        <line x1="920" y1="110" x2="920" y2="152" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="4" />
        <line x1="940" y1="110" x2="940" y2="152" stroke={isDark ? '#000000' : '#f8fafc'} strokeWidth="4" />

        {/* Right Dome */}
        <path d="M 870 105 Q 890 80 910 105 Z" />

        {/* Right Monument */}
        <path d="M 1020 152 L 1020 95 Q 1050 75 1080 95 L 1080 152 Z" />
        <rect x="1040" y="110" width="20" height="42" rx="10" fill={isDark ? '#000000' : '#f8fafc'} />
      </svg>
    </div>
  );
}
