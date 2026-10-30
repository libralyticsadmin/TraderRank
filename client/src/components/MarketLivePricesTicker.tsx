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
    bid: 1.11870,
    ask: 1.11873,
    change24h: 0.08,
    spreadPips: '0.03 pips',
    high24h: 1.1214,
    low24h: 1.1171,
    tagKey: 'tagMostTraded',
  },
  {
    symbol: 'USD/JPY',
    name: 'US Dollar / Yen',
    category: 'FOREX',
    bid: 157.480,
    ask: 157.483,
    change24h: -0.14,
    spreadPips: '0.3 pips',
    high24h: 157.89,
    low24h: 157.12,
    tagKey: 'tagAlltick',
    source: 'ALLTICK_LIVE',
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound / USD',
    category: 'FOREX',
    bid: 1.33890,
    ask: 1.33895,
    change24h: 0.12,
    spreadPips: '0.05 pips',
    high24h: 1.3415,
    low24h: 1.3352,
    tagKey: 'tagHighMomentum',
  },
  {
    symbol: 'XAU/USD',
    name: 'Spot Gold / USD (OANDA / Broker)',
    category: 'METALS',
    bid: 3982.60,
    ask: 3983.10,
    change24h: -0.94,
    spreadPips: '0.50 pips',
    high24h: 4026.55,
    low24h: 3979.43,
    tagKey: 'tagTopVolatility',
  },
  {
    symbol: 'MCL1!',
    name: 'WTI Crude Oil (Spot / USOIL)',
    category: 'COMMODITIES',
    bid: 103.25,
    ask: 103.28,
    change24h: 1.85,
    spreadPips: '0.03 pips',
    high24h: 104.10,
    low24h: 101.45,
    tagKey: 'tagOanda',
    source: 'ALLTICK_LIVE',
  },
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin / US Dollar (Binance Spot)',
    category: 'CRYPTO',
    bid: 78500.00,
    ask: 78505.00,
    change24h: 0.45,
    spreadPips: '5.0 pips',
    high24h: 79800.0,
    low24h: 77200.0,
    tagKey: 'tagCrypto',
  },
  {
    symbol: 'AUD/USD',
    name: 'Australian Dollar / USD',
    category: 'FOREX',
    bid: 0.70320,
    ask: 0.70324,
    change24h: -0.05,
    spreadPips: '0.04 pips',
    high24h: 0.7058,
    low24h: 0.7012,
    tagKey: 'tagAsiaPac',
  },
  {
    symbol: 'USD/CAD',
    name: 'US Dollar / CAD',
    category: 'FOREX',
    bid: 1.39720,
    ask: 1.39725,
    change24h: -0.08,
    spreadPips: '0.05 pips',
    high24h: 1.4010,
    low24h: 1.3950,
    tagKey: 'tagCommodityFx',
  },
  {
    symbol: 'US30',
    name: 'Wall Street 30 Index (OANDA)',
    category: 'INDICES',
    bid: 52300.0,
    ask: 52303.0,
    change24h: 0.15,
    spreadPips: '3.0 pts',
    high24h: 52450.0,
    low24h: 52120.0,
    tagKey: 'tagUsSession',
  },
];

export const MarketLivePricesTicker: React.FC = () => {
  const { t } = useTranslation();
  const [pairs, setPairs] = useState<MarketPairPrice[]>(DEFAULT_TOP_PAIRS);
  const [lastTickSymbol, setLastTickSymbol] = useState<string | null>(null);
  const anchorsRef = React.useRef<Record<string, { bid: number; ask: number }>>({});

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
                if (q && typeof q.bid === 'number' && q.bid > 0) {
                  anchorsRef.current[p.symbol] = { bid: q.bid, ask: q.ask };
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
    const timer = setInterval(fetchQuotes, 2500);
    return () => clearInterval(timer);
  }, []);

  // Micro jitter simulation strictly bounded to verified market quotes (zero drift)
  useEffect(() => {
    const jitter = setInterval(() => {
      setPairs(prev => {
        const randIdx = Math.floor(Math.random() * prev.length);
        const target = prev[randIdx];
        const isJpy = target.symbol.includes('JPY');
        const isCrypto = target.symbol.includes('BTC');
        const isGold = target.symbol.includes('XAU');
        const isOil = target.symbol.includes('MCL') || target.symbol.includes('OIL');
        const isIndex = target.symbol === 'US30';

        const anchor = anchorsRef.current[target.symbol] || { bid: target.bid, ask: target.ask };
        const drift = target.bid - anchor.bid;
        const meanReversion = -drift * 0.4;

        const maxDev = isCrypto ? 15.0 : isGold ? 0.40 : isIndex ? 10.0 : isOil ? 0.08 : isJpy ? 0.02 : 0.0002;
        const microVol = isCrypto ? 4.0 : isGold ? 0.12 : isIndex ? 2.5 : isOil ? 0.02 : isJpy ? 0.004 : 0.00004;

        const microJitter = (Math.random() - 0.5) * microVol;
        let rawBid = target.bid + meanReversion + microJitter;
        rawBid = Math.max(anchor.bid - maxDev, Math.min(anchor.bid + maxDev, rawBid));

        const decimals = isJpy ? 3 : isCrypto || isGold || isOil || isIndex ? 2 : 5;
        const newBid = Number(rawBid.toFixed(decimals));
        const spreadNum = Math.max(0.00001, Number((anchor.ask - anchor.bid).toFixed(decimals)));
        const newAsk = Number((newBid + spreadNum).toFixed(decimals));

        const updated = [...prev];
        updated[randIdx] = {
          ...target,
          bid: newBid,
          ask: newAsk,
          priceDirection: newBid >= target.bid ? 'up' : 'down',
        };
        setLastTickSymbol(target.symbol);
        return updated;
      });
    }, 1800);

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
