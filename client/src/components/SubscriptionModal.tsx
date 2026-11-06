import React from 'react';
import { SubscriptionStatus } from '../../../shared/src/types.ts';
import { useTranslation } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Crown,
  CheckCircle2,
  ShieldCheck,
  X,
  TrendingUp,
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription?: SubscriptionStatus;
  onSubscriptionChange?: (sub: SubscriptionStatus) => void;
  onNavigateToDailyIntel?: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onNavigateToDailyIntel,
}) => {
  const { language } = useTranslation();
  const { user } = useAuth();

  if (!isOpen) return null;

  const unlockedFeatures = [
    language === 'ja'
      ? '全時間軸（1分〜週足）対応のカスタム戦略ジェネレーター'
      : language === 'zh'
      ? '全周期 (1分至周线) 定制化战略交易方案生成'
      : 'Custom Strategic Timeframe Generator (1m to 1W)',
    language === 'ja'
      ? 'ForexFactory リアルタイム重要経済指標 & 要約'
      : language === 'zh'
      ? 'ForexFactory 实时重磅宏观财经事件深度剖析'
      : 'Real-Time ForexFactory High-Impact Economic Releases',
    language === 'ja'
      ? '機関投資家 SMC オーダーブロック & 意識価格帯'
      : language === 'zh'
      ? '机构级 SMC 订单块与供需核心价格矩阵'
      : 'SMC Institutional Order Blocks & Key Support/Resistance',
    language === 'ja'
      ? 'エントリー価格・厳格損切り・多段階利確目標の自動算出'
      : language === 'zh'
      ? '精确入场区间、失效止损与多重止盈目标测算'
      : 'Bespoke Entry Zones, Invalidation Stops & Take Profits',
    language === 'ja'
      ? 'ロンドン・NY・東京セッションの最適取引ウィンドウ'
      : language === 'zh'
      ? '伦敦、纽约、东京三大主要时区最佳交易窗口'
      : 'Optimal Session Windows (London, NY, Tokyo)',
    language === 'ja'
      ? '資金管理ルールに基づく 1% リスク自動計算ロット'
      : language === 'zh'
      ? '基于 1% 账户资金风控模型的精准手数仓位计算'
      : 'Automated 1% Equity Risk Lot Size Calculations',
    language === 'ja'
      ? '公式トーナメント参加 & リワード賞金プール対象'
      : language === 'zh'
      ? '官方实盘电竞锦标赛参赛资格与保底奖金角逐'
      : 'Official Tournament Eligibility & Cash Prize Pools',
    language === 'ja'
      ? '公式ランキング認証バッジ & 経験値 (XP) 蓄積'
      : language === 'zh'
      ? '全球排行榜官方实盘认证徽章与赛季经验值累计'
      : 'Verified Rank Crest & Organic Gamification XP Accumulation',
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 10, 16, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, rgba(14, 23, 33, 0.98) 0%, rgba(9, 14, 22, 0.98) 100%)',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          borderRadius: '24px',
          padding: '36px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 240, 255, 0.15)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#848E9C',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#848E9C';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          <X size={18} />
        </button>

        {/* Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '20px',
              background: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              color: '#00F0FF',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              marginBottom: '12px',
            }}
          >
            <Crown size={15} color="#FFD700" />
            <span>
              {language === 'ja'
                ? 'PRO 全機能無制限アクセス'
                : language === 'zh'
                ? 'PRO 全功能通道已生效'
                : 'PRO ALL-ACCESS ENABLED'}
            </span>
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#FFFFFF', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            {language === 'ja'
              ? 'すべてのプロ機能が完全開放中'
              : language === 'zh'
              ? '全部机构级工具对验证交易员全量开放'
              : 'Institutional Pro Tools Fully Unlocked'}
          </h2>
          <p style={{ color: '#848E9C', fontSize: '14px', maxWidth: '520px', margin: '0 auto', lineHeight: 1.5 }}>
            {language === 'ja'
              ? 'TradeRank は閲覧専用の透明な実盤競技場です。有料サブスクリプションの課金なく、全機能が無料でご利用いただけます。'
              : language === 'zh'
              ? 'TradeRank 为零写入实盘透明竞技平台，所有高级研报、SMC图表与多周期生成器均对所有交易员免费开放。'
              : 'TradeRank operates in 100% view-only transparency. All premium AI strategy generators, ForexFactory digests, and SMC order block tools are unlocked with zero fees.'}
          </p>
        </div>

        {/* Status Highlight Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(0, 218, 198, 0.1) 0%, rgba(14, 20, 31, 0.6) 100%)',
            border: '1px solid rgba(0, 218, 198, 0.3)',
            borderRadius: '16px',
            padding: '18px 22px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(0, 218, 198, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={24} color="#00DAC6" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#848E9C', textTransform: 'uppercase', fontWeight: 700 }}>
                {language === 'ja' ? 'アカウント状態' : language === 'zh' ? '账户认证状态' : 'Membership Tier'}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF' }}>
                {user ? `${user.username} • Verified Pro Trader` : 'Verified TraderRank Contender'}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              background: 'rgba(0, 218, 198, 0.15)',
              border: '1px solid #00DAC6',
              color: '#00DAC6',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            {language === 'ja' ? '無料・生涯有効' : language === 'zh' ? '永久免费畅享' : '100% Free Lifetime'}
          </div>
        </div>

        {/* Feature List */}
        <div style={{ marginBottom: '28px' }}>
          <h4
            style={{
              fontSize: '12px',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: '#848E9C',
              letterSpacing: '0.8px',
              margin: '0 0 14px 0',
            }}
          >
            {language === 'ja'
              ? '利用可能なプロ機能一覧'
              : language === 'zh'
              ? '已为您解锁的核心权益'
              : 'Included Features & Capabilities'}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {unlockedFeatures.map((feat, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '13px',
                  color: '#CBD5E1',
                  lineHeight: 1.4,
                }}
              >
                <CheckCircle2 size={16} color="#00DAC6" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              onClose();
              if (onNavigateToDailyIntel) {
                onNavigateToDailyIntel();
              }
            }}
            style={{
              flex: '1 1 200px',
              padding: '14px 24px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #00F0FF 0%, #00DAC6 100%)',
              border: 'none',
              color: '#080E14',
              fontSize: '14px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0, 240, 255, 0.3)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <TrendingUp size={16} />
            <span>
              {language === 'ja'
                ? '日次インテリジェンスを開く'
                : language === 'zh'
                ? '进入每日交易情报中心'
                : 'Open Daily Intelligence Hub'}
            </span>
          </button>

          <button
            onClick={onClose}
            style={{
              padding: '14px 24px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {language === 'ja' ? '閉じる' : language === 'zh' ? '关闭' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
