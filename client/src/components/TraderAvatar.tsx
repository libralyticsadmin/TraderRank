import React from 'react';
import { Zap, Target, Shield, Gem, User, Award } from 'lucide-react';

interface TraderAvatarProps {
  symbol?: string;
  username: string;
  size?: number;
}

export const TraderAvatar: React.FC<TraderAvatarProps> = ({ symbol, username, size = 32 }) => {
  const getInitials = (name: string) => {
    const parts = name.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getSymbolIcon = (sym?: string) => {
    const iconSize = Math.max(12, Math.floor(size * 0.45));
    switch (sym?.toLowerCase()) {
      case 'zap':
        return <Zap size={iconSize} color="#f59e0b" />;
      case 'target':
        return <Target size={iconSize} color="#f43f5e" />;
      case 'shield':
        return <Shield size={iconSize} color="#06b6d4" />;
      case 'gem':
        return <Gem size={iconSize} color="#8b5cf6" />;
      case 'award':
        return <Award size={iconSize} color="#10b981" />;
      default:
        return <User size={iconSize} color="#94a3b8" />;
    }
  };

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '10px',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(20, 28, 45, 0.9) 100%)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
      title={username}
    >
      <span
        style={{
          fontSize: `${Math.max(10, Math.floor(size * 0.35))}px`,
          fontWeight: 800,
          letterSpacing: '-0.5px',
          color: 'var(--text-main)',
        }}
      >
        {getInitials(username)}
      </span>
      <div
        style={{
          position: 'absolute',
          bottom: '-3px',
          right: '-3px',
          background: 'var(--bg-secondary)',
          borderRadius: '4px',
          padding: '1px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {getSymbolIcon(symbol)}
      </div>
    </div>
  );
};
