import React, { useId } from 'react';

/**
 * TraderRank (FX) brand mark — Crown + Chart.
 * The crown's top edge doubles as a rising price line (higher highs, ending
 * in the tallest right-hand peak), with a candlestick-style base band.
 */
interface BrandMarkProps {
  size?: number;
  /** 'tile' = Tiffany gradient tile with white glyph; 'glyph' = Tiffany glyph only */
  variant?: 'tile' | 'glyph';
}

export const BrandMark: React.FC<BrandMarkProps> = ({ size = 40, variant = 'tile' }) => {
  const uid = useId().replace(/:/g, '');
  const bgId = `tr-bg-${uid}`;
  const glyphId = `tr-glyph-${uid}`;
  const isTile = variant === 'tile';
  const stroke = isTile ? '#ffffff' : `url(#${glyphId})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="TraderRank FX logo"
      className={isTile ? 'brand-mark brand-mark--tile' : 'brand-mark'}
    >
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a8e6e1" />
          <stop offset="45%" stopColor="#0abab5" />
          <stop offset="100%" stopColor="#067a76" />
        </linearGradient>
        <linearGradient id={glyphId} x1="6" y1="30" x2="34" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0abab5" />
          <stop offset="100%" stopColor="#a8e6e1" />
        </linearGradient>
      </defs>

      {isTile && (
        <>
          <rect x="0" y="0" width="40" height="40" rx="11" fill={`url(#${bgId})`} />
          <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="10.25" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
        </>
      )}

      {/* Crown body — top edge is an ascending chart line */}
      <path
        d="M8 27 V15.5 L13.5 21 L19.5 12.5 L24 18 L32 8.5 V27"
        stroke={stroke}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow tip on the final (highest) peak */}
      <path
        d="M27.6 8.6 H32 V13"
        stroke={stroke}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Crown band */}
      <path d="M7 31 H33" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
      {/* Jewels / data points on the peaks */}
      <circle cx="8" cy="15.5" r="1.9" fill={isTile ? '#ffffff' : '#0abab5'} />
      <circle cx="19.5" cy="12.5" r="1.9" fill={isTile ? '#ffffff' : '#81d8d0'} />
      {/* Mini candles inside the crown */}
      <rect x="13" y="23.5" width="2.4" height="3.5" rx="0.8" fill={isTile ? 'rgba(255,255,255,0.75)' : '#0abab5'} />
      <rect x="18.8" y="21.5" width="2.4" height="5.5" rx="0.8" fill={isTile ? 'rgba(255,255,255,0.85)' : '#46c9c3'} />
      <rect x="24.6" y="19.5" width="2.4" height="7.5" rx="0.8" fill={isTile ? '#ffffff' : '#81d8d0'} />
    </svg>
  );
};

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  /** Font size of the wordmark in px */
  textSize?: number;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 40, showWordmark = true, textSize = 22, onClick }) => (
  <div
    className="brand-logo"
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : undefined }}
  >
    <BrandMark size={size} />
    {showWordmark && (
      <span className="brand-wordmark" style={{ fontSize: `${textSize}px` }}>
        Trader<span className="brand-wordmark-accent">Rank</span>
        <span className="brand-fx-pill">FX</span>
      </span>
    )}
  </div>
);
