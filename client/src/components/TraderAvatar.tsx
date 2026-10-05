import React, { useState } from 'react';
import { Broker } from '../../../shared/src/types.ts';
import { BrokerSymbol } from './BrokerSymbol.tsx';

interface TraderAvatarProps {
  username: string;
  avatarUrl?: string;
  broker?: Broker;
  symbol?: string;
  size?: number;
  showOnlineRing?: boolean;
  showBrokerBadge?: boolean;
  isChampion?: boolean;
}

// Curated high-resolution professional trader profile portraits (diverse, realistic global traders)
const TRADER_PORTRAIT_MAP: Record<string, string> = {
  // Top Champions & Featured Traders
  'FX_Sniper': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'GoldBug_JP': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'AlphaWave': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'ZenScalper': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'TokyoRider': 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  'ApexTrader_FX': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  'CryptoKing_99': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'ApexPredator': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  'OsakaTrader': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'NovaFX': 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80',
  'AlphaTrader': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  'Marcus_V': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
  'Sarah_FX': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'Hiroshi_K': 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
  'Elena_Scalps': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'David_Gold': 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&auto=format&fit=crop&q=80',
  'SwissVault': 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&auto=format&fit=crop&q=80',
  'RiskMaximus': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'LondonFX_James': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop&q=80',
  'Sofia_Quant': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'Alex_Scalps': 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
  'Viktor_Metals': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  'Kenshi_Tokyo': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'Liam_FX': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
};

// Global pool for any dynamic or connected username
const REAL_AVATAR_POOL = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&auto=format&fit=crop&q=80',
];

export const getTraderProfilePhoto = (username: string, customUrl?: string): string => {
  if (customUrl) return customUrl;
  if (TRADER_PORTRAIT_MAP[username]) return TRADER_PORTRAIT_MAP[username];

  // Hash username to deterministic realistic portrait from pool
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % REAL_AVATAR_POOL.length;
  return REAL_AVATAR_POOL[index];
};

export const TraderAvatar: React.FC<TraderAvatarProps> = ({
  username,
  avatarUrl,
  broker,
  size = 36,
  showOnlineRing = true,
  showBrokerBadge = false,
  isChampion = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const photoSrc = getTraderProfilePhoto(username, avatarUrl);

  const getInitials = (name: string) => {
    const parts = name.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className="trader-avatar-wrap"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        flexShrink: 0,
      }}
      title={username}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: size >= 48 ? '14px' : '10px',
          overflow: 'hidden',
          border: isChampion
            ? '2px solid #fbbf24'
            : '1.5px solid rgba(129, 216, 208, 0.25)',
          boxShadow: isChampion
            ? '0 0 16px rgba(251, 191, 36, 0.4), 0 2px 8px rgba(0,0,0,0.5)'
            : '0 2px 8px rgba(0,0,0,0.4)',
          background: 'linear-gradient(135deg, #09181d 0%, #122b33 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!imageError ? (
          <img
            src={photoSrc}
            alt={username}
            loading="lazy"
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: `${Math.max(10, Math.floor(size * 0.35))}px`,
              fontWeight: 800,
              color: 'var(--text-main)',
            }}
          >
            {getInitials(username)}
          </span>
        )}
      </div>

      {/* Online Activity Green/Tiffany Dot */}
      {showOnlineRing && (
        <span
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: `${Math.max(7, Math.floor(size * 0.24))}px`,
            height: `${Math.max(7, Math.floor(size * 0.24))}px`,
            borderRadius: '50%',
            backgroundColor: '#0abab5',
            border: '2px solid #060d11',
            boxShadow: '0 0 6px #0abab5',
            zIndex: 3,
          }}
        />
      )}

      {/* Optional Broker Mini Badge */}
      {showBrokerBadge && broker && (
        <div
          style={{
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            background: 'rgba(6, 13, 17, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '4px',
            padding: '1px 3px',
            zIndex: 4,
          }}
        >
          <BrokerSymbol broker={broker} size={10} />
        </div>
      )}
    </div>
  );
};
