import React, { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { TraderAvatar } from './TraderAvatar.tsx';

interface UserNavMenuProps {
  onOpenConnectWizard?: () => void;
}

export const UserNavMenu: React.FC<UserNavMenuProps> = ({ onOpenConnectWizard }) => {
  const { user, isAuthenticated, openAuthModal, openProfileModal, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => openAuthModal('signin')}
          style={{
            background: 'linear-gradient(135deg, rgba(10, 186, 181, 0.15) 0%, rgba(0, 240, 255, 0.08) 100%)',
            border: '1px solid rgba(10, 186, 181, 0.45)',
            color: 'var(--tiffany-light, #81d8d0)',
            padding: '7px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            boxShadow: '0 0 14px rgba(10, 186, 181, 0.15)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(10, 186, 181, 0.25) 0%, rgba(0, 240, 255, 0.2) 100%)';
            e.currentTarget.style.boxShadow = '0 0 18px rgba(10, 186, 181, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(10, 186, 181, 0.15) 0%, rgba(0, 240, 255, 0.08) 100%)';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(10, 186, 181, 0.15)';
          }}
        >
          <User size={14} color="#0abab5" />
          <span>Sign In / Register</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(10, 186, 181, 0.35)',
          borderRadius: '10px',
          padding: '4px 10px 4px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(10, 186, 181, 0.12)';
          e.currentTarget.style.borderColor = 'var(--tiffany, #0abab5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          e.currentTarget.style.borderColor = 'rgba(10, 186, 181, 0.35)';
        }}
      >
        <TraderAvatar username={user.username} symbol={user.avatarSymbol} size={28} />
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
            {user.username}
          </span>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--tiffany, #0abab5)', lineHeight: 1 }}>
            Lv. {user.level} {user.tradingStyle || 'Pro'}
          </span>
        </div>
        <ChevronDown size={14} color="#94a3b8" />
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '230px',
            background: 'linear-gradient(180deg, #101927 0%, #080d15 100%)',
            border: '1px solid rgba(10, 186, 181, 0.35)',
            borderRadius: '14px',
            padding: '8px',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.8), 0 0 20px rgba(10, 186, 181, 0.2)',
            zIndex: 1200,
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header Summary */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '4px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>{user.username}</div>
            <div style={{ fontSize: '11px', color: '#848E9C', marginTop: '2px' }}>{user.email}</div>
          </div>

          <button
            onClick={() => { setMenuOpen(false); openProfileModal(); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: '#f1f5f9',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(10, 186, 181, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Settings size={15} color="#0abab5" />
            <span>Edit Profile & Avatar</span>
          </button>

          {onOpenConnectWizard && (
            <button
              onClick={() => { setMenuOpen(false); onOpenConnectWizard(); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(10, 186, 181, 0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <ShieldCheck size={15} color="#0abab5" />
              <span>Connect Broker MT4/MT5</span>
            </button>
          )}

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }}></div>

          <button
            onClick={() => { setMenuOpen(false); logout(); }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={15} color="#ef4444" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
