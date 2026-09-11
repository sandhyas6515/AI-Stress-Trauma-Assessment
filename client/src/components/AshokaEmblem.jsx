import React from 'react';

export default function AshokaEmblem({ size = 42, theme = 'dark' }) {
  const isDark = theme === 'dark';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      {/* Official State Emblem of India (Wikimedia Commons: Emblem of India.svg) */}
      <img
        src="/emblem-of-india.svg"
        alt="Emblem of India - Government of India"
        style={{
          height: `${size * 1.3}px`,
          width: 'auto',
          maxHeight: '56px',
          objectFit: 'contain',
          filter: isDark ? 'brightness(0) invert(1)' : 'brightness(0)',
          transition: 'filter 0.25s ease',
          flexShrink: 0
        }}
      />

      <div style={{ lineHeight: '1.25' }}>
        <div style={{ 
          fontSize: '1.02rem', 
          fontWeight: '800', 
          color: isDark ? '#ffffff' : '#000000', 
          letterSpacing: '-0.01em',
          transition: 'color 0.25s ease'
        }}>
          Government of India
        </div>
        <div style={{ 
          fontSize: '0.74rem', 
          color: isDark ? '#a1a1aa' : '#52525b', 
          fontWeight: '600',
          letterSpacing: '0.01em',
          transition: 'color 0.25s ease'
        }}>
          Public Grievance Redressal System • NHAA
        </div>
      </div>
    </div>
  );
}
