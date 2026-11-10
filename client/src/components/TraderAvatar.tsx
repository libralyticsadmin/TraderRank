import React, { useState } from 'react';
import { Broker } from '../../../shared/src/types.ts';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import {
  AnimalAvatarPreset,
  INSTITUTIONAL_ANIMAL_PRESETS,
  getRandomTraderAvatar,
  shuffleAvatarPresets,
  filterAvatarPresets,
  AVATAR_CATEGORIES,
} from './avatarCatalog.ts';

export type { AnimalAvatarPreset };
export {
  INSTITUTIONAL_ANIMAL_PRESETS,
  getRandomTraderAvatar,
  shuffleAvatarPresets,
  filterAvatarPresets,
  AVATAR_CATEGORIES,
};

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

// Deterministic mapping for featured leaderboard & community traders across unique indices
const TRADER_PRESET_MAP: Record<string, string> = {
  'FX_Sniper': INSTITUTIONAL_ANIMAL_PRESETS[0].url,       // Golden Bull
  'GoldBug_JP': INSTITUTIONAL_ANIMAL_PRESETS[10].url,     // Emerald Quant Dragon
  'AlphaWave': INSTITUTIONAL_ANIMAL_PRESETS[1].url,       // Cyber Tiffany Wolf
  'ZenScalper': INSTITUTIONAL_ANIMAL_PRESETS[4].url,      // Emerald Quant Viper
  'TokyoRider': INSTITUTIONAL_ANIMAL_PRESETS[8].url,      // Neon Acid Kitsune Fox
  'ApexTrader_FX': INSTITUTIONAL_ANIMAL_PRESETS[3].url,   // Imperial Violet Lion
  'CryptoKing_99': INSTITUTIONAL_ANIMAL_PRESETS[6].url,   // Obsidian Shadow Panther
  'ApexPredator': INSTITUTIONAL_ANIMAL_PRESETS[7].url,    // Glacial Arctic Shark
  'OsakaTrader': INSTITUTIONAL_ANIMAL_PRESETS[11].url,    // Solar Flare Tiger
  'NovaFX': INSTITUTIONAL_ANIMAL_PRESETS[5].url,          // Solar Flare Falcon
  'AlphaTrader': INSTITUTIONAL_ANIMAL_PRESETS[9].url,     // Neon Synth Quantum Owl
  'Marcus_V': INSTITUTIONAL_ANIMAL_PRESETS[2].url,        // Crimson Bear
  'Sarah_FX': INSTITUTIONAL_ANIMAL_PRESETS[22].url,       // Distinct Wolf variant
  'Hiroshi_K': INSTITUTIONAL_ANIMAL_PRESETS[105].url,     // Distinct Dragon variant
  'Elena_Scalps': INSTITUTIONAL_ANIMAL_PRESETS[52].url,   // Distinct Viper variant
  'David_Gold': INSTITUTIONAL_ANIMAL_PRESETS[14].url,     // Distinct Bull variant
  'SwissVault': INSTITUTIONAL_ANIMAL_PRESETS[41].url,     // Distinct Lion variant
  'RiskMaximus': INSTITUTIONAL_ANIMAL_PRESETS[115].url,   // Distinct Tiger variant
  'LondonFX_James': INSTITUTIONAL_ANIMAL_PRESETS[61].url, // Distinct Falcon variant
  'Sofia_Quant': INSTITUTIONAL_ANIMAL_PRESETS[97].url,    // Distinct Owl variant
  'Alex_Scalps': INSTITUTIONAL_ANIMAL_PRESETS[88].url,    // Distinct Kitsune variant
  'Viktor_Metals': INSTITUTIONAL_ANIMAL_PRESETS[31].url,  // Distinct Bear variant
  'Kenshi_Tokyo': INSTITUTIONAL_ANIMAL_PRESETS[79].url,   // Distinct Shark variant
  'Liam_FX': INSTITUTIONAL_ANIMAL_PRESETS[70].url,        // Distinct Panther variant
};

const resolveSavedUserAvatar = (username: string, explicitUrl?: string): string | undefined => {
  if (explicitUrl) return explicitUrl;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('traderank_auth_user_v1') : null;
    if (!raw) return undefined;
    const saved = JSON.parse(raw);
    if (
      saved?.avatarUrl &&
      (saved.username === username ||
       username.startsWith('Verified_') ||
       username.startsWith('TraderRank-') ||
       username.includes('72423906'))
    ) {
      return saved.avatarUrl;
    }
  } catch {
    // ignore storage read errors
  }
  return undefined;
};

export const getTraderAnimalPreset = (username: string, customUrl?: string): AnimalAvatarPreset => {
  const effectiveUrl = resolveSavedUserAvatar(username, customUrl);
  if (effectiveUrl) {
    const matched = INSTITUTIONAL_ANIMAL_PRESETS.find(
      (p) => p.url === effectiveUrl || effectiveUrl === `preset:${p.id}` || p.id === effectiveUrl
    );
    if (matched) return matched;
  }

  if (TRADER_PRESET_MAP[username]) {
    const matched = INSTITUTIONAL_ANIMAL_PRESETS.find((p) => p.url === TRADER_PRESET_MAP[username]);
    if (matched) return matched;
  }

  // Deterministic hash across all 124+ unique avatars
  let hash = 2166136261;
  for (let i = 0; i < username.length; i++) {
    hash ^= username.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const index = Math.abs(hash) % INSTITUTIONAL_ANIMAL_PRESETS.length;
  return INSTITUTIONAL_ANIMAL_PRESETS[index];
};

export const getTraderProfilePhoto = (username: string, customUrl?: string): string => {
  const effectiveUrl = resolveSavedUserAvatar(username, customUrl);
  if (effectiveUrl && !effectiveUrl.includes('images.unsplash.com/photo-')) {
    if (effectiveUrl.startsWith('preset:')) {
      const id = effectiveUrl.replace('preset:', '');
      const preset = INSTITUTIONAL_ANIMAL_PRESETS.find((p) => p.id === id);
      if (preset) return preset.url;
    }
    const directMatch = INSTITUTIONAL_ANIMAL_PRESETS.find((p) => p.id === effectiveUrl);
    if (directMatch) return directMatch.url;
    return effectiveUrl;
  }

  return getTraderAnimalPreset(username, effectiveUrl).url;
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
  const preset = getTraderAnimalPreset(username, avatarUrl);
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
      title={`${username} • ${preset.label}`}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: size >= 48 ? '14px' : '10px',
          overflow: 'hidden',
          border: isChampion
            ? '2px solid #fbbf24'
            : `1.5px solid ${preset.accentColor}66`,
          boxShadow: isChampion
            ? '0 0 16px rgba(251, 191, 36, 0.45), 0 2px 8px rgba(0,0,0,0.5)'
            : `0 0 12px ${preset.accentColor}26, 0 2px 8px rgba(0,0,0,0.45)`,
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
