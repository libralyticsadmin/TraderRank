import React, { useState, useEffect } from 'react';
import { Swords, Clock, CheckCircle2, Zap, ChevronRight, Users, Flame, Trophy } from 'lucide-react';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { TraderAvatar } from './TraderAvatar.tsx';
import { Broker } from '../../../shared/src/types.ts';
import { useTranslation } from '../context/LanguageContext.tsx';

export interface Tournament {
  id: string;
  title: string;
  subtitle: string;
  type: 'WEEKLY_SPRINT' | 'MONTHLY_PROP' | 'DAILY_BLITZ';
  prizePoolUsd: number;
  prizePoolXp: number;
  entrantsCount: number;
  minParticipantsToStart?: number;
  startsAt: string;
  endsAt: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
  rules: {
    maxDailyLossPct: number;
    maxTrailingDrawdownPct: number;
    minTradesCount: number;
    scoringFormula: string;
  };
}

export interface TournamentParticipant {
  rank: number;
  userId: string;
  username: string;
  broker: Broker;
  avatarSymbol: string;
  netPips: number;
  tradesCount: number;
  drawdownPct: number;
  winRate: number;
  status: 'ACTIVE' | 'DISQUALIFIED';
  estimatedPrize: string;
}

export interface TournamentArenaProps {
  onOpenConnectWizard?: () => void;
}

export const TournamentArena: React.FC<TournamentArenaProps> = ({ onOpenConnectWizard }) => {
  const { t } = useTranslation();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('tourn_weekly_fx_blitz_01');
  const [isUserEntered, setIsUserEntered] = useState<boolean>(false);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [joinSuccessMsg, setJoinSuccessMsg] = useState<string | null>(null);
  const [serverTournaments, setServerTournaments] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 3,
    hours: 14,
    minutes: 22,
    seconds: 45,
  });

  const loadTournaments = async () => {
    try {
      const res = await fetch('/api/tournaments');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setServerTournaments(data);
          if (!selectedTournamentId || !data.some(d => d.id === selectedTournamentId)) {
            setSelectedTournamentId(data[0].id);
          }
        }
      }
    } catch {
      // Fallback gracefully
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleJoinTournament = async () => {
    setIsJoining(true);
    setJoinSuccessMsg(null);
    try {
      // Fetch verified connected accounts
      const accRes = await fetch('/api/accounts');
      const accounts = accRes.ok ? await accRes.json() : [];
      const primaryAcc = accounts[0];

      if (!primaryAcc) {
        setIsJoining(false);
        if (onOpenConnectWizard) {
          onOpenConnectWizard();
        } else {
          setJoinSuccessMsg('Please connect your verified broker account first to enter the tournament.');
        }
        return;
      }

      const userId = primaryAcc.userId || `usr_${primaryAcc.id}`;
      const username = primaryAcc.accountNumber ? `TraderRank-${primaryAcc.accountNumber}` : primaryAcc.id;
      const broker = primaryAcc.broker || 'XM';

      const res = await fetch(`/api/tournaments/${selectedTournamentId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          username,
          avatarSymbol: broker.slice(0, 2).toUpperCase(),
          broker,
        }),
      });

      if (res.ok) {
        setIsUserEntered(true);
        setJoinSuccessMsg(`Account ${primaryAcc?.accountNumber || '342186831'} (${broker}) entered into ${currentTourney.title}! Institutional risk rules active.`);
        await loadTournaments();
      }
    } catch (err) {
      console.error('Failed to join tournament', err);
    } finally {
      setIsJoining(false);
    }
  };

  const defaultTournaments: Tournament[] = [
    {
      id: 'tourn_weekly_fx_blitz_01',
      title: t.arena.weeklySprint,
      subtitle: t.arena.weeklySprintDesc,
      type: 'WEEKLY_SPRINT',
      prizePoolUsd: 5000,
      prizePoolXp: 15000,
      entrantsCount: 0,
      minParticipantsToStart: 50,
      startsAt: '2026-09-14T00:00:00Z',
      endsAt: '2026-09-19T21:00:00Z',
      status: 'UPCOMING',
      rules: {
        maxDailyLossPct: 5.0,
        maxTrailingDrawdownPct: 10.0,
        minTradesCount: 5,
        scoringFormula: t.arena.scoringFormula,
      },
    },
    {
      id: 'tourn_monthly_prop_01',
      title: t.arena.monthlyChampionship,
      subtitle: t.arena.monthlyChampionshipDesc,
      type: 'MONTHLY_PROP',
      prizePoolUsd: 25000,
      prizePoolXp: 75000,
      entrantsCount: 0,
      minParticipantsToStart: 50,
      startsAt: '2026-09-01T00:00:00Z',
      endsAt: '2026-09-30T23:59:59Z',
      status: 'UPCOMING',
      rules: {
        maxDailyLossPct: 4.0,
        maxTrailingDrawdownPct: 8.0,
        minTradesCount: 20,
        scoringFormula: t.arena.scoringFormula,
      },
    },
    {
      id: 'tourney_gold_rush',
      title: t.arena.globalGoldRushTitle,
      subtitle: t.arena.globalGoldRushSubtitle,
      type: 'WEEKLY_SPRINT',
      prizePoolUsd: 10000,
      prizePoolXp: 30000,
      entrantsCount: 0,
      minParticipantsToStart: 50,
      startsAt: '2026-09-15T00:00:00Z',
      endsAt: '2026-09-20T23:59:59Z',
      status: 'UPCOMING',
      rules: {
        maxDailyLossPct: 4.5,
        maxTrailingDrawdownPct: 9.0,
        minTradesCount: 8,
        scoringFormula: t.arena.scoringFormula,
      },
    },
    {
      id: 'tourney_daily_rush',
      title: t.arena.tokyoLondonOverlapTitle,
      subtitle: t.arena.tokyoLondonOverlapSubtitle,
      type: 'DAILY_BLITZ',
      prizePoolUsd: 1500,
      prizePoolXp: 5000,
      entrantsCount: 0,
      minParticipantsToStart: 50,
      startsAt: '2026-09-15T07:00:00Z',
      endsAt: '2026-09-15T16:00:00Z',
      status: 'UPCOMING',
      rules: {
        maxDailyLossPct: 3.0,
        maxTrailingDrawdownPct: 6.0,
        minTradesCount: 3,
        scoringFormula: t.arena.scoringFormula,
      },
    },
  ];

  const tournaments: Tournament[] = serverTournaments.length > 0
    ? serverTournaments.map(st => {
        const count = st.participantCount || st.standings?.length || 0;
        const target = st.minParticipantsToStart || 50;
        const status = st.status || (count >= target ? 'ACTIVE' : 'UPCOMING');
        return {
          id: st.id,
          title: st.title,
          subtitle: st.description,
          type: st.type,
          prizePoolUsd: st.prizePoolPips * 2,
          prizePoolXp: st.prizePoolPips * 5,
          entrantsCount: count,
          minParticipantsToStart: target,
          startsAt: st.startDate,
          endsAt: st.endDate,
          status,
          rules: {
            maxDailyLossPct: st.maxDailyLossPercent || 5.0,
            maxTrailingDrawdownPct: st.maxDrawdownPercent || 10.0,
            minTradesCount: st.minTradesRequired || 5,
            scoringFormula: t.arena.scoringFormula,
          },
        };
      })
    : defaultTournaments;

  const currentTourney = tournaments.find(t => t.id === selectedTournamentId) || tournaments[0];
  const activeServerTourn = serverTournaments.find(st => st.id === selectedTournamentId);

  const participants: TournamentParticipant[] = (activeServerTourn?.standings || []).map((s: any) => ({
    rank: s.rank,
    userId: s.userId,
    username: s.username,
    broker: (s.brokers && s.brokers[0]) || 'XM',
    avatarSymbol: s.avatarSymbol || s.username.slice(0, 2),
    netPips: s.netPips,
    tradesCount: s.tradesCount,
    drawdownPct: s.maxDrawdownReached || s.currentDrawdownPercent || 0,
    winRate: s.winRate,
    status: s.isDisqualified ? 'DISQUALIFIED' : 'ACTIVE',
    estimatedPrize: s.rank === 1 ? '$2,000 + 5,000 XP' : s.rank === 2 ? '$1,200 + 3,500 XP' : s.rank === 3 ? '$800 + 2,000 XP' : '$400 + 1,000 XP',
  }));

  // Countdown timer tick simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Tournament Selector Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {tournaments.map(tourney => {
          const isSelected = tourney.id === selectedTournamentId;
          return (
            <div
              key={tourney.id}
              onClick={() => setSelectedTournamentId(tourney.id)}
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(10, 186, 181, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)'
                  : 'rgba(15, 23, 42, 0.6)',
                border: isSelected ? '1px solid rgba(10, 186, 181, 0.5)' : '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '18px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 10px 25px -5px rgba(10, 186, 181, 0.2)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: tourney.type === 'WEEKLY_SPRINT' ? 'rgba(129, 216, 208, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: tourney.type === 'WEEKLY_SPRINT' ? 'var(--accent-cyan)' : '#fbbf24',
                    border: `1px solid ${tourney.type === 'WEEKLY_SPRINT' ? 'rgba(129, 216, 208, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                  }}
                >
                  {tourney.type === 'WEEKLY_SPRINT' ? t.arena.weeklySprint : t.arena.monthlyChampionship}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: tourney.entrantsCount >= (tourney.minParticipantsToStart || 50) ? 'var(--accent-green)' : 'var(--accent-cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Users size={12} /> {tourney.entrantsCount}/{tourney.minParticipantsToStart || 50} {tourney.entrantsCount >= (tourney.minParticipantsToStart || 50) ? 'LIVE' : 'REG'}
                </span>
              </div>

              <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 800 }}>{tourney.title}</h4>
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-muted)' }}>{tourney.subtitle}</p>

              {/* 50-user threshold card progress */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <span>{tourney.entrantsCount >= (tourney.minParticipantsToStart || 50) ? 'Battle Active' : 'Opens at 50 Traders'}</span>
                  <span style={{ fontWeight: 700, color: tourney.entrantsCount >= (tourney.minParticipantsToStart || 50) ? 'var(--accent-green)' : 'var(--accent-cyan)' }}>
                    {Math.round((Math.min(tourney.entrantsCount, tourney.minParticipantsToStart || 50) / (tourney.minParticipantsToStart || 50)) * 100)}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, (tourney.entrantsCount / (tourney.minParticipantsToStart || 50)) * 100)}%`,
                      height: '100%',
                      background: tourney.entrantsCount >= (tourney.minParticipantsToStart || 50) ? 'var(--accent-green)' : 'var(--accent-cyan)',
                      boxShadow: '0 0 8px rgba(0, 240, 255, 0.4)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.arena.prizePool}</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24' }}>
                    ${tourney.prizePoolUsd.toLocaleString()} <span style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>+{tourney.prizePoolXp} XP</span>
                  </div>
                </div>
                <ChevronRight size={18} color={isSelected ? 'var(--accent-green)' : 'var(--text-muted)'} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Tournament Detail & Live Bracket */}
      <div className="card-panel" style={{ padding: '24px' }}>
        {(() => {
          const targetUsers = currentTourney.minParticipantsToStart || 50;
          const isTournamentLive = currentTourney.entrantsCount >= targetUsers;
          const remainingUsers = Math.max(0, targetUsers - currentTourney.entrantsCount);
          const progressPct = Math.min(100, Math.round((currentTourney.entrantsCount / targetUsers) * 100));

          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Swords size={24} color={isTournamentLive ? 'var(--accent-green)' : 'var(--accent-cyan)'} />
                    <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>{currentTourney.title}</h3>
                    {isTournamentLive ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Flame size={12} /> {t.arena.liveBattleBadge}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: 'rgba(0, 240, 255, 0.12)',
                          color: 'var(--accent-cyan)',
                          border: '1px solid rgba(0, 240, 255, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <Users size={12} /> OPENS AT 50 TRADERS ({currentTourney.entrantsCount}/{targetUsers})
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {currentTourney.subtitle} • {t.arena.antiGamblingRules} {t.arena.maxTrailingDD} {currentTourney.rules.maxTrailingDrawdownPct}%
                  </p>
                </div>

                {/* Countdown & Entry CTA */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <Clock size={12} /> {t.arena.battleEndsIn}:
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>
                      {String(timeLeft.days).padStart(2, '0')}d : {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
                    </div>
                  </div>

                  <button
                    onClick={handleJoinTournament}
                    disabled={isJoining}
                    style={{
                      padding: '10px 20px',
                      fontSize: '13px',
                      fontWeight: 800,
                      borderRadius: '10px',
                      cursor: isJoining ? 'not-allowed' : 'pointer',
                      background: isUserEntered
                        ? 'rgba(10, 186, 181, 0.2)'
                        : 'linear-gradient(135deg, var(--accent-green), #078c88)',
                      color: isUserEntered ? 'var(--accent-green)' : '#000000',
                      border: isUserEntered ? '1px solid var(--accent-green)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isUserEntered ? (
                      <>
                        <CheckCircle2 size={16} />{' '}
                        {isTournamentLive
                          ? t.arena.enteredTracking
                          : `Registered • Waiting for 50 Traders (${currentTourney.entrantsCount}/${targetUsers})`}
                      </>
                    ) : (
                      <>
                        <Zap size={16} />{' '}
                        {isJoining
                          ? t.app.syncing
                          : `Register for Tournament (${currentTourney.entrantsCount}/${targetUsers})`}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 50-Participant Registration Progress Milestone */}
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: isTournamentLive
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, rgba(15, 23, 42, 0.9) 100%)',
                  border: `1px solid ${isTournamentLive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(0, 240, 255, 0.25)'}`,
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color={isTournamentLive ? 'var(--accent-green)' : 'var(--accent-cyan)'} />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                      {isTournamentLive ? 'TOURNAMENT OPEN & LIVE' : 'TOURNAMENT OPENS AT 50 REGISTERED TRADERS'}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: isTournamentLive ? 'var(--accent-green)' : 'var(--accent-cyan)' }}>
                    {currentTourney.entrantsCount} / {targetUsers} Registered ({progressPct}%)
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: `${progressPct}%`,
                      height: '100%',
                      background: isTournamentLive
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, #00DAC6, #00F0FF)',
                      borderRadius: '4px',
                      boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <span>
                    {isTournamentLive
                      ? 'Target reached! Official live rankings and trading performance scoring are active.'
                      : `${remainingUsers} more verified broker accounts needed to unlock official tournament round.`}
                  </span>
                  <span style={{ color: isTournamentLive ? 'var(--accent-green)' : 'var(--accent-cyan)', fontWeight: 600 }}>
                    {isTournamentLive ? 'Battle Status: Active' : 'Status: Registration Stage'}
                  </span>
                </div>
              </div>
            </>
          );
        })()}

        {joinSuccessMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(0, 218, 198, 0.12)',
              border: '1px solid rgba(0, 218, 198, 0.4)',
              color: 'var(--accent-cyan)',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <CheckCircle2 size={16} />
            {joinSuccessMsg}
          </div>
        )}

        {/* Anti-Gambling Institutional Rules Banner (PRD Pillar 3) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '24px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.arena.maxDailyLoss}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>
              ≤ {currentTourney.rules.maxDailyLossPct}% {t.arena.equityLoss}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.arena.maxTrailingDD}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
              ≤ {currentTourney.rules.maxTrailingDrawdownPct}% {t.arena.peakDD}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.arena.minTradesReq}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
              {currentTourney.rules.minTradesCount} {t.arena.tradesToQualify}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.arena.scoringSystem}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
              {t.arena.scoringFormula}
            </div>
          </div>
        </div>

        {/* Standings Leaderboard / Registered Contenders */}
        {(() => {
          const targetUsers = currentTourney.minParticipantsToStart || 50;
          const isTournamentLive = currentTourney.entrantsCount >= targetUsers;

          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  {isTournamentLive
                    ? t.arena.standingsTitle
                    : `Registered Contenders (${participants.length} / ${targetUsers})`}
                </h4>
                <span style={{ fontSize: '12px', color: isTournamentLive ? 'var(--accent-green)' : 'var(--accent-cyan)', fontWeight: 600 }}>
                  {isTournamentLive ? 'Round Status: Active' : `Opens when 50 traders register (${Math.max(0, targetUsers - participants.length)} spots remaining)`}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {participants.length === 0 ? (
                  <div
                    style={{
                      padding: '44px 24px',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '16px',
                      border: '1px dashed var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        background: 'rgba(0, 218, 198, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 14px',
                      }}
                    >
                      <Trophy size={26} color="var(--accent-cyan)" />
                    </div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 800 }}>
                      {isTournamentLive ? 'Waiting for Verified Contenders' : `Registration Open • 0 / ${targetUsers} Registered`}
                    </h4>
                    <p style={{ margin: '0 auto 18px', maxWidth: '440px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Tournament opens officially once 50 traders register their verified broker account. Join now to secure your entry in this institutional battle!
                    </p>
                    {!isUserEntered && (
                      <button
                        className="btn-primary"
                        onClick={handleJoinTournament}
                        disabled={isJoining}
                        style={{ padding: '10px 22px', fontSize: '13px', fontWeight: 800, margin: '0 auto' }}
                      >
                        <Zap size={15} /> Register With Connected Broker
                      </button>
                    )}
                  </div>
                ) : (
            participants.map(p => {
            const isTop3 = p.rank <= 3;
            const isDq = p.status === 'DISQUALIFIED';

            return (
              <div
                key={p.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: isDq
                    ? 'rgba(239, 68, 68, 0.05)'
                    : isTop3
                    ? 'rgba(10, 186, 181, 0.04)'
                    : 'rgba(255, 255, 255, 0.02)',
                  border: isDq
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : isTop3
                    ? '1px solid rgba(10, 186, 181, 0.3)'
                    : '1px solid var(--border-subtle)',
                  opacity: isDq ? 0.7 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '32px',
                      fontWeight: 800,
                      fontSize: '14px',
                      textAlign: 'center',
                      color: isDq
                        ? '#ef4444'
                        : p.rank === 1
                        ? '#fbbf24'
                        : p.rank === 2
                        ? '#94a3b8'
                        : p.rank === 3
                        ? '#d97706'
                        : 'var(--text-muted)',
                    }}
                  >
                    {isDq ? 'DQ' : `#${p.rank}`}
                  </div>

                  <TraderAvatar username={p.username} symbol={p.avatarSymbol} size={36} />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '15px' }}>{p.username}</strong>
                      <BrokerSymbol broker={p.broker} />
                      {isDq && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                          }}
                        >
                          {t.arena.disqualifiedBadge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{p.tradesCount} {t.dailyBest.trades}</span>
                      <span>•</span>
                      <span>{t.dailyBest.winRate}: <strong style={{ color: 'var(--text-main)' }}>{p.winRate}%</strong></span>
                      <span>•</span>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>DD Risk:</span>
                        <div
                          style={{
                            width: '60px',
                            height: '6px',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                          title={`Drawdown: ${p.drawdownPct}% / Limit: ${currentTourney.rules.maxTrailingDrawdownPct}%`}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, (p.drawdownPct / currentTourney.rules.maxTrailingDrawdownPct) * 100)}%`,
                              height: '100%',
                              borderRadius: '3px',
                              background: isDq || p.drawdownPct >= currentTourney.rules.maxTrailingDrawdownPct
                                ? '#ef4444'
                                : p.drawdownPct >= currentTourney.rules.maxTrailingDrawdownPct * 0.7
                                ? '#f59e0b'
                                : '#10b981',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: isDq || p.drawdownPct >= currentTourney.rules.maxTrailingDrawdownPct
                              ? '#ef4444'
                              : p.drawdownPct >= currentTourney.rules.maxTrailingDrawdownPct * 0.7
                              ? '#f59e0b'
                              : '#10b981',
                          }}
                        >
                          {p.drawdownPct}% / {currentTourney.rules.maxTrailingDrawdownPct}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.arena.netPips}</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: isDq ? 'var(--text-muted)' : 'var(--accent-green)' }}>
                      +{p.netPips.toFixed(1)}
                    </div>
                  </div>

                  <div style={{ minWidth: '140px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.arena.estimatedPrize}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: isDq ? '#ef4444' : '#fbbf24' }}>
                      {p.estimatedPrize}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
})()}
      </div>
    </div>
  );
};
