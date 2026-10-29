import React, { useState, useEffect } from 'react';
import {
  DailyIntelReport,
  CustomStrategyInput,
  CustomStrategyOutput,
  SubscriptionStatus,
  StrategicTimeframe,
  TradingStyle,
  StrategyModel,
  RiskTolerance,
  SessionFocus,
} from '../../../shared/src/types.ts';
import { useTranslation } from '../context/LanguageContext.tsx';
import {
  Calendar,
  Sparkles,
  Lock,
  Crown,
  Sliders,
  CheckCircle2,
  Zap,
  RefreshCw,
  Globe2,
  Flame,
  AlertOctagon,
  ArrowRightLeft,
} from 'lucide-react';

interface DailyAnalysisHubProps {
  subscription: SubscriptionStatus;
  onOpenSubscriptionModal: () => void;
}

export const DailyAnalysisHub: React.FC<DailyAnalysisHubProps> = ({
  subscription,
  onOpenSubscriptionModal,
}) => {
  const { t } = useTranslation();
  const [report, setReport] = useState<DailyIntelReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<string>('XAUUSD');

  // Custom Strategy Generator State
  const [customSymbol, setCustomSymbol] = useState<string>('XAUUSD');
  const [customTimeframe, setCustomTimeframe] = useState<StrategicTimeframe>('15m');
  const [customStyle, setCustomStyle] = useState<TradingStyle>('INTRADAY');
  const [customModel, setCustomModel] = useState<StrategyModel>('SMC_ORDER_BLOCK');
  const [customRisk, setCustomRisk] = useState<RiskTolerance>('MODERATE');
  const [customSession, setCustomSession] = useState<SessionFocus>('LONDON');
  const [accountSize, setAccountSize] = useState<number>(10000);

  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<CustomStrategyOutput | null>(null);

  // Fetch Daily Report on mount
  const fetchDailyReport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/market/daily-intel?isSubscriber=${subscription.isActive}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to fetch daily intelligence', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyReport();
  }, [subscription.isActive]);

  // Generate Custom Strategy
  const handleGenerateCustomStrategy = async (e?: React.FormEvent, overrideSymbol?: string) => {
    if (e) e.preventDefault();

    if (!subscription.isActive) {
      onOpenSubscriptionModal();
      return;
    }

    const targetSymbol = overrideSymbol || customSymbol;
    if (overrideSymbol) {
      setCustomSymbol(overrideSymbol);
    }

    setIsGeneratingStrategy(true);
    try {
      const input: CustomStrategyInput = {
        symbol: targetSymbol,
        timeframe: customTimeframe,
        tradingStyle: customStyle,
        strategyModel: customModel,
        riskTolerance: customRisk,
        sessionFocus: customSession,
        accountSize,
      };

      const res = await fetch('/api/market/custom-daily-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedPlan(data);
      }
    } catch (err) {
      console.error('Failed to generate custom strategy', err);
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  // Initial custom strategy generation for active subscribers
  useEffect(() => {
    if (subscription.isActive && !generatedPlan) {
      handleGenerateCustomStrategy();
    }
  }, [subscription.isActive]);

  const activeAssetData = report?.assetAnalyses?.find(a => a.symbol === selectedAsset) || report?.assetAnalyses?.[0];

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Subscription Status Bar */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(17, 30, 34, 0.95) 0%, rgba(13, 21, 24, 0.95) 100%)',
          border: '1px solid rgba(10, 186, 181, 0.25)',
          borderRadius: '16px',
          padding: '24px 28px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(10, 186, 181, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0 }}>
                {t.intel.title}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {report?.formattedDate || t.intel.todayMarketSummary} • {t.intel.separateFromChart}
              </span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0', maxWidth: '600px' }}>
            {t.intel.subtitle}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {subscription.isActive ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '12px',
                background: 'rgba(10, 186, 181, 0.15)',
                border: '1px solid var(--accent-cyan)',
                color: 'var(--accent-cyan)',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              <Crown size={16} color="#ffd700" />
              <span>{t.intel.proUnlocked}</span>
            </div>
          ) : (
            <button
              className="btn-primary"
              onClick={onOpenSubscriptionModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 700,
                background: 'linear-gradient(90deg, #0ABAB5 0%, #81d8d0 100%)',
                color: '#081014',
                boxShadow: '0 4px 20px rgba(10, 186, 181, 0.4)',
              }}
            >
              <Crown size={16} /> {t.intel.unlockProBtn}
            </button>
          )}

          <button
            onClick={fetchDailyReport}
            disabled={isLoading}
            className="btn-secondary"
            title={t.intel.refreshReport}
            style={{ padding: '10px 14px' }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Market Sentiment & Macro Regime Banner */}
      {report && (
        <div
          style={{
            background: 'rgba(17, 30, 34, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Flame size={16} color="#f59e0b" />
              <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t.intel.marketRegime}
              </span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)', margin: '0 0 6px 0' }}>
              {report.marketRegime}
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
              {report.headline}
            </p>
          </div>

          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              padding: '14px 18px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.intel.macroSentimentIndex}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-green)' }}>
                {report.macroSentimentLabel}
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${report.macroSentimentScore}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0ABAB5, #10b981)',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: CUSTOM STRATEGIC TIMEFRAME & TRADE PLAN GENERATOR */}
      <div
        style={{
          background: 'linear-gradient(180deg, #111e22 0%, #0d1518 100%)',
          border: '1px solid rgba(10, 186, 181, 0.3)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={20} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0 }}>
                {t.intel.customTimeframeEngine}
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              {t.intel.customTimeframeDesc}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '8px',
              background: 'rgba(10, 186, 181, 0.1)',
              border: '1px solid rgba(10, 186, 181, 0.2)',
              fontSize: '11px',
              color: 'var(--accent-cyan)',
              fontWeight: 600,
            }}
          >
            <Sparkles size={13} />
            <span>{t.intel.confluenceEngineBadge}</span>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <form onSubmit={handleGenerateCustomStrategy}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            {/* 1. Asset / Symbol */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t.intel.assetFocus}
              </label>
              <select
                value={customSymbol}
                onChange={e => setCustomSymbol(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#0d1518',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '13px',
                }}
              >
                <option value="XAUUSD">XAU/USD (Spot Gold)</option>
                <option value="MCL1!">MCL1! (Micro WTI Crude Oil)</option>
                <option value="EURUSD">EUR/USD</option>
                <option value="GBPUSD">GBP/USD</option>
                <option value="AUDUSD">AUD/USD (Aussie)</option>
                <option value="USDCAD">USD/CAD (Loonie)</option>
                <option value="USDJPY">USD/JPY</option>
                <option value="BTCUSD">BTC/USD (Bitcoin)</option>
                <option value="ETHUSD">ETH/USD (Ethereum)</option>
              </select>
            </div>

            {/* 2. Strategic Timeframe */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t.intel.strategicTimeframe}
              </label>
              <select
                value={customTimeframe}
                onChange={e => setCustomTimeframe(e.target.value as StrategicTimeframe)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#0d1518',
                  border: '1px solid rgba(10, 186, 181, 0.3)',
                  color: 'var(--accent-cyan)',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                <option value="1m">1m (Ultra-Fast Scalp)</option>
                <option value="5m">5m (Momentum Scalp)</option>
                <option value="15m">15m (Intraday Setup)</option>
                <option value="1H">1H (Session Trend)</option>
                <option value="4H">4H (Swing Highs/Lows)</option>
                <option value="1D">1D (Daily Range)</option>
                <option value="1W">1W (Macro Position)</option>
              </select>
            </div>

            {/* 3. Trading Style */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t.intel.tradingStyle}
              </label>
              <select
                value={customStyle}
                onChange={e => setCustomStyle(e.target.value as TradingStyle)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#0d1518',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '13px',
                }}
              >
                <option value="SCALPER">Scalper (Quick In/Out)</option>
                <option value="INTRADAY">Intraday (Day Trading)</option>
                <option value="SWING">Swing (Multi-Day Hold)</option>
                <option value="POSITION">Position (Multi-Week)</option>
              </select>
            </div>

            {/* 4. Strategy Model */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t.intel.strategyModel}
              </label>
              <select
                value={customModel}
                onChange={e => setCustomModel(e.target.value as StrategyModel)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#0d1518',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '13px',
                }}
              >
                <option value="SMC_ORDER_BLOCK">Smart Money (SMC / OB)</option>
                <option value="TREND_FOLLOWING">Trend Following (EMA Ribbon)</option>
                <option value="BREAKOUT_MOMENTUM">Breakout &amp; Expansion</option>
                <option value="MEAN_REVERSION">Mean Reversion (Bollinger/RSI)</option>
                <option value="NEWS_VOLATILITY">News Catalyst / Volatility</option>
              </select>
            </div>

            {/* 5. Risk / Reward Target (1:3, 1:5, 1:7) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t.intel.riskRewardTarget}
              </label>
              <select
                value={customRisk}
                onChange={e => setCustomRisk(e.target.value as RiskTolerance)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#0d1518',
                  border: '1px solid rgba(10, 186, 181, 0.4)',
                  color: 'var(--accent-cyan)',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                <option value="RR_1_3">{t.intel.rr1_3}</option>
                <option value="RR_1_5">{t.intel.rr1_5}</option>
                <option value="RR_1_7">{t.intel.rr1_7}</option>
              </select>
            </div>

            {/* 6. Target Session */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                {t.intel.sessionWindow}
              </label>
              <select
                value={customSession}
                onChange={e => setCustomSession(e.target.value as SessionFocus)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#0d1518',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '13px',
                }}
              >
                <option value="LONDON">London Open (07:00-10:30 UTC)</option>
                <option value="NEW_YORK">NY Overlap (13:00-16:30 UTC)</option>
                <option value="ASIAN">Asian Session (00:00-06:00 UTC)</option>
                <option value="ALL_SESSIONS">24/7 All Sessions</option>
              </select>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.intel.accountSize}</span>
              <input
                type="number"
                value={accountSize}
                onChange={e => setAccountSize(Number(e.target.value))}
                step={1000}
                min={500}
                style={{
                  width: '110px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: '#0d1518',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '13px',
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>USD</span>
            </div>

            <button
              type="submit"
              disabled={isGeneratingStrategy}
              style={{
                padding: '12px 24px',
                borderRadius: '10px',
                background: 'linear-gradient(90deg, #0ABAB5 0%, #81d8d0 100%)',
                border: 'none',
                color: '#081014',
                fontSize: '14px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: isGeneratingStrategy ? 'wait' : 'pointer',
                boxShadow: '0 4px 20px rgba(10, 186, 181, 0.35)',
              }}
            >
              <Zap size={16} />
              {isGeneratingStrategy ? t.intel.synthesizingConfluence : t.intel.generateCustomStrategy}
            </button>
          </div>
        </form>

        {/* Output Tactical Trade Plan Card */}
        {generatedPlan && subscription.isActive && (
          <div
            style={{
              marginTop: '24px',
              padding: '24px',
              borderRadius: '14px',
              background: 'rgba(10, 186, 181, 0.05)',
              border: '1px solid rgba(10, 186, 181, 0.3)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            }}
          >
            {/* Trade Qualification Directive & Rule Banner */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                marginBottom: '20px',
                background: generatedPlan.tradeQualification?.canEnter
                  ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
                  : 'linear-gradient(90deg, rgba(239, 68, 68, 0.16) 0%, rgba(220, 38, 38, 0.08) 100%)',
                border: `1px solid ${generatedPlan.tradeQualification?.canEnter ? 'var(--accent-green)' : '#ef4444'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {generatedPlan.tradeQualification?.canEnter ? (
                    <CheckCircle2 size={22} color="var(--accent-green)" />
                  ) : (
                    <AlertOctagon size={22} color="#ef4444" />
                  )}
                  <div>
                    <h4
                      style={{
                        fontSize: '15px',
                        fontWeight: 800,
                        margin: 0,
                        color: generatedPlan.tradeQualification?.canEnter ? 'var(--accent-green)' : '#f87171',
                      }}
                    >
                      {generatedPlan.tradeQualification?.canEnter
                        ? t.intel.tradeSetupQualified.replace('{targetRR}', generatedPlan.tradeQualification?.targetRR || '1:5')
                        : t.intel.doNotEnterTrade.replace('{targetRR}', generatedPlan.tradeQualification?.targetRR || '1:5')}
                    </h4>
                    <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      {generatedPlan.tradeQualification?.directive}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    padding: '4px 12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#ffd700',
                  }}
                >
                  {t.intel.rrTargetsLabel}
                </div>
              </div>

              {/* Alternative Pair Recommendations if Disqualified */}
              {(!generatedPlan.tradeQualification?.canEnter || (generatedPlan.tradeQualification?.alternativePairSuggestions && generatedPlan.tradeQualification.alternativePairSuggestions.length > 0)) && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '12px', color: '#f59e0b', fontWeight: 700 }}>
                    <ArrowRightLeft size={14} />
                    <span>{t.intel.findAnotherPair}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(generatedPlan.tradeQualification?.alternativePairSuggestions?.length
                      ? generatedPlan.tradeQualification.alternativePairSuggestions
                      : ['XAUUSD', 'EURUSD', 'MCL1!', 'GBPUSD', 'AUDUSD', 'USDCAD', 'BTCUSD']
                    ).map(pair => (
                      <button
                        key={pair}
                        onClick={() => handleGenerateCustomStrategy(undefined, pair)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          background: 'rgba(10, 186, 181, 0.15)',
                          border: '1px solid var(--accent-cyan)',
                          color: 'var(--accent-cyan)',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {t.intel.switchScan} {pair}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    background: generatedPlan.bias.includes('BULLISH') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    border: `1px solid ${generatedPlan.bias.includes('BULLISH') ? 'var(--accent-green)' : '#ef4444'}`,
                    color: generatedPlan.bias.includes('BULLISH') ? 'var(--accent-green)' : '#ef4444',
                    fontWeight: 800,
                    fontSize: '14px',
                  }}
                >
                  {generatedPlan.bias.replace('_', ' ')} • {generatedPlan.symbol} ({generatedPlan.timeframe})
                </div>

                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {t.intel.strategyModel}: <strong>{generatedPlan.strategyModel.replace('_', ' ')}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.intel.confluenceScore}</span>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: 'rgba(10, 186, 181, 0.2)',
                    color: 'var(--accent-cyan)',
                    fontSize: '13px',
                    fontWeight: 800,
                  }}
                >
                  {generatedPlan.confluenceScore}%
                </span>
              </div>
            </div>

            {/* Tactical Levels Grid (with TP1 1:3, TP2 1:5, TP3 1:7 Runner) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t.intel.optimalEntryZone}</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  {generatedPlan.tacticalLevels.entryZone[0]} - {generatedPlan.tacticalLevels.entryZone[1]}
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <span style={{ fontSize: '11px', color: '#f87171', display: 'block', marginBottom: '4px' }}>{t.intel.stopLoss}</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#f87171' }}>
                  {generatedPlan.tacticalLevels.stopLoss}
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ fontSize: '11px', color: 'var(--accent-green)', display: 'block', marginBottom: '4px' }}>{t.intel.takeProfit1}</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-green)' }}>
                  {generatedPlan.tacticalLevels.takeProfit1}
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ fontSize: '11px', color: 'var(--accent-green)', display: 'block', marginBottom: '4px' }}>{t.intel.takeProfit2}</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-green)' }}>
                  {generatedPlan.tacticalLevels.takeProfit2}
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <span style={{ fontSize: '11px', color: 'var(--accent-green)', display: 'block', marginBottom: '4px' }}>{t.intel.takeProfit3}</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-green)' }}>
                  {generatedPlan.tacticalLevels.takeProfit3}
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t.intel.riskRewardLots}</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffd700' }}>
                  {generatedPlan.tacticalLevels.riskRewardRatio} ({generatedPlan.tacticalLevels.suggestedLotSize} Lots)
                </span>
              </div>
            </div>

            {/* Strategic Narrative Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h5 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--accent-cyan)', margin: '0 0 6px 0' }}>
                  {t.intel.marketStructureContext}
                </h5>
                <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>
                  {generatedPlan.strategyNarrative.marketStructureContext}
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h5 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--accent-green)', margin: '0 0 6px 0' }}>
                  {t.intel.entryTriggerRule}
                </h5>
                <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>
                  {generatedPlan.strategyNarrative.entryTriggerRule}
                </p>
              </div>
            </div>

            {/* Invalidation & Session Timing */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <h5 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#f87171', margin: '0 0 6px 0' }}>
                  {t.intel.strictInvalidationScenario}
                </h5>
                <p style={{ fontSize: '13px', color: '#fca5a5', margin: 0, lineHeight: 1.5 }}>
                  {generatedPlan.strategyNarrative.invalidationScenario}
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h5 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#ffd700', margin: '0 0 6px 0' }}>
                  {t.intel.optimalSessionExecution}
                </h5>
                <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>
                  {generatedPlan.strategyNarrative.optimalSessionWindow}
                </p>
              </div>
            </div>

            {/* Checklist */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px 18px', borderRadius: '10px' }}>
              <h5 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                {t.intel.preExecutionChecklist}
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {generatedPlan.checklist.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#e2e8f0' }}>
                    <CheckCircle2 size={15} color={item.status === 'CONFIRMED' ? 'var(--accent-green)' : '#f59e0b'} />
                    <span>{item.step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Non-Subscriber Paywall Layer for Custom Strategy */}
        {!subscription.isActive && (
          <div
            style={{
              position: 'absolute',
              top: '120px',
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(13, 21, 24, 0.85)',
              backdropFilter: 'blur(8px)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              textAlign: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(10, 186, 181, 0.15)',
                border: '1px solid var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
                marginBottom: '16px',
              }}
            >
              <Lock size={26} />
            </div>

            <h4 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
              {t.intel.unlockGeneratorModalTitle}
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '460px', marginBottom: '20px' }}>
              {t.intel.unlockGeneratorModalDesc}
            </p>

            <button
              onClick={onOpenSubscriptionModal}
              style={{
                padding: '12px 28px',
                borderRadius: '10px',
                background: 'linear-gradient(90deg, #0ABAB5 0%, #81d8d0 100%)',
                border: 'none',
                color: '#081014',
                fontSize: '15px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(10, 186, 181, 0.4)',
              }}
            >
              <Crown size={16} /> {t.intel.unlockBtn}
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: TODAY'S FOREXFACTORY MACRO NEWS DIGEST */}
      {report && (
        <div
          style={{
            background: 'rgba(17, 30, 34, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px 28px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe2 size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                {t.intel.forexFactoryReleasesTitle}
              </h3>
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: 700,
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              {t.intel.highImpactReleasesToday.replace('{count}', String(report.forexFactoryDigest.highImpactCount))}
            </span>
          </div>

          <p style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px', lineHeight: 1.5 }}>
            {report.forexFactoryDigest.marketReactionSummary}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {report.forexFactoryDigest.todayEvents.map(evt => (
              <div
                key={evt.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: `1px solid ${evt.isHighImpact ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: evt.isHighImpact ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: evt.isHighImpact ? '#ef4444' : '#f59e0b',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {evt.country}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>{evt.title}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {t.intel.forecast} <strong style={{ color: '#fff' }}>{evt.forecast || 'N/A'}</strong>
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {t.intel.previous} <strong style={{ color: '#fff' }}>{evt.previous || 'N/A'}</strong>
                  </span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    {evt.timeString || evt.timeUntilFormatted}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: MULTI-ASSET TECHNICAL & FUNDAMENTAL HIGHLIGHTS */}
      {report && (
        <div
          style={{
            background: 'rgba(17, 30, 34, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px 28px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', margin: 0 }}>
                {t.intel.dailyBreakdownTitle}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                {t.intel.dailyBreakdownDesc}
              </p>
            </div>

            {/* Asset Selector Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {report.assetAnalyses.map(asset => (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedAsset(asset.symbol)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    background: selectedAsset === asset.symbol ? 'rgba(10, 186, 181, 0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${selectedAsset === asset.symbol ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                    color: selectedAsset === asset.symbol ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {asset.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Active Asset Card */}
          {activeAssetData && (
            <div
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{activeAssetData.name}</span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: activeAssetData.bias.includes('BULLISH') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: activeAssetData.bias.includes('BULLISH') ? 'var(--accent-green)' : '#ef4444',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      {activeAssetData.bias.replace('_', ' ')}
                    </span>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                    {t.intel.liveAnchor} ${activeAssetData.currentPrice.toLocaleString()}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.intel.volatility}</span>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#f59e0b',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {activeAssetData.sessionVolatilityForecast}
                  </span>
                </div>
              </div>

              {/* Technical & Fundamental Narrative */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h5 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--accent-cyan)', margin: '0 0 6px 0' }}>
                    {t.intel.technicalMarketStructure}
                  </h5>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                    {activeAssetData.technicalSummary}
                  </p>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h5 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--accent-green)', margin: '0 0 6px 0' }}>
                    {t.intel.fundamentalDrivers}
                  </h5>
                  <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
                    {activeAssetData.fundamentalSummary}
                  </p>
                </div>
              </div>

              {/* Order Blocks & Support / Resistance */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
                <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    {t.intel.institutionalDemandBlock}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                    {activeAssetData.orderBlocks.demandZone[0]} - {activeAssetData.orderBlocks.demandZone[1]}
                  </span>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    {t.intel.institutionalSupplyBlock}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>
                    {activeAssetData.orderBlocks.supplyZone[0]} - {activeAssetData.orderBlocks.supplyZone[1]}
                  </span>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    {t.intel.pivotLevels}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffd700' }}>
                    {activeAssetData.supportResistance.s1} • {activeAssetData.supportResistance.pivot} • {activeAssetData.supportResistance.r1}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
