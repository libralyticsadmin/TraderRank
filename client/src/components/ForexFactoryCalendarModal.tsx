import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  AlertTriangle,
  RefreshCw,
  Flame,
} from 'lucide-react';
import {
  EconomicCalendarResponse,
  ForexFactoryEvent,
  NewsImpact,
} from '../../../shared/src/types.ts';
import { useTranslation } from '../context/LanguageContext.tsx';

interface ForexFactoryCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCurrency?: string;
}

const CURRENCIES = ['ALL', 'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'NZD', 'CNY'];

export const ForexFactoryCalendarModal: React.FC<ForexFactoryCalendarModalProps> = ({
  isOpen,
  onClose,
  defaultCurrency = 'ALL',
}) => {
  const { t } = useTranslation();
  const [data, setData] = useState<EconomicCalendarResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(defaultCurrency);
  const [selectedImpact, setSelectedImpact] = useState<NewsImpact | 'ALL'>('ALL');
  const [hidePassed, setHidePassed] = useState<boolean>(false);

  const fetchCalendar = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch(`/api/market/economic-calendar?refresh=${forceRefresh}`);
      if (res.ok) {
        const json = (await res.json()) as EconomicCalendarResponse;
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch ForexFactory calendar', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCalendar(false);
    }
  }, [isOpen]);

  // Filter events by currency, impact, and passed state
  const filteredEvents = useMemo(() => {
    if (!data?.events) return [];
    let list = data.events;

    if (selectedCurrency !== 'ALL') {
      list = list.filter(e => e.country.toUpperCase() === selectedCurrency.toUpperCase());
    }

    if (selectedImpact !== 'ALL') {
      list = list.filter(e => e.impact === selectedImpact);
    }

    if (hidePassed) {
      list = list.filter(e => !e.hasPassed);
    }

    return list;
  }, [data, selectedCurrency, selectedImpact, hidePassed]);

  // Group events by Date String
  const groupedByDate = useMemo(() => {
    const groups: Record<string, ForexFactoryEvent[]> = {};
    for (const e of filteredEvents) {
      let dateKey = 'Upcoming Releases';
      try {
        const d = new Date(e.date);
        dateKey = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        dateKey = e.date || 'Calendar Events';
      }
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(e);
    }
    return groups;
  }, [filteredEvents]);

  if (!isOpen) return null;

  const getImpactBadge = (impact: NewsImpact) => {
    switch (impact) {
      case 'HIGH':
        return {
          label: 'HIGH',
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.18)',
          border: 'rgba(239, 68, 68, 0.45)',
          folder: '🔴',
        };
      case 'MEDIUM':
        return {
          label: 'MED',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.18)',
          border: 'rgba(245, 158, 11, 0.45)',
          folder: '🟠',
        };
      case 'LOW':
        return {
          label: 'LOW',
          color: '#fbbf24',
          bg: 'rgba(251, 191, 36, 0.12)',
          border: 'rgba(251, 191, 36, 0.3)',
          folder: '🟡',
        };
      default:
        return {
          label: 'HOLIDAY',
          color: '#94a3b8',
          bg: 'rgba(148, 163, 184, 0.12)',
          border: 'rgba(148, 163, 184, 0.25)',
          folder: '⚪',
        };
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 8, 0.88)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '92vh',
          background: 'linear-gradient(145deg, #071317 0%, #0c2128 100%)',
          border: '1px solid rgba(10, 186, 181, 0.45)',
          borderRadius: '20px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 50px rgba(10, 186, 181, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(129, 216, 208, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.35)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)',
              }}
            >
              <Calendar size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                  {t.forexCalendar.modalTitle}
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(239, 68, 68, 0.18)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Flame size={12} fill="#ef4444" /> {t.forexCalendar.liveRedFolderFeed}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {t.forexCalendar.subtitleDetailed}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => fetchCalendar(true)}
              disabled={isLoading || isRefreshing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#81d8d0',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title={t.forexCalendar.refreshCalendar}
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              {t.forexCalendar.refreshCalendar}
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                color: '#94aeb0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Top Upcoming High-Impact Release Alert Banner */}
        {data?.nextHighImpactEvent && (
          <div
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.22) 0%, rgba(12, 28, 33, 0.95) 100%)',
              borderBottom: '1px solid rgba(239, 68, 68, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: '#ef4444',
                  color: '#000',
                  fontSize: '11px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <AlertTriangle size={13} color="#000" /> {t.forexCalendar.nextHighImpact}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                [{data.nextHighImpactEvent.country}] {data.nextHighImpactEvent.title}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', fontFamily: 'monospace' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {t.forexCalendar.time} <strong style={{ color: '#fff' }}>{data.nextHighImpactEvent.timeString}</strong> ({data.nextHighImpactEvent.timeUntilFormatted})
              </span>
              {data.nextHighImpactEvent.forecast && (
                <span style={{ color: '#81d8d0' }}>
                  {t.forexCalendar.forecast}: <strong>{data.nextHighImpactEvent.forecast}</strong>
                </span>
              )}
              {data.nextHighImpactEvent.previous && (
                <span style={{ color: '#94a3b8' }}>
                  {t.forexCalendar.previous}: <strong>{data.nextHighImpactEvent.previous}</strong>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div
          style={{
            padding: '12px 24px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Impact Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginRight: '4px' }}>
              {t.forexCalendar.impact}
            </span>
            <button
              onClick={() => setSelectedImpact('ALL')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                border: selectedImpact === 'ALL' ? '1px solid #0abab5' : '1px solid var(--border-subtle)',
                background: selectedImpact === 'ALL' ? 'rgba(10, 186, 181, 0.2)' : 'transparent',
                color: selectedImpact === 'ALL' ? '#81d8d0' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {t.forexCalendar.allEvents} ({data?.totalCount || 0})
            </button>
            <button
              onClick={() => setSelectedImpact('HIGH')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 800,
                border: selectedImpact === 'HIGH' ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                background: selectedImpact === 'HIGH' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                color: selectedImpact === 'HIGH' ? '#f87171' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              🔴 {t.forexCalendar.highImpact} ({data?.highImpactCount || 0})
            </button>
            <button
              onClick={() => setSelectedImpact('MEDIUM')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                border: selectedImpact === 'MEDIUM' ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                background: selectedImpact === 'MEDIUM' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                color: selectedImpact === 'MEDIUM' ? '#fbbf24' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              🟠 {t.forexCalendar.mediumImpact} ({data?.mediumImpactCount || 0})
            </button>
            <button
              onClick={() => setSelectedImpact('LOW')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                border: selectedImpact === 'LOW' ? '1px solid #fbbf24' : '1px solid var(--border-subtle)',
                background: selectedImpact === 'LOW' ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                color: selectedImpact === 'LOW' ? '#fef08a' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              🟡 {t.forexCalendar.lowImpact}
            </button>
          </div>

          {/* Hide Passed Releases Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hidePassed}
                onChange={e => setHidePassed(e.target.checked)}
                style={{ accentColor: '#0abab5', cursor: 'pointer' }}
              />
              {t.forexCalendar.hidePast}
            </label>
          </div>
        </div>

        {/* Currency Selector Pills Strip */}
        <div
          style={{
            padding: '8px 24px',
            background: 'rgba(0, 0, 0, 0.25)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, marginRight: '4px' }}>
            {t.forexCalendar.currency}
          </span>
          {CURRENCIES.map(curr => {
            const active = selectedCurrency === curr;
            return (
              <button
                key={curr}
                onClick={() => setSelectedCurrency(curr)}
                style={{
                  padding: '3px 9px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  border: active ? '1px solid #0abab5' : '1px solid transparent',
                  background: active ? 'linear-gradient(135deg, #0abab5, #078c88)' : 'rgba(255,255,255,0.03)',
                  color: active ? '#000' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {curr}
              </button>
            );
          })}
        </div>

        {/* Calendar Events List View */}
        <div style={{ padding: '16px 24px', flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', fontSize: '14px', fontWeight: 700 }}>
                <RefreshCw size={18} className="animate-spin" /> {t.forexCalendar.ingesting}
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              {t.forexCalendar.noEventsMatching}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {Object.entries(groupedByDate).map(([dateStr, events]) => (
                <div key={dateStr}>
                  {/* Date Header Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '10px',
                      padding: '4px 10px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '6px',
                      width: 'fit-content',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <Calendar size={13} color="#0abab5" />
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{dateStr}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>({events.length} {t.forexCalendar.eventsCount})</span>
                  </div>

                  {/* Events Table Container */}
                  <div
                    style={{
                      background: 'rgba(12, 28, 33, 0.5)',
                      borderRadius: '12px',
                      border: '1px solid rgba(129, 216, 208, 0.12)',
                      overflow: 'hidden',
                    }}
                  >
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', textAlign: 'left', color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>
                          <th style={{ padding: '10px 14px', width: '110px' }}>{t.forexCalendar.timeCol}</th>
                          <th style={{ padding: '10px 10px', width: '70px' }}>{t.forexCalendar.curCol}</th>
                          <th style={{ padding: '10px 10px', width: '80px' }}>{t.forexCalendar.impactCol}</th>
                          <th style={{ padding: '10px 14px' }}>{t.forexCalendar.eventCol}</th>
                          <th style={{ padding: '10px 14px', width: '90px', textAlign: 'right' }}>{t.forexCalendar.actualCol}</th>
                          <th style={{ padding: '10px 14px', width: '90px', textAlign: 'right' }}>{t.forexCalendar.forecastCol}</th>
                          <th style={{ padding: '10px 14px', width: '90px', textAlign: 'right' }}>{t.forexCalendar.previousCol}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((e, idx) => {
                          const badge = getImpactBadge(e.impact);
                          return (
                            <tr
                              key={e.id || idx}
                              style={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                background: e.isHighImpact && !e.hasPassed ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                                opacity: e.hasPassed ? 0.65 : 1,
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(10, 186, 181, 0.08)')}
                              onMouseLeave={ev => (ev.currentTarget.style.background = e.isHighImpact && !e.hasPassed ? 'rgba(239, 68, 68, 0.04)' : 'transparent')}
                            >
                              {/* Time */}
                              <td style={{ padding: '10px 14px', fontFamily: 'monospace' }}>
                                <div style={{ fontWeight: 700, color: '#fff' }}>{e.timeString}</div>
                                <div style={{ fontSize: '10px', color: e.hasPassed ? '#64748b' : '#81d8d0' }}>
                                  {e.timeUntilFormatted}
                                </div>
                              </td>

                              {/* Currency */}
                              <td style={{ padding: '10px 10px', fontFamily: 'monospace' }}>
                                <span
                                  style={{
                                    fontWeight: 800,
                                    fontSize: '11px',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: 'rgba(255, 255, 255, 0.06)',
                                    color: '#f8fafc',
                                  }}
                                >
                                  {e.country}
                                </span>
                              </td>

                              {/* Impact Badge */}
                              <td style={{ padding: '10px 10px' }}>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: badge.bg,
                                    color: badge.color,
                                    border: `1px solid ${badge.border}`,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  <span>{badge.folder}</span> {badge.label}
                                </span>
                              </td>

                              {/* Event Description */}
                              <td style={{ padding: '10px 14px', fontWeight: 600, color: '#f1f5f9' }}>
                                {e.title}
                              </td>

                              {/* Actual */}
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: e.actual ? '#10b981' : '#64748b' }}>
                                {e.actual || '--'}
                              </td>

                              {/* Forecast */}
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#cbd5e1' }}>
                                {e.forecast || '--'}
                              </td>

                              {/* Previous */}
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#94a3b8' }}>
                                {e.previous || '--'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer Safety Protocol */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#ef4444', boxShadow: '0 0 6px #ef4444' }} />
            <span>{t.forexCalendar.feedActive}</span>
          </div>
          <div>
            {t.forexCalendar.dataSource} <strong style={{ color: '#81d8d0' }}>ForexFactory / FairEconomy</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
