import React from 'react';

export type FeatureSymbolType =
  | 'overview'
  | 'ranking'
  | 'tournaments'
  | 'daily-analysis'
  | 'rewards'
  | 'dashboard'
  | 'weekly-sprint'
  | 'monthly-prop'
  | 'gold-rush'
  | 'daily-blitz';

interface FeatureSymbolProps {
  type: FeatureSymbolType;
  active?: boolean;
  size?: number;
}

export const FeatureSymbol: React.FC<FeatureSymbolProps> = ({
  type,
  active = false,
  size = 36,
}) => {
  const configs: Record<
    FeatureSymbolType,
    {
      bg: string;
      border: string;
      glow: string;
      svg: React.ReactNode;
    }
  > = {
    overview: {
      bg: active
        ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.28) 0%, rgba(0, 218, 198, 0.16) 100%)'
        : 'linear-gradient(135deg, rgba(0, 240, 255, 0.12) 0%, rgba(15, 23, 42, 0.8) 100%)',
      border: active ? 'rgba(0, 240, 255, 0.65)' : 'rgba(0, 240, 255, 0.22)',
      glow: active ? '0 0 16px rgba(0, 240, 255, 0.35)' : 'none',
      svg: (
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
          <polygon
            points="12 2 21 7 21 17 12 22 3 17 3 7"
            stroke="#00F0FF"
            strokeWidth="1.8"
            fill="rgba(0, 240, 255, 0.12)"
          />
          <polyline
            points="6.5 13.5 10 10 13 13 17.5 8"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="17.5" cy="8" r="2" fill="#00DAC6" />
        </svg>
      ),
    },
    ranking: {
      bg: active
        ? 'linear-gradient(135deg, rgba(240, 185, 11, 0.3) 0%, rgba(217, 119, 6, 0.16) 100%)'
        : 'linear-gradient(135deg, rgba(240, 185, 11, 0.14) 0%, rgba(15, 23, 42, 0.8) 100%)',
      border: active ? 'rgba(240, 185, 11, 0.7)' : 'rgba(240, 185, 11, 0.25)',
      glow: active ? '0 0 16px rgba(240, 185, 11, 0.35)' : 'none',
      svg: (
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
          <path
            d="M3 18H21V20H3V18ZM4 15L2.5 7L8 10.5L12 4L16 10.5L21.5 7L20 15H4Z"
            fill="rgba(240, 185, 11, 0.25)"
            stroke="#F0B90B"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="4" r="1.5" fill="#FFFFFF" />
        </svg>
      ),
    },
    tournaments: {
      bg: active
        ? 'linear-gradient(135deg, rgba(0, 218, 198, 0.3) 0%, rgba(16, 185, 129, 0.18) 100%)'
        : 'linear-gradient(135deg, rgba(0, 218, 198, 0.14) 0%, rgba(15, 23, 42, 0.8) 100%)',
      border: active ? 'rgba(0, 218, 198, 0.7)' : 'rgba(0, 218, 198, 0.25)',
      glow: active ? '0 0 16px rgba(0, 218, 198, 0.35)' : 'none',
      svg: (
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3L19 6V11.5C19 16.2 15.9 20.3 12 21.5C8.1 20.3 5 16.2 5 11.5V6L12 3Z"
            fill="rgba(0, 218, 198, 0.18)"
            stroke="#00DAC6"
            strokeWidth="1.8"
          />
          <path
            d="M9 9L15 15M15 9L9 15"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    'daily-analysis': {
      bg: active
        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.32) 0%, rgba(0, 240, 255, 0.18) 100%)'
        : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)',
      border: active ? 'rgba(167, 139, 250, 0.7)' : 'rgba(139, 92, 246, 0.28)',
      glow: active ? '0 0 16px rgba(139, 92, 246, 0.35)' : 'none',
      svg: (
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
          <polygon
            points="12 2 22 12 12 22 2 12"
            fill="rgba(139, 92, 246, 0.22)"
            stroke="#A78BFA"
            strokeWidth="1.8"
          />
          <circle cx="12" cy="12" r="3.2" fill="#00F0FF" />
        </svg>
      ),
    },
    rewards: {
      bg: active
        ? 'linear-gradient(135deg, rgba(246, 70, 93, 0.28) 0%, rgba(240, 185, 11, 0.18) 100%)'
        : 'linear-gradient(135deg, rgba(246, 70, 93, 0.14) 0%, rgba(15, 23, 42, 0.8) 100%)',
      border: active ? 'rgba(246, 70, 93, 0.65)' : 'rgba(246, 70, 93, 0.25)',
      glow: active ? '0 0 16px rgba(246, 70, 93, 0.3)' : 'none',
      svg: (
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
          <polygon
            points="12 2.5 14.9 8.4 21.4 9.3 16.7 13.9 17.8 20.4 12 17.3 6.2 20.4 7.3 13.9 2.6 9.3 9.1 8.4"
            fill="rgba(240, 185, 11, 0.24)"
            stroke="#F0B90B"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    dashboard: {
      bg: active
        ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.3) 0%, rgba(10, 186, 181, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(0, 240, 255, 0.16) 0%, rgba(10, 186, 181, 0.08) 100%)',
      border: 'rgba(0, 240, 255, 0.5)',
      glow: '0 0 14px rgba(0, 240, 255, 0.22)',
      svg: (
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="3"
            width="8"
            height="8"
            rx="2"
            fill="rgba(0, 240, 255, 0.25)"
            stroke="#00F0FF"
            strokeWidth="1.8"
          />
          <rect
            x="13"
            y="3"
            width="8"
            height="5"
            rx="1.5"
            stroke="#00DAC6"
            strokeWidth="1.8"
          />
          <rect
            x="13"
            y="10"
            width="8"
            height="11"
            rx="2"
            fill="rgba(0, 218, 198, 0.2)"
            stroke="#00DAC6"
            strokeWidth="1.8"
          />
          <rect
            x="3"
            y="13"
            width="8"
            height="8"
            rx="2"
            stroke="#00F0FF"
            strokeWidth="1.8"
          />
        </svg>
      ),
    },
    'weekly-sprint': {
      bg: active
        ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.28) 0%, rgba(10, 186, 181, 0.16) 100%)'
        : 'rgba(0, 240, 255, 0.1)',
      border: active ? 'rgba(0, 240, 255, 0.6)' : 'rgba(0, 240, 255, 0.25)',
      glow: active ? '0 0 18px rgba(0, 240, 255, 0.3)' : 'none',
      svg: (
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
          <path
            d="M13 2L4 14H12L11 22L20 10H12L13 2Z"
            fill="rgba(0, 240, 255, 0.28)"
            stroke="#00F0FF"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    'monthly-prop': {
      bg: active
        ? 'linear-gradient(135deg, rgba(240, 185, 11, 0.3) 0%, rgba(217, 119, 6, 0.16) 100%)'
        : 'rgba(240, 185, 11, 0.12)',
      border: active ? 'rgba(240, 185, 11, 0.65)' : 'rgba(240, 185, 11, 0.28)',
      glow: active ? '0 0 18px rgba(240, 185, 11, 0.3)' : 'none',
      svg: (
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
          <path
            d="M6 4H18V9C18 12.3 15.3 15 12 15C8.7 15 6 12.3 6 9V4Z"
            fill="rgba(240, 185, 11, 0.25)"
            stroke="#F0B90B"
            strokeWidth="1.8"
          />
          <path d="M12 15V19M8 20H16M6 6H3V9C3 10.7 4.3 12 6 12M18 6H21V9C21 10.7 19.7 12 18 12" stroke="#F0B90B" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    'gold-rush': {
      bg: active
        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(239, 68, 68, 0.18) 100%)'
        : 'rgba(245, 158, 11, 0.12)',
      border: active ? 'rgba(245, 158, 11, 0.65)' : 'rgba(245, 158, 11, 0.25)',
      glow: active ? '0 0 18px rgba(245, 158, 11, 0.3)' : 'none',
      svg: (
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
          <polygon
            points="12 3 20 9 17 20 7 20 4 9"
            fill="rgba(245, 158, 11, 0.25)"
            stroke="#F59E0B"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <polyline points="4 9 12 13 20 9" stroke="#FDE68A" strokeWidth="1.5" />
          <line x1="12" y1="13" x2="12" y2="20" stroke="#FDE68A" strokeWidth="1.5" />
        </svg>
      ),
    },
    'daily-blitz': {
      bg: active
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.28) 0%, rgba(245, 158, 11, 0.16) 100%)'
        : 'rgba(239, 68, 68, 0.1)',
      border: active ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.25)',
      glow: active ? '0 0 18px rgba(239, 68, 68, 0.3)' : 'none',
      svg: (
        <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="13" r="8" fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" strokeWidth="1.8" />
          <polyline points="12 9 12 13 15 15" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <line x1="9" y1="2" x2="15" y2="2" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
  };

  const c = configs[type] || configs.overview;

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: `${Math.round(size * 0.3)}px`,
        background: c.bg,
        border: `1px solid ${c.border}`,
        boxShadow: c.glow,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.2s ease',
      }}
    >
      {c.svg}
    </div>
  );
};

