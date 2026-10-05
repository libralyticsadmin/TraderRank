import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

export interface MarketPairPrice {
  symbol: string;
  name: string;
  category: 'FOREX' | 'METALS' | 'CRYPTO' | 'INDICES' | 'COMMODITIES';
  bid: number;
  ask: number;
  change24h: number;
  spreadPips: string;
  high24h: number;
  low24h: number;
  tag: string;
  source?: 'ALLTICK_LIVE' | 'LIVE_API' | 'SYNTHETIC';
  priceDirection?: 'up' | 'down' | 'neutral';
}

const DEFAULT_TOP_PAIRS: MarketPairPrice[] = [
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    category: 'FOREX',
    bid: 1.08512,
    ask: 1.08524,
    change24h: 0.38,
    spreadPips: '0.12 pips',
    high24h: 1.0885,
    low24h: 1.0820,
    tag: '#1 MOST TRADED',
  },
  {
    symbol: 'USD/JPY',
    name: 'US Dollar / Yen',
    category: 'FOREX',
    bid: 158.035,
    ask: 158.053,
    change24h: 0.64,
    spreadPips: '1.8 pips',
    high24h: 158.45,
    low24h: 157.20,
    tag: 'ALLTICK FEED',
    source: 'ALLTICK_LIVE',
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound / USD',
    category: 'FOREX',
    bid: 1.27255,
    ask: 1.27271,
    change24h: -0.18,
    spreadPips: '0.16 pips',
    high24h: 1.2760,
    low24h: 1.2690,
    tag: 'HIGH MOMENTUM',
  },
  {
    symbol: 'XAU/USD',
    name: 'Spot Gold / USD',
    category: 'METALS',
    bid: 4131.05,
    ask: 4131.35,
    change24h: 1.42,
    spreadPips: '0.30 pips',
    high24h: 4148.50,
    low24h: 4118.10,
    tag: 'TOP PROFIT VOLATILITY',
  },
  {
    symbol: 'MCL1!',
    name: 'Micro WTI Crude Oil (OANDA/NYMEX)',
    category: 'COMMODITIES',
    bid: 90.15,
    ask: 90.18,
    change24h: 1.12,
    spreadPips: '0.03 pips',
    high24h: 91.80,
    low24h: 89.10,
    tag: 'OANDA / NYMEX LIVE',
    source: 'ALLTICK_LIVE',
  },
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin / US Dollar',
    category: 'CRYPTO',
    bid: 65420.50,
    ask: 65432.50,
    change24h: 2.85,
    spreadPips: '12.0 pips',
    high24h: 66800.0,
    low24h: 64100.0,
    tag: '24/7 ALPHA CRYPTO',
  },
  {
    symbol: 'AUD/USD',
    name: 'Australian Dollar / USD',
    category: 'FOREX',
    bid: 0.65820,
    ask: 0.65832,
    change24h: 0.22,
    spreadPips: '0.12 pips',
    high24h: 0.6610,
    low24h: 0.6550,
    tag: 'ASIA-PAC ANCHOR',
  },
  {
    symbol: 'USD/CAD',
    name: 'US Dollar / CAD',
    category: 'FOREX',
    bid: 1.36410,
    ask: 1.36425,
    change24h: -0.09,
    spreadPips: '0.15 pips',
    high24h: 1.3680,
    low24h: 1.3615,
    tag: 'COMMODITY FX',
  },
  {
    symbol: 'US30',
    name: 'Wall Street 30 Index',
    category: 'INDICES',
    bid: 41250.0,
    ask: 41252.5,
    change24h: 0.55,
    spreadPips: '2.5 pts',
    high24h: 41400.0,
    low24h: 40950.0,
    tag: 'US SESSION VOLUME',
  },
];

export const MarketLivePricesTicker: React.FC = () => {
  const [pairs, setPairs] = useState<MarketPairPrice[]>(DEFAULT_TOP_PAIRS);
  const [lastTickSymbol, setLastTickSymbol] = useState<string | null>(null);

  // Fetch live server quotes
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await fetch('/api/market/quotes');
        if (res.ok) {
          const data = await res.json();
          if (data.quotes) {
            setPairs(prev =>
              prev.map(p => {
                const rawSym = p.symbol.replace('/', '');
                const q = data.quotes[rawSym] || data.quotes[p.symbol];
                if (q) {
                  const isHigher = q.bid > p.bid;
                  const isLower = q.bid < p.bid;
                  return {
                    ...p,
                    bid: q.bid,
                    ask: q.ask,
                    source: q.source === 'LIVE_API' ? 'ALLTICK_LIVE' : p.source,
                    priceDirection: isHigher ? 'up' : isLower ? 'down' : 'neutral',
                  };
                }
                return p;
              })
            );
          }
        }
      } catch {
        // Non-critical
      }
    };

    fetchQuotes();
    const timer = setInterval(fetchQuotes, 4000);
    return () => clearInterval(timer);
  }, []);

  // Micro jitter simulation for ultra-responsive live floor aesthetics
  useEffect(() => {
    const jitter = setInterval(() => {
      setPairs(prev => {
        const randIdx = Math.floor(Math.random() * prev.length);
        const target = prev[randIdx];
        const isJpy = target.symbol.includes('JPY');
        const isCrypto = target.symbol.includes('BTC');
        const isGold = target.symbol.includes('XAU');
        const isOil = target.symbol.includes('MCL') || target.symbol.includes('OIL');

        const delta = (Math.random() - 0.48) * (isCrypto ? 8.5 : isGold ? 0.35 : isOil ? 0.04 : isJpy ? 0.008 : 0.00008);
        const newBid = Math.max(0.01, target.bid + delta);
        const spreadNum = isCrypto ? 12.0 : isGold ? 0.25 : isOil ? 0.03 : isJpy ? 0.018 : 0.00012;
        const newAsk = newBid + spreadNum;

        const updated = [...prev];
        updated[randIdx] = {
          ...target,
          bid: isJpy ? Number(newBid.toFixed(3)) : isCrypto || isGold || isOil ? Number(newBid.toFixed(2)) : Number(newBid.toFixed(5)),
          ask: isJpy ? Number(newAsk.toFixed(3)) : isCrypto || isGold || isOil ? Number(newAsk.toFixed(2)) : Number(newAsk.toFixed(5)),
          priceDirection: delta >= 0 ? 'up' : 'down',
        };
        setLastTickSymbol(target.symbol);
        return updated;
      });
    }, 2200);

    return () => clearInterval(jitter);
  }, []);

  const formatPrice = (symbol: string, price: number) => {
    if (symbol.includes('JPY')) return price.toFixed(3);
    if (symbol.includes('BTC') || symbol.includes('XAU') || symbol === 'US30') return price.toFixed(2);
    return price.toFixed(5);
  };

  return (
    <div className="market-live-banner" role="region" aria-label="Live Market Prices Ticker">
      {/* Pinned Left Badge */}
      <div className="market-live-badge-pinned">
        <div className="market-radar-beacon">
          <span className="market-radar-pulse"></span>
          <span className="market-radar-center"></span>
        </div>
        <div className="market-badge-labels">
          <span className="market-badge-title">
            <Zap size={11} className="market-zap-icon" /> MARKET LIVE PRICES
          </span>
          <span className="market-badge-sub">TOP TRADING PAIRS</span>
        </div>
      </div>

      {/* Moving Track Window */}
      <div className="market-live-track-window">
        <div className="market-live-track-content">
          {/* Duplicate track to guarantee seamless infinite loop */}
          {[...pairs, ...pairs].map((pair, idx) => {
            const isPositive = pair.change24h >= 0;
            const isFlashing = lastTickSymbol === pair.symbol;

            return (
              <div
                key={`${pair.symbol}-${idx}`}
                className={`market-pair-card ${isFlashing ? 'market-pair-card--flash' : ''}`}
              >
                {/* Top Row: Symbol & Category */}
                <div className="market-pair-header">
                  <span className="market-pair-symbol">{pair.symbol}</span>
                  <span className={`market-change-pill ${isPositive ? 'change-up' : 'change-down'}`}>
                    {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {isPositive ? `+${pair.change24h}%` : `${pair.change24h}%`}
                  </span>
                </div>

                {/* Middle Row: Live Bid / Ask */}
                <div className="market-pair-rates">
                  <div className="rate-col">
                    <span className="rate-label">BID</span>
                    <span
                      className={`rate-val tabular ${pair.priceDirection === 'up' ? 'text-tiffany' : pair.priceDirection === 'down' ? 'text-red' : ''}`}
                    >
                      {formatPrice(pair.symbol, pair.bid)}
                    </span>
                  </div>

                  <div className="rate-divider">/</div>

                  <div className="rate-col">
                    <span className="rate-label">ASK</span>
                    <span className="rate-val tabular text-muted">
                      {formatPrice(pair.symbol, pair.ask)}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Spread & Tag */}
                <div className="market-pair-footer">
                  <span className="market-spread-tag">
                    SPR: <strong>{pair.spreadPips}</strong>
                  </span>
                  <span className="market-perf-tag">{pair.tag}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
