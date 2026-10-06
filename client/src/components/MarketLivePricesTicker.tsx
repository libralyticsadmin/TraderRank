import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext.tsx';

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
  tag?: string;
  tagKey?: string;
  source?: 'ALLTICK_LIVE' | 'LIVE_API' | 'SYNTHETIC';
  priceDirection?: 'up' | 'down' | 'neutral';
}

const DEFAULT_TOP_PAIRS: MarketPairPrice[] = [
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    category: 'FOREX',
    bid: 1.12245,
    ask: 1.12257,
    change24h: 0.38,
    spreadPips: '0.12 pips',
    high24h: 1.1265,
    low24h: 1.1180,
    tagKey: 'tagMostTraded',
  },
  {
    symbol: 'USD/JPY',
    name: 'US Dollar / Yen',
    category: 'FOREX',
    bid: 158.142,
    ask: 158.158,
    change24h: 0.64,
    spreadPips: '1.6 pips',
    high24h: 158.60,
    low24h: 157.60,
    tagKey: 'tagAlltick',
    source: 'ALLTICK_LIVE',
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound / USD',
    category: 'FOREX',
    bid: 1.32195,
    ask: 1.32210,
    change24h: -0.18,
    spreadPips: '0.15 pips',
    high24h: 1.3260,
    low24h: 1.3175,
    tagKey: 'tagHighMomentum',
  },
  {
    symbol: 'XAU/USD',
    name: 'Spot Gold / USD',
    category: 'METALS',
    bid: 4174.20,
    ask: 4174.50,
    change24h: 1.42,
    spreadPips: '0.30 pips',
    high24h: 4188.50,
    low24h: 4160.10,
    tagKey: 'tagTopVolatility',
  },
  {
    symbol: 'MCL1!',
    name: 'Micro WTI Crude Oil (OANDA/NYMEX)',
    category: 'COMMODITIES',
    bid: 87.62,
    ask: 87.65,
    change24h: 1.12,
    spreadPips: '0.03 pips',
    high24h: 88.50,
    low24h: 86.80,
    tagKey: 'tagOanda',
    source: 'ALLTICK_LIVE',
  },
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin / US Dollar',
    category: 'CRYPTO',
    bid: 85845.00,
    ask: 85855.00,
    change24h: 2.85,
    spreadPips: '10.0 pips',
    high24h: 86900.0,
    low24h: 84800.0,
    tagKey: 'tagCrypto',
  },
  {
    symbol: 'AUD/USD',
    name: 'Australian Dollar / USD',
    category: 'FOREX',
    bid: 0.69695,
    ask: 0.69707,
    change24h: 0.22,
    spreadPips: '0.12 pips',
    high24h: 0.7010,
    low24h: 0.6930,
    tagKey: 'tagAsiaPac',
  },
  {
    symbol: 'USD/CAD',
    name: 'US Dollar / CAD',
    category: 'FOREX',
    bid: 1.42555,
    ask: 1.42570,
    change24h: -0.09,
    spreadPips: '0.15 pips',
    high24h: 1.4290,
    low24h: 1.4210,
    tagKey: 'tagCommodityFx',
  },
  {
    symbol: 'US30',
    name: 'Wall Street 30 Index',
    category: 'INDICES',
    bid: 51265.0,
    ask: 51268.0,
    change24h: 0.55,
    spreadPips: '3.0 pts',
    high24h: 51450.0,
    low24h: 50950.0,
    tagKey: 'tagUsSession',
  },
];

export const MarketLivePricesTicker: React.FC = () => {
  const { t } = useTranslation();
  const [pairs, setPairs] = useState<MarketPairPrice[]>(DEFAULT_TOP_PAIRS);
  const [lastTickSymbol, setLastTickSymbol] = useState<string | null>(null);

  const getPairTag = (pair: MarketPairPrice) => {
    if (pair.tagKey && (t.marketTicker as any)[pair.tagKey]) {
      return (t.marketTicker as any)[pair.tagKey];
    }
    return pair.tag || t.marketTicker.topTradingPairs;
  };

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
            <Zap size={11} className="market-zap-icon" /> {t.marketTicker.badgeTitle}
          </span>
          <span className="market-badge-sub">{t.marketTicker.badgeSubtitle}</span>
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
                    <span className="rate-label">{t.marketTicker.bid}</span>
                    <span
                      className={`rate-val tabular ${pair.priceDirection === 'up' ? 'text-tiffany' : pair.priceDirection === 'down' ? 'text-red' : ''}`}
                    >
                      {formatPrice(pair.symbol, pair.bid)}
                    </span>
                  </div>

                  <div className="rate-divider">/</div>

                  <div className="rate-col">
                    <span className="rate-label">{t.marketTicker.ask}</span>
                    <span className="rate-val tabular text-muted">
                      {formatPrice(pair.symbol, pair.ask)}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Spread & Tag */}
                <div className="market-pair-footer">
                  <span className="market-spread-tag">
                    {t.marketTicker.spread} <strong>{pair.spreadPips}</strong>
                  </span>
                  <span className="market-perf-tag">{getPairTag(pair)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
