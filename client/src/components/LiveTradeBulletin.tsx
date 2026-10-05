import React, { useState, useEffect } from 'react';
import { Broker } from '../../../shared/src/types.ts';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { TrendingUp, TrendingDown, Flame } from 'lucide-react';

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
  isHot?: boolean;
}

interface LiveTradeBulletinProps {
  onSelectTrader?: (trader: { username: string; broker?: Broker; rank?: number; score?: number }) => void;
  speed?: 'normal' | 'fast' | 'slow';
}

const INITIAL_BULLETIN_TRADES: BulletinTradeItem[] = [
  {
    id: 'blt_1',
    trader: 'FX_Sniper',
    broker: 'Exness',
    symbol: 'EURUSD',
    type: 'BUY',
    pips: 38.4,
    lotSize: 0.85,
    profitUsd: 384.0,
    timeAgo: 'Just now',
    tag: 'SCALP WIN',
    isHot: true,
  },
  {
    id: 'blt_2',
    trader: 'GoldBug_JP',
    broker: 'XM',
    symbol: 'XAUUSD',
    type: 'BUY',
    pips: 42.0,
    lotSize: 0.50,
    profitUsd: 2100.0,
    timeAgo: '12s ago',
    tag: 'GOLD RUSH',
    isHot: true,
  },
  {
    id: 'blt_3',
    trader: 'TokyoRider',
    broker: 'XM',
    symbol: 'USDJPY',
    type: 'BUY',
    pips: 19.8,
    lotSize: 1.20,
    profitUsd: 156.4,
    timeAgo: '35s ago',
    tag: 'LONDON BREAKOUT',
  },
  {
    id: 'blt_4',
    trader: 'ZenScalper',
    broker: 'Vantage',
    symbol: 'GBPUSD',
    type: 'SELL',
    pips: 24.1,
    lotSize: 0.60,
    profitUsd: 241.0,
    timeAgo: '1m ago',
    tag: 'SWING PULLBACK',
  },
  {
    id: 'blt_5',
    trader: 'AlphaWave',
    broker: 'Axiory',
    symbol: 'EURUSD',
    type: 'BUY',
    pips: 15.6,
    lotSize: 0.40,
    profitUsd: 156.0,
    timeAgo: '2m ago',
    tag: 'VERIFIED DEAL',
  },
  {
    id: 'blt_6',
    trader: 'CryptoKing_99',
    broker: 'Exness',
    symbol: 'BTCUSD',
    type: 'BUY',
    pips: 185.0,
    lotSize: 0.10,
    profitUsd: 185.0,
    timeAgo: '3m ago',
    tag: 'WEEKLY HIGH',
    isHot: true,
  },
  {
    id: 'blt_7',
    trader: 'ApexPredator',
    broker: 'XM',
    symbol: 'XAUUSD',
    type: 'TP_HIT',
    pips: 52.4,
    lotSize: 1.00,
    profitUsd: 5240.0,
    timeAgo: '4m ago',
    tag: 'TOURNAMENT LEAD',
    isHot: true,
  },
  {
    id: 'blt_8',
    trader: 'OsakaTrader',
    broker: 'Axiory',
    symbol: 'USDJPY',
    type: 'SELL',
    pips: 14.2,
    lotSize: 0.75,
    profitUsd: 98.2,
    timeAgo: '5m ago',
    tag: 'M15 PULLBACK',
  },
];

export const LiveTradeBulletin: React.FC<LiveTradeBulletinProps> = ({
  onSelectTrader,
  speed = 'normal',
}) => {
  const [trades, setTrades] = useState<BulletinTradeItem[]>(INITIAL_BULLETIN_TRADES);

  // Periodic random live tick generator to simulate incoming WebSocket trade executions
  useEffect(() => {
    const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD'];
    const traders = ['FX_Sniper', 'GoldBug_JP', 'ZenScalper', 'TokyoRider', 'AlphaWave', 'ApexTrader', 'NovaFX'];
    const brokers: Broker[] = ['Exness', 'XM', 'Axiory', 'Vantage'];
    const tags = ['LIVE EXECUTION', 'TAKE PROFIT', 'PIPS SURGE', 'NEW TOP 10', 'VERIFIED BRIDGE'];

    const interval = setInterval(() => {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const trader = traders[Math.floor(Math.random() * traders.length)];
      const broker = brokers[Math.floor(Math.random() * brokers.length)];
      const isBuy = Math.random() > 0.4;
      const pips = Number((5 + Math.random() * 45).toFixed(1));
      const lotSize = Number((0.1 + Math.random() * 1.5).toFixed(2));
      const profitUsd = sym === 'XAUUSD' ? Number((pips * lotSize * 10).toFixed(1)) : Number((pips * lotSize * 10).toFixed(1));

      const newItem: BulletinTradeItem = {
        id: `blt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        trader,
        broker,
        symbol: sym,
        type: isBuy ? 'BUY' : 'SELL',
        pips,
        lotSize,
        profitUsd,
        timeAgo: 'Just now',
        tag: tags[Math.floor(Math.random() * tags.length)],
        isHot: pips > 30,
      };

      setTrades(prev => [newItem, ...prev.slice(0, 11)]);
    }, 6500);

    return () => clearInterval(interval);
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
          <span className="bulletin-title">LIVE TRADE BULLETIN</span>
          <span className="bulletin-subtitle">REAL-TIME EXECUTION SPOT</span>
        </div>
      </div>

      {/* Infinite Horizontal Motion Track Moving Left */}
      <div className="bulletin-track-window">
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
                      +{item.pips} <small>pips</small>
                    </span>
                  </div>
                </div>

                {/* Spot Footer: Micro Tag & Time */}
                <div className="bulletin-card-footer">
                  <span className="bulletin-tag">{item.tag || 'VERIFIED'}</span>
                  <span className="bulletin-time">{item.timeAgo}</span>
                </div>

                {/* Neon Motion Flare Glow */}
                {item.isHot && <div className="bulletin-hot-glow" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
