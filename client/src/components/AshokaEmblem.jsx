import React from 'react';

export default function AshokaEmblem({ size = 38, theme = 'dark' }) {
  const isDark = theme === 'dark';
  const strokeColor = isDark ? '#ffffff' : '#0f172a';
  const subtextColor = isDark ? '#94a3b8' : '#475569';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Official Ashoka Lion Capital Emblem SVG */}
      <svg
        width={size}
        height={size * 1.3}
        viewBox="0 0 100 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Central Lion Head / Mane */}
        <path
          d="M50 12 C44 12, 38 16, 38 24 C38 28, 40 33, 44 36 C41 38, 38 42, 38 48 C38 54, 43 59, 50 60 C57 59, 62 54, 62 48 C62 42, 59 38, 56 36 C60 33, 62 28, 62 24 C62 16, 56 12, 50 12 Z"
          stroke={strokeColor}
          strokeWidth="3.5"
          fill="none"
          strokeLinejoin="round"
        />
        {/* Left Lion Head Contour */}
        <path
          d="M38 24 C32 20, 22 24, 22 34 C22 42, 28 47, 34 50 C36 53, 38 56, 40 59"
          stroke={strokeColor}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Right Lion Head Contour */}
        <path
          d="M62 24 C68 20, 78 24, 78 34 C78 42, 72 47, 66 50 C64 53, 62 56, 60 59"
          stroke={strokeColor}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Facial details (eyes, nose, whisker nodes) */}
        <circle cx="46" cy="30" r="1.5" fill={strokeColor} />
        <circle cx="54" cy="30" r="1.5" fill={strokeColor} />
        <path d="M48 35 L52 35 L50 38 Z" fill={strokeColor} />
        <path d="M45 42 Q50 45 55 42" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        
        {/* Abacus Platform */}
        <rect x="18" y="66" width="64" height="12" rx="2" stroke={strokeColor} strokeWidth="3" fill="none" />
        
        {/* Central Ashoka Chakra on Abacus */}
        <circle cx="50" cy="72" r="4.5" stroke={strokeColor} strokeWidth="2" fill="none" />
        <line x1="50" y1="67.5" x2="50" y2="76.5" stroke={strokeColor} strokeWidth="1.2" />
        <line x1="45.5" y1="72" x2="54.5" y2="72" stroke={strokeColor} strokeWidth="1.2" />
        <line x1="46.8" y1="68.8" x2="53.2" y2="75.2" stroke={strokeColor} strokeWidth="1.2" />
        <line x1="53.2" y1="68.8" x2="46.8" y2="75.2" stroke={strokeColor} strokeWidth="1.2" />

        {/* Flanking Galloping Horse (Left) & Bull (Right) simplified outlines */}
        <path d="M26 73 Q30 70 34 73" stroke={strokeColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M66 73 Q70 70 74 73" stroke={strokeColor} strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {/* Bell Base (Inverted Lotus) */}
        <path
          d="M26 84 C30 92, 70 92, 74 84"
          stroke={strokeColor}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <line x1="34" y1="84" x2="36" y2="90" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="84" x2="50" y2="91" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
        <line x1="66" y1="84" x2="64" y2="90" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />

        {/* Satyameva Jayate (सत्यमेव जयते) Inscription text */}
        <text
          x="50"
          y="108"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fontFamily="'Plus Jakarta Sans', sans-serif"
          fill={subtextColor}
          letterSpacing="0.05em"
        >
          सत्यमेव जयते
        </text>
      </svg>

      <div style={{ lineHeight: '1.2' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: isDark ? '#ffffff' : '#0f172a', letterSpacing: '-0.01em' }}>
          Government of India
        </div>
        <div style={{ fontSize: '0.74rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
          Public Grievance Redressal System
        </div>
      </div>
    </div>
  );
}
