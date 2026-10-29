import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext.tsx';
import { Language } from '../i18n/translations.ts';
import { Globe, ChevronDown, Check } from 'lucide-react';

interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: 'EN' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: 'JA' },
  { code: 'zh', name: 'Mandarin', nativeName: '简体中文', flag: 'ZH' },
];

interface LanguageSelectorProps {
  variant?: 'header' | 'footer' | 'compact';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'header' }) => {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang = LANGUAGE_OPTIONS.find((l) => l.code === language) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: variant === 'compact' ? '4px 8px' : '6px 12px',
          borderRadius: '8px',
          background: isOpen ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)',
          border: isOpen ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(10px)',
          boxShadow: isOpen ? '0 0 16px rgba(0, 240, 255, 0.2)' : 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 240, 255, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          }
        }}
        aria-label="Select Language"
      >
        <Globe size={15} style={{ color: '#00F0FF', flexShrink: 0 }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: 'rgba(0, 240, 255, 0.1)', color: '#00F0FF' }}>{activeLang.flag}</span>
          <span>{activeLang.nativeName}</span>
        </span>
        <ChevronDown
          size={13}
          style={{
            color: '#848E9C',
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 1000,
            minWidth: '170px',
            background: '#0e141f',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            borderRadius: '12px',
            padding: '6px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), 0 0 24px rgba(0, 240, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            animation: 'fadeInScale 0.15s ease-out',
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: '#848E9C',
              textTransform: 'uppercase',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '4px',
            }}
          >
            Language / 言語 / 语言
          </div>
          {LANGUAGE_OPTIONS.map((opt) => {
            const isSelected = opt.code === language;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => handleSelect(opt.code)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                  border: isSelected ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid transparent',
                  color: isSelected ? '#00F0FF' : '#ffffff',
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: '#00F0FF' }}>{opt.flag}</span>
                  <div>
                    <div style={{ lineHeight: 1.2 }}>{opt.nativeName}</div>
                    <div style={{ fontSize: '10px', color: '#848E9C' }}>{opt.name}</div>
                  </div>
                </div>
                {isSelected && <Check size={14} style={{ color: '#00F0FF' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
