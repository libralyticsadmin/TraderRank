import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  ShieldAlert,
  Compass,
  RefreshCw,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  AiChartAnalysisReport,
  TrendSentiment,
  AiBiasType,
} from '../../../shared/src/types.ts';
import { useTranslation } from '../context/LanguageContext.tsx';

interface AiChartAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  onTogglePlotLevels: (enabled: boolean, report: AiChartAnalysisReport | null) => void;
  isPlottedOnChart: boolean;
}

export const AiChartAnalysisModal: React.FC<AiChartAnalysisModalProps> = ({
  isOpen,
  onClose,
  symbol,
  onTogglePlotLevels,
  isPlottedOnChart,
}) => {
  const { t } = useTranslation();
  const [report, setReport] = useState<AiChartAnalysisReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTfTab, setActiveTfTab] = useState<'ALL' | '15m' | '4h' | '1D' | '1W'>('ALL');

  const fetchAnalysis = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch(`/api/market/ai-analysis?symbol=${symbol}&refresh=${refresh}`);
      if (res.ok) {
        const data = (await res.json()) as AiChartAnalysisReport;
        setReport(data);
      }
    } catch (err) {
      console.error('Failed to fetch AI chart analysis', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalysis(false);
    }
  }, [isOpen, symbol]);

  if (!isOpen) return null;

  const getBiasColor = (bias?: AiBiasType) => {
    switch (bias) {
      case 'STRONG_BUY':
        return '#0abab5';
      case 'BUY':
        return '#10b981';
      case 'STRONG_SELL':
        return '#ef4444';
      case 'SELL':
        return '#f43f5e';
      default:
        return '#fbbf24';
    }
  };

  const getSentimentBadge = (sentiment: TrendSentiment) => {
    switch (sentiment) {
      case 'BULLISH':
      case 'BREAKOUT':
        return {
          label: sentiment,
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.15)',
          border: 'rgba(16, 185, 129, 0.3)',
          icon: TrendingUp,
        };
      case 'BEARISH':
        return {
          label: sentiment,
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.15)',
          border: 'rgba(239, 68, 68, 0.3)',
          icon: TrendingDown,
        };
      default:
        return {
          label: 'RANGING',
          color: '#fbbf24',
          bg: 'rgba(251, 191, 36, 0.15)',
          border: 'rgba(251, 191, 36, 0.3)',
          icon: Activity,
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
          maxWidth: '1100px',
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
                background: 'linear-gradient(135deg, #0abab5, #078c88)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(10, 186, 181, 0.5)',
              }}
            >
              <Brain size={24} color="#000" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                  {t.aiModal.multiTfTitle}
                </h2>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(10, 186, 181, 0.2)',
                    color: '#81d8d0',
                    border: '1px solid rgba(10, 186, 181, 0.4)',
                  }}
                >
                  15M • 4H • 1D • 1W
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {t.aiModal.multiTfSubtitle}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => fetchAnalysis(true)}
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
              title="Re-scan and recalculate AI model"
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              {t.aiModal.reScanAi}
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

        {/* Modal Scrollable Content */}
        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {isLoading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: 'var(--accent-cyan)', fontSize: '14px', fontWeight: 700 }}>
                <RefreshCw size={20} className="animate-spin" /> {t.aiModal.scanningAsset} {symbol}...
              </div>
            </div>
          ) : report ? (
            <>
              {/* 1. Hero Confluence Banner & Overall AI Bias */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '14px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '16px 20px',
                  borderRadius: '14px',
                  border: '1px solid rgba(129, 216, 208, 0.18)',
                }}
              >
                {/* Overall Verdict */}
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {t.aiModal.primaryAiBias}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span
                      style={{
                        fontSize: '18px',
                        fontWeight: 900,
                        color: getBiasColor(report.bias),
                        textShadow: `0 0 16px ${getBiasColor(report.bias)}80`,
                        letterSpacing: '-0.3px',
                      }}
                    >
                      {report.bias.replace('_', ' ')}
                    </span>
                    <Sparkles size={16} color={getBiasColor(report.bias)} />
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Asset: <strong>{report.symbol}</strong> • Multi-Timeframe Alignment
                  </div>
                </div>

                {/* Confluence Score Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {t.aiModal.confluenceScoreLabel}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#81d8d0' }}>
                      {report.confluenceScore}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginTop: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: `${report.confluenceScore}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #0abab5, #81d8d0)',
                        boxShadow: '0 0 10px #0abab5',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '10px', color: '#94aeb0', marginTop: '4px' }}>
                    {t.aiModal.highProbAgreement}
                  </div>
                </div>

                {/* Risk to Reward */}
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {t.aiModal.riskRewardRatioLabel}
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#fbbf24', marginTop: '4px' }}>
                    {report.riskToRewardRatio}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {t.aiModal.swingTargetTp2}
                  </div>
                </div>

                {/* Plot on Chart Action Button */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <button
                    onClick={() => onTogglePlotLevels(!isPlottedOnChart, report)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      background: isPlottedOnChart
                        ? 'linear-gradient(135deg, #0abab5 0%, #078c88 100%)'
                        : 'rgba(10, 186, 181, 0.15)',
                      border: `1px solid ${isPlottedOnChart ? '#0abab5' : 'rgba(10, 186, 181, 0.4)'}`,
                      color: isPlottedOnChart ? '#000' : '#81d8d0',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isPlottedOnChart ? '0 0 18px rgba(10, 186, 181, 0.4)' : 'none',
                    }}
                  >
                    <Target size={15} />
                    {isPlottedOnChart ? t.aiModal.plottedOnChartBtn : t.aiModal.plotOnChartBtn}
                  </button>
                </div>
              </div>

              {/* 2. Four Timeframe Breakdown Cards (15m, 4h, 1D, 1W) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {t.aiModal.multiTfStructureBreakdown}
                  </h3>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['ALL', '15m', '4h', '1D', '1W'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTfTab(tab as any)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: activeTfTab === tab ? '1px solid #0abab5' : '1px solid transparent',
                          background: activeTfTab === tab ? 'rgba(10, 186, 181, 0.2)' : 'transparent',
                          color: activeTfTab === tab ? '#81d8d0' : 'var(--text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  {[
                    report.timeframes.m15,
                    report.timeframes.h4,
                    report.timeframes.d1,
                    report.timeframes.w1,
                  ]
                    .filter(tf => activeTfTab === 'ALL' || activeTfTab === tf.timeframe)
                    .map(tf => {
                      const badge = getSentimentBadge(tf.sentiment);
                      const Icon = badge.icon;
                      return (
                        <div
                          key={tf.timeframe}
                          style={{
                            background: 'rgba(12, 28, 33, 0.65)',
                            border: '1px solid rgba(129, 216, 208, 0.15)',
                            borderRadius: '12px',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: 900,
                                    color: '#fff',
                                    padding: '2px 6px',
                                    borderRadius: '5px',
                                    background: 'rgba(255,255,255,0.08)',
                                  }}
                                >
                                  {tf.timeframe}
                                </span>
                                <span style={{ fontSize: '11px', color: '#94aeb0', fontWeight: 600 }}>{tf.label}</span>
                              </div>

                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: badge.bg,
                                  color: badge.color,
                                  border: `1px solid ${badge.border}`,
                                }}
                              >
                                <Icon size={11} /> {badge.label}
                              </span>
                            </div>

                            <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4', marginBottom: '10px' }}>
                              {tf.keyObservation}
                            </p>
                          </div>

                          <div
                            style={{
                              paddingTop: '10px',
                              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>EMA Trend:</span>
                              <span style={{ color: '#81d8d0' }}>{tf.emaTrend}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>RSI (14):</span>
                              <span style={{ color: tf.rsi >= 60 ? '#10b981' : tf.rsi <= 40 ? '#ef4444' : '#fbbf24' }}>
                                {tf.rsi} ({tf.rsiState})
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Volatility:</span>
                              <span style={{ color: '#cbd5e1' }}>{tf.volatility}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* 3. High-Probability Tactical Trade Blueprint & Support/Resistance Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
                {/* Trade Blueprint */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(10, 186, 181, 0.3)',
                    borderRadius: '14px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Compass size={16} color="#0abab5" />
                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                      {t.aiModal.tacticalBlueprintTitle}
                    </h4>
                  </div>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '14px' }}>
                    {report.tacticalPlan}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontFamily: 'monospace' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t.intel.entryZone}</div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#81d8d0', marginTop: '2px' }}>
                        {report.keyLevels.entryZone[0]} - {report.keyLevels.entryZone[1]}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#f87171' }}>{t.intel.stopLoss} (SL)</div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>
                        {report.keyLevels.stopLoss}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16,185,129,0.2)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#6ee7b7' }}>{t.intel.takeProfit2}</div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                        {report.keyLevels.tp2}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Support / Resistance Pivot Matrix */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(129, 216, 208, 0.18)',
                    borderRadius: '14px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Layers size={16} color="#fbbf24" />
                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                      {t.aiModal.keyLevelsMatrixTitle}
                    </h4>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'monospace', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f43f5e' }}>
                      <span>Major Resistance 2 (R2):</span>
                      <strong>{report.keyLevels.r2}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fb7185' }}>
                      <span>Resistance 1 (R1):</span>
                      <strong>{report.keyLevels.r1}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fbbf24', padding: '2px 0', borderTop: '1px dashed rgba(255,255,255,0.1)', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                      <span>Pivot Equilibrium (P):</span>
                      <strong>{report.keyLevels.pivot}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                      <span>Support 1 (S1):</span>
                      <strong>{report.keyLevels.s1}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                      <span>Major Support 2 (S2):</span>
                      <strong>{report.keyLevels.s2}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. AI Executive Institutional Summary Narrative */}
              <div
                style={{
                  background: 'rgba(10, 186, 181, 0.05)',
                  border: '1px solid rgba(10, 186, 181, 0.25)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Sparkles size={15} color="#0abab5" />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#81d8d0', textTransform: 'uppercase' }}>
                    {t.aiModal.institutionalCommentaryTitle}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.6' }}>
                  {report.summary}
                </p>
              </div>

              {/* 5. Catalysts & Risk Factors */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ShieldAlert size={15} color="#f59e0b" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase' }}>
                    {t.aiModal.riskFactorsTitle}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {report.catalystsAndRisks.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94aeb0' }}>
                      <ChevronRight size={12} color="#0abab5" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
