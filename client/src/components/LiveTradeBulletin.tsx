import React, { useState, useEffect } from 'react';
import { Broker } from '../../../shared/src/types.ts';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { TrendingUp, TrendingDown, Flame, Zap } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext.tsx';

export interface BulletinTradeItem {
  id: string;
  trader: string;
  broker: Broker;
  symbol: string;
  type: 'BUY' | 'SELL' | 'TP_HIT' | 'SL_HIT' | 'RECORD';
  pips: number;
  lotSize: number;
  profitUsd: number;
  timeAgo: string;
  tag?: string;
  tagKey?: string;
  isHot?: boolean;
}

interface LiveTradeBulletinProps {
  onSelectTrader?: (trader: { username: string; broker?: Broker; rank?: number; score?: number }) => void;
  speed?: 'normal' | 'fast' | 'slow';
}

export const LiveTradeBulletin: React.FC<LiveTradeBulletinProps> = ({
  onSelectTrader,
  speed = 'normal',
}) => {
  const { t } = useTranslation();
  const [trades, setTrades] = useState<BulletinTradeItem[]>([]);

  const getTagLabel = (item: BulletinTradeItem) => {
    if (item.tagKey && (t.bulletin as any)[item.tagKey]) {
      return (t.bulletin as any)[item.tagKey];
    }
    return item.tag || t.bulletin.verifiedBridge;
  };

  // Fetch verified trades from connected MetaApi / broker accounts
  useEffect(() => {
    let isMounted = true;

    const loadRealTrades = async () => {
      try {
        const accRes = await fetch('/api/accounts');
        if (!accRes.ok) return;
        const accounts = await accRes.json();
        if (!Array.isArray(accounts) || accounts.length === 0) return;

        const collected: BulletinTradeItem[] = [];
        for (const acc of accounts) {
          try {
            const trRes = await fetch(`/api/accounts/${acc.id}/trades`);
            if (trRes.ok) {
              const rawTrades = await trRes.json();
              if (Array.isArray(rawTrades)) {
                for (const tr of rawTrades) {
                  collected.push({
                    id: tr.id || `tr_${Math.random()}`,
                    trader: acc.username || `Trader-${acc.accountNumber}`,
                    broker: acc.broker || 'XM',
                    symbol: tr.symbol || 'EURUSD',
                    type: tr.type === 'BUY' ? 'BUY' : 'SELL',
                    pips: Number((tr.profitPips ?? tr.pnlPips ?? 0).toFixed(1)),
                    lotSize: Number((tr.lotSize ?? tr.volume ?? 0.1).toFixed(2)),
                    profitUsd: Number((tr.profitCurrency ?? tr.profit ?? 0).toFixed(1)),
                    timeAgo: tr.closeTime ? new Date(tr.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Live',
                    tagKey: (tr.profitPips ?? 0) > 0 ? 'scalpWin' : 'verifiedDeal',
                    isHot: (tr.profitPips ?? 0) > 20,
                  });
                }
              }
            }
          } catch {
            // ignore
          }
        }

        if (isMounted && collected.length > 0) {
          setTrades(collected);
        }
      } catch {
        // ignore
      }
    };

    loadRealTrades();
    const interval = setInterval(loadRealTrades, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getDuration = () => {
    if (speed === 'fast') return '18s';
    if (speed === 'slow') return '42s';
    return '28s';
  };

  return (
    <div className="bulletin-container" role="region" aria-label="Live Trade Bulletin Moving Tape">
      {/* Fixed Leading Spot Badge */}
      <div className="bulletin-badge-pinned">
        <div className="bulletin-radar-wrap">
          <span className="bulletin-radar-ping"></span>
          <span className="bulletin-radar-dot"></span>
        </div>
        <div className="bulletin-badge-text">
          <span className="bulletin-title">{t.bulletin.badgeTitle}</span>
          <span className="bulletin-subtitle">{t.bulletin.badgeSubtitle}</span>
        </div>
      </div>

      {/* Infinite Horizontal Motion Track Moving Left or Waiting Status */}
      <div className="bulletin-track-window">
        {trades.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 24px',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            <Zap size={14} color="#0abab5" />
            <span>MetaApi Real-Time Broker Stream Active • Waiting for incoming verified trade fills</span>
          </div>
        ) : (
          <div
            className="bulletin-marquee-content"
            style={{ animationDuration: getDuration() }}
          >
            {/* Render track items twice to ensure seamless 100% infinite continuous loop */}
            {[...trades, ...trades].map((item, idx) => {
              const isPositive = item.pips >= 0;
            return (
              <div
                key={`${item.id}-${idx}`}
                className={`bulletin-spot-card ${item.isHot ? 'bulletin-spot-card--hot' : ''}`}
                onClick={() =>
                  onSelectTrader &&
                  onSelectTrader({
                    username: item.trader,
                    broker: item.broker,
                    score: item.pips,
                  })
                }
                title={`Click to view ${item.trader} profile and stats`}
              >
                {/* Spot Header: Symbol & Broker */}
                <div className="bulletin-card-header">
                  <div className="bulletin-symbol-wrap">
                    <span className="bulletin-symbol">{item.symbol}</span>
                    <span className={`bulletin-type-badge ${item.type === 'BUY' ? 'type-buy' : 'type-sell'}`}>
                      {item.type} {item.lotSize}L
                    </span>
                  </div>
                  <div className="bulletin-broker-badge">
                    <BrokerSymbol broker={item.broker} size={11} />
                    <span>{item.broker}</span>
                  </div>
                </div>

                {/* Spot Body: Trader, Pips, Profit */}
                <div className="bulletin-card-body">
                  <div className="bulletin-trader-name">
                    {item.isHot && <Flame size={12} color="#fbbf24" className="bulletin-flame-icon" />}
                    <strong>{item.trader}</strong>
                  </div>

                  <div className="bulletin-pips-pill">
                    {isPositive ? (
                      <TrendingUp size={12} color="var(--tiffany)" />
                    ) : (
                      <TrendingDown size={12} color="var(--accent-red)" />
                    )}
                    <span className="tabular font-bold">
                      +{item.pips} <small>{t.bulletin.pips}</small>
                    </span>
                  </div>
                </div>

                {/* Spot Footer: Micro Tag & Time */}
                <div className="bulletin-card-footer">
                  <span className="bulletin-tag">{getTagLabel(item)}</span>
                  <span className="bulletin-time">{item.timeAgo}</span>
                </div>

                {/* Neon Motion Flare Glow */}
                {item.isHot && <div className="bulletin-hot-glow" />}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};
