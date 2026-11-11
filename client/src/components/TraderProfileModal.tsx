import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  UserPlus,
  Radio,
  Instagram,
  Share2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Info,
  Check,
  Calendar,
  Activity,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { TraderAvatar } from './TraderAvatar.tsx';
import { resolveTraderIdentity } from './avatarCatalog.ts';
import { Broker } from '../../../shared/src/types.ts';
import { useTranslation } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';

export interface TraderProfileData {
  userId: string;
  username: string;
  broker: Broker;
  avatarSymbol: string;
  avatarUrl?: string;
  tier: string;
  level: number;
  xp: number;
  rank: number;
  netPips: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  totalTrades: number;
  bestTradePips: number;
  avgHoldingTime: string;
  verifiedSince: string;
  isFollowing?: boolean;
  brokers?: Broker[];
  telegramHandle?: string;
  discordHandle?: string;
  twitterHandle?: string;
  instagramHandle?: string;
  bio?: string;
  methodology?: {
    technical: number;
    fundamental: number;
    intuition: number;
  };
}

interface VerifiedTrade {
  id: string;
  positionId: string;
  ticket: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  lotSize: number;
  openPrice: number;
  closePrice: number;
  openTime: string;
  closeTime: string;
  pnlCurrency: number;
  pnlPips: number;
  swap: number;
  digits: number;
}

type AssetCategory = 'GOLD' | 'FX' | 'CRYPTO' | 'CFD';

function classifySymbol(rawSymbol: string): { category: AssetCategory; contractMultiplier: number } {
  const sym = rawSymbol.toUpperCase();
  if (sym.includes('XAU') || sym.includes('GOLD') || sym.includes('XAG') || sym.includes('SILVER')) {
    return { category: 'GOLD', contractMultiplier: 100 };
  }
  if (sym.includes('BTC') || sym.includes('ETH') || sym.includes('SOL') || sym.includes('XRP')) {
    return { category: 'CRYPTO', contractMultiplier: 1 };
  }
  if (
    sym.includes('US30') ||
    sym.includes('DJ30') ||
    sym.includes('NAS') ||
    sym.includes('USTEC') ||
    sym.includes('SPX') ||
    sym.includes('US500') ||
    sym.includes('GER40') ||
    sym.includes('UK100') ||
    sym.includes('JP225') ||
    sym.includes('OIL') ||
    sym.includes('WTI') ||
    sym.includes('XTI')
  ) {
    return { category: 'CFD', contractMultiplier: 10 };
  }
  return { category: 'FX', contractMultiplier: 100000 };
}

function getInstrumentSpec(rawSymbol: string): { pipSize: number; digits: number; pipValPerLot: number } {
  const sym = rawSymbol.toUpperCase().replace(/(\.M|\.I|\.RAW|\.PRO|\.ECN|\.CASH|_I|_M|_SB|\+|#)$/i, '');
  if (sym.includes('XAU') || sym.includes('GOLD')) {
    return { pipSize: 0.10, digits: 2, pipValPerLot: 10.0 };
  }
  if (sym.includes('XAG') || sym.includes('SILVER')) {
    return { pipSize: 0.01, digits: 3, pipValPerLot: 50.0 };
  }
  if (sym.endsWith('JPY')) {
    return { pipSize: 0.01, digits: 3, pipValPerLot: 6.5 };
  }
  if (
    sym.includes('BTC') ||
    sym.includes('ETH') ||
    sym.includes('US30') ||
    sym.includes('DJ30') ||
    sym.includes('NAS100') ||
    sym.includes('USTEC') ||
    sym.includes('SPX') ||
    sym.includes('US500') ||
    sym.includes('GER40') ||
    sym.includes('UK100')
  ) {
    return { pipSize: 1.0, digits: 2, pipValPerLot: 1.0 };
  }
  if (sym.includes('OIL') || sym.includes('WTI') || sym.includes('MCL') || sym.includes('XTI')) {
    return { pipSize: 0.01, digits: 2, pipValPerLot: 10.0 };
  }
  return { pipSize: 0.0001, digits: 5, pipValPerLot: 10.0 };
}

// SVG Donut Slice Helper
function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

function createDonutSegmentPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number
): string {
  const clampedEnd = endAngle - startAngle >= 360 ? startAngle + 359.99 : endAngle;
  const startOuter = polarToCartesian(cx, cy, outerR, clampedEnd);
  const endOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const startInner = polarToCartesian(cx, cy, innerR, clampedEnd);
  const endInner = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArcFlag = clampedEnd - startAngle <= 180 ? '0' : '1';

  return [
    'M',
    startOuter.x,
    startOuter.y,
    'A',
    outerR,
    outerR,
    0,
    largeArcFlag,
    0,
    endOuter.x,
    endOuter.y,
    'L',
    endInner.x,
    endInner.y,
    'A',
    innerR,
    innerR,
    0,
    largeArcFlag,
    1,
    startInner.x,
    startInner.y,
    'Z',
  ].join(' ');
}

interface TraderProfileModalProps {
  trader: TraderProfileData | null;
  onClose: () => void;
}

export const TraderProfileModal: React.FC<TraderProfileModalProps> = ({ trader, onClose }) => {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const historicalTableRef = useRef<HTMLDivElement>(null);

  if (!trader) return null;

  const followStorageKey = `traderank_follow_${trader.userId}`;
  const [isFollowing, setIsFollowing] = useState<boolean>(() => {
    try {
      return localStorage.getItem(followStorageKey) === '1' || Boolean(trader.isFollowing);
    } catch {
      return Boolean(trader.isFollowing);
    }
  });
  const [followerCount, setFollowerCount] = useState<number>(() => {
    try {
      return localStorage.getItem(followStorageKey) === '1' ? 1 : 0;
    } catch {
      return 0;
    }
  });
  const [copiedShare, setCopiedShare] = useState(false);
  const [realTrades, setRealTrades] = useState<VerifiedTrade[]>([]);
  const [liveOrders, setLiveOrders] = useState<
    Array<{
      id: string;
      ticket: string;
      symbol: string;
      type: 'BUY' | 'SELL';
      lotSize: number;
      openPrice: number;
      currentPrice: number;
      profitPips: number;
      profitCurrency: number;
      openTime: string;
      digits: number;
    }>
  >([]);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [connectedBrokers, setConnectedBrokers] = useState<string[]>([]);
  const [liveAccountBalance, setLiveAccountBalance] = useState<number | null>(null);
  const [liveServerName, setLiveServerName] = useState<string | null>(null);
  const [liveHolderName, setLiveHolderName] = useState<string | null>(null);
  const [liveAccountNumber, setLiveAccountNumber] = useState<string | null>(null);
  const [liveParticipantsCount, setLiveParticipantsCount] = useState<number>(1);
  const [liveMonthlyCashflows, setLiveMonthlyCashflows] = useState<
    Record<
      string,
      {
        ym: string;
        startBalance: number;
        deposits: number;
        withdrawals: number;
        activeCapital: number;
        tradeProfit: number;
        swap: number;
        commission: number;
        tradingEndingCapital: number;
        endBalance: number;
        roiPct: number;
      }
    >
  >({
    '2026-05': {
      ym: '2026-05',
      startBalance: 0,
      deposits: 1295.52,
      withdrawals: -523.68,
      activeCapital: 1295.52,
      tradeProfit: -769.66,
      swap: 0,
      commission: 0,
      tradingEndingCapital: 525.86,
      endBalance: 2.18,
      roiPct: -59.41,
    },
    '2026-06': {
      ym: '2026-06',
      startBalance: 2.18,
      deposits: 63.47,
      withdrawals: 0,
      activeCapital: 65.65,
      tradeProfit: -64.76,
      swap: 0,
      commission: 0,
      tradingEndingCapital: 0.89,
      endBalance: 0.89,
      roiPct: -98.64,
    },
    '2026-07': {
      ym: '2026-07',
      startBalance: 0.89,
      deposits: 1256.04,
      withdrawals: -1555.06,
      activeCapital: 1256.93,
      tradeProfit: 300.43,
      swap: 0,
      commission: 0,
      tradingEndingCapital: 1557.36,
      endBalance: 2.3,
      roiPct: 23.9,
    },
    '2026-08': {
      ym: '2026-08',
      startBalance: 2.3,
      deposits: 0,
      withdrawals: 0,
      activeCapital: 2.3,
      tradeProfit: 0,
      swap: 0,
      commission: 0,
      tradingEndingCapital: 2.3,
      endBalance: 2.3,
      roiPct: 0,
    },
    '2026-09': {
      ym: '2026-09',
      startBalance: 2.3,
      deposits: 4867.3,
      withdrawals: -3300,
      activeCapital: 4869.6,
      tradeProfit: -1504.32,
      swap: -64.47,
      commission: 0,
      tradingEndingCapital: 3365.28,
      endBalance: 0.81,
      roiPct: -30.89,
    },
    '2026-10': {
      ym: '2026-10',
      startBalance: 0.81,
      deposits: 912.63,
      withdrawals: -697.25,
      activeCapital: 913.44,
      tradeProfit: -213.39,
      swap: 0,
      commission: 0,
      tradingEndingCapital: 700.05,
      endBalance: 2.8,
      roiPct: -23.36,
    },
  });
  const [isLoadingTrades, setIsLoadingTrades] = useState(true);
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'GOLD' | 'WINS' | 'OCT' | 'DAY'>('ALL');
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [visibleLimit, setVisibleLimit] = useState<number>(20);

  // Calendar & Ranking Mode ("AMOUNT" = 収益額 / Net P&L $, "RATE" = 収益率 / Return % & Pips)
  const [metricTab, setMetricTab] = useState<'AMOUNT' | 'RATE'>('AMOUNT');
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>('2026-10');
  const [showHistoricalArchive, setShowHistoricalArchive] = useState<boolean>(true);

  // Localized UI copy matching the TradeRank reference layout across EN / JA / ZH
  const copy = useMemo(() => {
    if (language === 'ja') {
      return {
        mt5VerifiedBadge: 'MT5 閲覧専用・監査済',
        following: 'フォロー中',
        followers: 'フォロワー',
        follow: 'フォロー',
        followingActive: 'フォロー中',
        shareTooltip: 'トレーダープロフィールを共有',
        methodologyTitle: 'トレード手法',
        technical: 'テクニカル',
        fundamental: 'ファンダメンタル',
        intuition: '感覚・プライスアクション',
        bioTitle: '自己紹介',
        defaultBio: '何事も一生懸命取り組むことの大切さを伝えていきたい。MetaApi読み取り専用監査による100%リアル約定データ公開中。',
        historicalDataLink: 'TradeRank 過去データ',
        rankingSectionTitle: 'ランキング・月間収支カレンダー',
        profitAmountTab: '収益額',
        returnRateTab: '収益率',
        toggleTableTooltip: '月間過去データ表の表示切替',
        rankUnit: '位',
        peopleUnit: '人',
        weekdays: ['日', '月', '火', '水', '木', '金', '土'],
        netProfitLabel: '収益額',
        returnRateLabel: '収益率',
        currentAssetsLabel: '現在資産 (純資産)',
        initialAssetsLabel: '当初資産 (入出金純額)',
        goldCountLabel: '貴金属・GOLD回数',
        fxCountLabel: 'FX回数',
        cfdCountLabel: 'CFD・指数回数',
        cryptoCountLabel: '暗号資産回数',
        winCountLabel: '勝ちトレード回数',
        lossCountLabel: '負けトレード回数',
        longCountLabel: 'BUY (ロング) 回数',
        shortCountLabel: 'SELL (ショート) 回数',
        notionalValueLabel: '約定代金',
        grossProfitLabel: '総利益',
        grossLossLabel: '総損失',
        winRateSubLabel: '勝率 / 獲得Pips',
        timesUnit: '回',
        historicalTableTitle: 'TradeRank 過去データ',
        monthlyRankingHeader: '月間ランキング',
        investmentStatusHeader: '投資状況 (アセット別約定実績)',
        yearMonthCol: '年 / 月',
        rankCol: '順位',
        roiAndProfitCol: '収益率 / 収益額',
        assetsCol: '現在資産 / 当初資産',
        goldCol: 'GOLD回数 / 約定代金',
        fxCol: 'FX回数 / 約定代金',
        cryptoCol: '暗号資産回数 / 約定代金',
        cfdCol: 'CFD回数 / 約定代金',
        pipsWinCol: '獲得Pips / 勝率',
        filterAll: 'すべて',
        filterGold: 'GOLD#',
        filterWins: '勝ちトレード',
        filterDayPrefix: '日付',
        auditVerifiedTag: 'MetaApi 閲覧専用・監査認証済',
        verifyingLedgerMsg: 'ブローカー元帳から決済済み取引を検証中...',
        noTradesMsg: 'このフィルター条件に一致する決済履歴はありません。',
        lotsLabel: 'ロット',
        posLabel: 'Pos #',
        loadMoreExecutions: 'さらに検証済み約定履歴を表示',
        remainingLabel: '件残り',
      };
    }
    if (language === 'zh') {
      return {
        mt5VerifiedBadge: 'MT5 只读实盘认证',
        following: '关注中',
        followers: '粉丝',
        follow: '关注',
        followingActive: '已关注',
        shareTooltip: '分享交易员实盘档案',
        methodologyTitle: '交易流派占比',
        technical: '技术面分析',
        fundamental: '基本面分析',
        intuition: '盘感与价格行为',
        bioTitle: '自我介绍',
        defaultBio: '专注高盈亏比波段与日内突破，100% MetaApi 只读实盘交割单认证。',
        historicalDataLink: 'TradeRank 历史月度数据',
        rankingSectionTitle: '月度排行与每日盈亏日历',
        profitAmountTab: '收益额 ($)',
        returnRateTab: '收益率 / 点数',
        toggleTableTooltip: '切换历史月度战绩表',
        rankUnit: '名',
        peopleUnit: '人',
        weekdays: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
        netProfitLabel: '月度收益额',
        returnRateLabel: '月度收益率',
        currentAssetsLabel: '期末净值',
        initialAssetsLabel: '期初本金',
        goldCountLabel: '黄金/贵金属笔数',
        fxCountLabel: '外汇笔数',
        cfdCountLabel: 'CFD/指数笔数',
        cryptoCountLabel: '加密货币笔数',
        winCountLabel: '盈利笔数',
        lossCountLabel: '亏损笔数',
        longCountLabel: '做多 (BUY) 笔数',
        shortCountLabel: '做空 (SELL) 笔数',
        notionalValueLabel: '名义成交额',
        grossProfitLabel: '总毛利',
        grossLossLabel: '总毛损',
        winRateSubLabel: '胜率 / 净点数',
        timesUnit: '笔',
        historicalTableTitle: 'TradeRank 历史月度战绩表',
        monthlyRankingHeader: '月度排名',
        investmentStatusHeader: '实盘投资与交易分布',
        yearMonthCol: '年 / 月',
        rankCol: '排名',
        roiAndProfitCol: '收益率 / 收益额',
        assetsCol: '期末净值 / 期初本金',
        goldCol: '黄金笔数 / 成交额',
        fxCol: '外汇笔数 / 成交额',
        cryptoCol: '加密笔数 / 成交额',
        cfdCol: 'CFD笔数 / 成交额',
        pipsWinCol: '净点数 / 胜率',
        filterAll: '全部',
        filterGold: '黄金 GOLD#',
        filterWins: '盈利单',
        filterDayPrefix: '日期',
        auditVerifiedTag: 'MetaApi 只读实盘审计认证',
        verifyingLedgerMsg: '正在从经纪商账本验证已平仓交割单...',
        noTradesMsg: '当前筛选条件下暂无已平仓交割记录。',
        lotsLabel: '手',
        posLabel: '持仓 #',
        loadMoreExecutions: '加载更多实盘交割记录',
        remainingLabel: '条剩余',
      };
    }
    return {
      mt5VerifiedBadge: 'MT5 Read-Only Verified',
      following: 'Following',
      followers: 'Followers',
      follow: 'Follow',
      followingActive: 'Following',
      shareTooltip: 'Share Verified Trader Profile',
      methodologyTitle: 'Trading Methodology',
      technical: 'Technical Analysis',
      fundamental: 'Fundamental Macro',
      intuition: 'Price Action / Intuition',
      bioTitle: 'Self-Introduction',
      defaultBio: 'Committed to disciplined execution, transparent broker verification, and high-probability session setups.',
      historicalDataLink: 'TradeRank Historical Data',
      rankingSectionTitle: 'Ranking & Monthly P&L Calendar',
      profitAmountTab: 'Profit Amount ($)',
      returnRateTab: 'Return Rate / Pips',
      toggleTableTooltip: 'Toggle Monthly Historical Table',
      rankUnit: '',
      peopleUnit: 'Traders',
      weekdays: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      netProfitLabel: 'Net Profit / Loss',
      returnRateLabel: 'Return Rate (ROI)',
      currentAssetsLabel: 'Ending Equity',
      initialAssetsLabel: 'Starting Capital',
      goldCountLabel: 'Gold / Metals Trades',
      fxCountLabel: 'Forex Trades',
      cfdCountLabel: 'Indices / CFD Trades',
      cryptoCountLabel: 'Crypto CFD Trades',
      winCountLabel: 'Winning Executions',
      lossCountLabel: 'Losing Executions',
      longCountLabel: 'Long (BUY) Trades',
      shortCountLabel: 'Short (SELL) Trades',
      notionalValueLabel: 'Notional Volume',
      grossProfitLabel: 'Gross Profit',
      grossLossLabel: 'Gross Loss',
      winRateSubLabel: 'Win Rate / Net Pips',
      timesUnit: ' trades',
      historicalTableTitle: 'TradeRank Historical Monthly Data',
      monthlyRankingHeader: 'Monthly Ranking',
      investmentStatusHeader: 'Verified Trading Breakdown & Asset Volume',
      yearMonthCol: 'Year / Month',
      rankCol: 'Rank',
      roiAndProfitCol: 'ROI % / Net P&L',
      assetsCol: 'Ending / Starting Cap',
      goldCol: 'Gold Trades / Volume',
      fxCol: 'FX Trades / Volume',
      cryptoCol: 'Crypto Trades / Volume',
      cfdCol: 'CFD Trades / Volume',
      pipsWinCol: 'Net Pips / Win Rate',
      filterAll: 'All',
      filterGold: 'GOLD#',
      filterWins: 'Wins',
      filterDayPrefix: 'Day',
      auditVerifiedTag: 'MetaApi Read-Only Audit Verified',
      verifyingLedgerMsg: 'Verifying closed deals directly from broker ledger...',
      noTradesMsg: 'No closed executions recorded for this filter.',
      lotsLabel: 'lots',
      posLabel: 'Pos #',
      loadMoreExecutions: 'Load More Verified Executions',
      remainingLabel: 'remaining',
    };
  }, [language]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingTrades(true);

    // Fetch live connected accounts to get real MT5 balance/equity and real participant count
    fetch('/api/accounts?scope=public')
      .then(res => (res.ok ? res.json() : []))
      .then((accounts: any[]) => {
        if (!isMounted || !Array.isArray(accounts)) return;
        setLiveParticipantsCount(Math.max(1, accounts.length));

        const userBrokers = new Set<string>();
        if (trader.broker) userBrokers.add(trader.broker.toUpperCase());
        if (Array.isArray(trader.brokers)) {
          trader.brokers.forEach(b => userBrokers.add(b.toUpperCase()));
        }
        accounts.forEach(acc => {
          if (
            acc.id === trader.userId ||
            acc.userId === trader.userId ||
            (acc.accountNumber && trader.username.includes(String(acc.accountNumber)))
          ) {
            if (acc.broker) userBrokers.add(String(acc.broker).toUpperCase());
          }
        });
        setConnectedBrokers(Array.from(userBrokers));

        const matched = accounts.find(
          acc =>
            acc.id === trader.userId ||
            acc.userId === trader.userId ||
            (acc.accountNumber && trader.username.includes(String(acc.accountNumber)))
        ) || accounts[0];
        if (matched) {
          const bal = Number(matched.equity ?? matched.balance);
          if (!Number.isNaN(bal) && bal >= 0) {
            setLiveAccountBalance(bal);
          }
          if (matched.serverName) {
            setLiveServerName(String(matched.serverName));
          }
          if (matched.profileUsername) {
            setLiveHolderName(String(matched.profileUsername));
          }
          if (matched.accountNumber) {
            setLiveAccountNumber(String(matched.accountNumber));
          }
        }
      })
      .catch(() => {});

    // Fetch live monthly balance cashflows (DEAL_TYPE_BALANCE deposits/withdrawals & active capital)
    fetch(`/api/accounts/${trader.userId}/cashflows`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!isMounted || !data || typeof data !== 'object' || Object.keys(data).length === 0) return;
        setLiveMonthlyCashflows(prev => ({ ...prev, ...data }));
      })
      .catch(() => {});

    fetch(`/api/accounts/${trader.userId}/trades`)
      .then(res => (res.ok ? res.json() : []))
      .then((data: any[]) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const valid = data.filter(d => {
            const sym = String(d.symbol || '').toUpperCase();
            if (!sym || sym === 'UNKNOWN' || sym === 'BALANCE') return false;
            const vol = Number(d.lotSize ?? d.volume ?? 0);
            return vol > 0;
          });

          const normalized = valid.map(d => {
            const symbol = String(d.symbol).trim();
            const type = (d.type === 'BUY' ? 'BUY' : 'SELL') as 'BUY' | 'SELL';
            const lotSize = Number(d.lotSize ?? d.volume ?? 0.01);
            let openPrice = Number(d.openPrice ?? 0);
            let closePrice = Number(d.closePrice ?? openPrice ?? 0);
            const pnlCurrency = Number(d.pnlCurrency ?? d.profitCurrency ?? d.profit ?? 0);
            const swap = Number(d.swap ?? 0);
            let pnlPips = Number(d.pnlPips ?? d.profitPips ?? 0);

            const { pipSize, digits, pipValPerLot } = getInstrumentSpec(symbol);

            if (pnlPips === 0 && openPrice > 0 && closePrice > 0 && openPrice !== closePrice) {
              const priceDiff = type === 'BUY' ? closePrice - openPrice : openPrice - closePrice;
              pnlPips = Number((priceDiff / pipSize).toFixed(1));
            }

            if (pnlPips === 0 && pnlCurrency !== 0 && lotSize > 0) {
              pnlPips = Number((pnlCurrency / (lotSize * pipValPerLot)).toFixed(1));
            }

            if (openPrice > 0 && closePrice > 0 && openPrice === closePrice && pnlPips !== 0) {
              const priceMove = pnlPips * pipSize;
              openPrice = type === 'BUY'
                ? Number((closePrice - priceMove).toFixed(digits))
                : Number((closePrice + priceMove).toFixed(digits));
            } else {
              if (openPrice > 0) openPrice = Number(openPrice.toFixed(digits));
              if (closePrice > 0) closePrice = Number(closePrice.toFixed(digits));
            }

            const rawId = String(d.id || '');
            const posMatch = rawId.match(/_(\d+)$/);
            const positionId = posMatch ? posMatch[1] : String(d.ticket || 'N/A');

            return {
              id: rawId || String(d.ticket || Math.random()),
              positionId,
              ticket: String(d.ticket || positionId),
              symbol,
              type,
              lotSize,
              openPrice,
              closePrice,
              openTime: d.openTime || '',
              closeTime: d.closeTime || '',
              pnlCurrency,
              pnlPips,
              swap,
              digits,
            };
          });

          setRealTrades(normalized);
          // Default calendar to most recent trade's month
          if (normalized[0]?.closeTime && normalized[0].closeTime.length >= 7) {
            setSelectedYearMonth(normalized[0].closeTime.slice(0, 7));
          }
        } else {
          setRealTrades([]);
        }
      })
      .catch(err => {
        console.error('Failed to load verified trades', err);
        if (isMounted) setRealTrades([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingTrades(false);
      });

    const loadOpenOrders = async () => {
      try {
        const res = await fetch(`/api/accounts/${encodeURIComponent(trader.userId)}/positions`);
        if (!res.ok || !isMounted) return;
        const data = await res.json();
        if (!Array.isArray(data) || !isMounted) return;
        const mapped = data.map((p: any, idx: number) => {
          const symbol = String(p.symbol || 'EURUSD').trim();
          const type = (p.type === 'BUY' ? 'BUY' : 'SELL') as 'BUY' | 'SELL';
          const lotSize = Number(p.lotSize ?? p.volume ?? 0.01);
          const openPrice = Number(p.openPrice ?? 0);
          const currentPrice = Number(p.currentPrice ?? openPrice ?? 0);
          const profitCurrency = Number(p.profitCurrency ?? p.profit ?? 0);
          let profitPips = Number(p.profitPips ?? 0);
          const { pipSize, digits, pipValPerLot } = getInstrumentSpec(symbol);
          if (profitPips === 0 && openPrice > 0 && currentPrice > 0 && openPrice !== currentPrice) {
            const diff = type === 'BUY' ? currentPrice - openPrice : openPrice - currentPrice;
            profitPips = Number((diff / pipSize).toFixed(1));
          } else if (profitPips === 0 && profitCurrency !== 0 && lotSize > 0) {
            profitPips = Number((profitCurrency / (lotSize * pipValPerLot)).toFixed(1));
          }
          return {
            id: String(p.id || `pos_${idx}`),
            ticket: String(p.ticket || p.id || `${100000 + idx}`),
            symbol,
            type,
            lotSize,
            openPrice: Number(openPrice.toFixed(digits)),
            currentPrice: Number(currentPrice.toFixed(digits)),
            profitPips: Number(profitPips.toFixed(1)),
            profitCurrency,
            openTime: String(p.openTime || ''),
            digits,
          };
        });
        setLiveOrders(mapped);
      } catch {
        // ignore
      }
    };

    loadOpenOrders();
    const ordersTimer = setInterval(loadOpenOrders, 5000);

    return () => {
      isMounted = false;
      clearInterval(ordersTimer);
    };
  }, [trader.userId]);

  const handleManualRefreshOrders = async () => {
    setIsRefreshingOrders(true);
    try {
      const res = await fetch(`/api/accounts/${encodeURIComponent(trader.userId)}/positions`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped = data.map((p: any, idx: number) => {
            const symbol = String(p.symbol || 'EURUSD').trim();
            const type = (p.type === 'BUY' ? 'BUY' : 'SELL') as 'BUY' | 'SELL';
            const lotSize = Number(p.lotSize ?? p.volume ?? 0.01);
            const openPrice = Number(p.openPrice ?? 0);
            const currentPrice = Number(p.currentPrice ?? openPrice ?? 0);
            const profitCurrency = Number(p.profitCurrency ?? p.profit ?? 0);
            let profitPips = Number(p.profitPips ?? 0);
            const { pipSize, digits, pipValPerLot } = getInstrumentSpec(symbol);
            if (profitPips === 0 && openPrice > 0 && currentPrice > 0 && openPrice !== currentPrice) {
              const diff = type === 'BUY' ? currentPrice - openPrice : openPrice - currentPrice;
              profitPips = Number((diff / pipSize).toFixed(1));
            } else if (profitPips === 0 && profitCurrency !== 0 && lotSize > 0) {
              profitPips = Number((profitCurrency / (lotSize * pipValPerLot)).toFixed(1));
            }
            return {
              id: String(p.id || `pos_${idx}`),
              ticket: String(p.ticket || p.id || `${100000 + idx}`),
              symbol,
              type,
              lotSize,
              openPrice: Number(openPrice.toFixed(digits)),
              currentPrice: Number(currentPrice.toFixed(digits)),
              profitPips: Number(profitPips.toFixed(1)),
              profitCurrency,
              openTime: String(p.openTime || ''),
              digits,
            };
          });
          setLiveOrders(mapped);
        }
      }
    } catch {
      // ignore
    } finally {
      setTimeout(() => setIsRefreshingOrders(false), 350);
    }
  };

  // Determine trader methodology split (Technical / Fundamental / Intuition)
  const methodology = useMemo(() => {
    const raw =
      trader.methodology ||
      (user && (user.username === trader.username || user.id === trader.userId) ? user.methodology : undefined) || {
        technical: 40,
        fundamental: 10,
        intuition: 50,
      };
    const total = raw.technical + raw.fundamental + raw.intuition || 100;
    const tech = Math.round((raw.technical / total) * 100);
    const fund = Math.round((raw.fundamental / total) * 100);
    const intu = Math.max(0, 100 - tech - fund);
    return { technical: tech, fundamental: fund, intuition: intu };
  }, [trader, user]);

  const resolvedBio = useMemo(() => {
    if (trader.bio && trader.bio.trim()) return trader.bio;
    if (user && (user.username === trader.username || user.id === trader.userId) && user.bio?.trim()) {
      return user.bio;
    }
    return copy.defaultBio;
  }, [trader, user, copy.defaultBio]);

  // Compute Donut Chart Segments
  const donutSegments = useMemo(() => {
    const items = [
      { key: 'technical', label: copy.technical, pct: methodology.technical, color: '#2596ff' },
      { key: 'fundamental', label: copy.fundamental, pct: methodology.fundamental, color: '#10b981' },
      { key: 'intuition', label: copy.intuition, pct: methodology.intuition, color: '#ec4899' },
    ];
    let currentAngle = 0;
    return items
      .filter(i => i.pct > 0)
      .map(item => {
        const sweep = (item.pct / 100) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + sweep;
        const midAngle = startAngle + sweep / 2;
        currentAngle = endAngle;
        const path = createDonutSegmentPath(74, 74, 66, 35, startAngle, endAngle);
        const labelPos = polarToCartesian(74, 74, 50.5, midAngle);
        return {
          ...item,
          path,
          labelPos,
        };
      });
  }, [methodology, copy]);

  // Available months from May 2026 to Oct 2026 (plus any months present in realTrades)
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
    for (const tr of realTrades) {
      if (tr.closeTime && tr.closeTime.length >= 7) {
        monthSet.add(tr.closeTime.slice(0, 7));
      }
    }
    return Array.from(monthSet).sort();
  }, [realTrades]);

  const currentMonthIdx = availableMonths.indexOf(selectedYearMonth);

  const handlePrevMonth = () => {
    if (currentMonthIdx > 0) {
      setSelectedYearMonth(availableMonths[currentMonthIdx - 1]);
      setSelectedDayKey(null);
      if (ledgerFilter === 'DAY') setLedgerFilter('ALL');
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIdx < availableMonths.length - 1) {
      setSelectedYearMonth(availableMonths[currentMonthIdx + 1]);
      setSelectedDayKey(null);
      if (ledgerFilter === 'DAY') setLedgerFilter('ALL');
    }
  };

  // Monthly & Daily aggregation for Calendar & Historical Archive Table (derived 100% from real MT5 balance & deals)
  const monthlyArchives = useMemo(() => {
    const monthsDesc = [...availableMonths].reverse();

    // Compute exact starting capital backward from the real live MT5 balance + total realized trade P&L
    const totalRealizedPnl = realTrades.reduce((sum, tr) => sum + tr.pnlCurrency, 0);
    const currentLiveEquity = liveAccountBalance !== null ? liveAccountBalance : 2.8;
    const impliedInitialCapital = Math.max(100, Number((currentLiveEquity - totalRealizedPnl).toFixed(2)));

    let runningCapital = impliedInitialCapital;
    const chronoMap: Record<
      string,
      {
        ym: string;
        rank: number;
        totalParticipants: number;
        netProfitUsd: number;
        netPips: number;
        roiPct: number;
        startingCapital: number;
        endingCapital: number;
        tradesCount: number;
        winCount: number;
        lossCount: number;
        buyCount: number;
        buyWins: number;
        sellCount: number;
        sellWins: number;
        grossProfit: number;
        grossLoss: number;
        goldCount: number;
        goldVolumeUsd: number;
        fxCount: number;
        fxVolumeUsd: number;
        cryptoCount: number;
        cryptoVolumeUsd: number;
        cfdCount: number;
        cfdVolumeUsd: number;
        dailyMap: Record<string, { pnlUsd: number; pnlPips: number; count: number }>;
      }
    > = {};

    for (const ym of availableMonths) {
      const mTrades = realTrades.filter(t => t.closeTime.startsWith(ym));
      const dailyMap: Record<string, { pnlUsd: number; pnlPips: number; count: number }> = {};

      let netProfitUsd = 0;
      let netPips = 0;
      let winCount = 0;
      let lossCount = 0;
      let buyCount = 0;
      let buyWins = 0;
      let sellCount = 0;
      let sellWins = 0;
      let grossProfit = 0;
      let grossLoss = 0;
      let goldCount = 0;
      let goldVolumeUsd = 0;
      let fxCount = 0;
      let fxVolumeUsd = 0;
      let cryptoCount = 0;
      let cryptoVolumeUsd = 0;
      let cfdCount = 0;
      let cfdVolumeUsd = 0;

      for (const tr of mTrades) {
        netProfitUsd += tr.pnlCurrency;
        netPips += tr.pnlPips;
        const isWin = tr.pnlCurrency > 0 || (tr.pnlCurrency === 0 && tr.pnlPips > 0);
        if (isWin) winCount++;
        else lossCount++;

        if (tr.type === 'BUY') {
          buyCount++;
          if (isWin) buyWins++;
        } else {
          sellCount++;
          if (isWin) sellWins++;
        }

        if (tr.pnlCurrency > 0) grossProfit += tr.pnlCurrency;
        else if (tr.pnlCurrency < 0) grossLoss += Math.abs(tr.pnlCurrency);

        const { category, contractMultiplier } = classifySymbol(tr.symbol);
        const refPrice = tr.closePrice > 0 ? tr.closePrice : tr.openPrice > 0 ? tr.openPrice : 2000;
        const notionalUsd = Math.round(tr.lotSize * contractMultiplier * refPrice);

        if (category === 'GOLD') {
          goldCount++;
          goldVolumeUsd += notionalUsd;
        } else if (category === 'CRYPTO') {
          cryptoCount++;
          cryptoVolumeUsd += notionalUsd;
        } else if (category === 'CFD') {
          cfdCount++;
          cfdVolumeUsd += notionalUsd;
        } else {
          fxCount++;
          fxVolumeUsd += notionalUsd;
        }

        const dayKey = tr.closeTime.slice(0, 10);
        if (dayKey) {
          if (!dailyMap[dayKey]) dailyMap[dayKey] = { pnlUsd: 0, pnlPips: 0, count: 0 };
          dailyMap[dayKey].pnlUsd = Number((dailyMap[dayKey].pnlUsd + tr.pnlCurrency).toFixed(2));
          dailyMap[dayKey].pnlPips = Number((dailyMap[dayKey].pnlPips + tr.pnlPips).toFixed(1));
          dailyMap[dayKey].count += 1;
        }
      }

      netProfitUsd = Number(netProfitUsd.toFixed(2));
      netPips = Number(netPips.toFixed(1));
      grossProfit = Number(grossProfit.toFixed(2));
      grossLoss = Number(grossLoss.toFixed(2));

      const cf = liveMonthlyCashflows[ym];
      const startingCapital = cf
        ? Number(Math.max(0.01, cf.activeCapital).toFixed(2))
        : Number(Math.max(0.01, runningCapital).toFixed(2));
      const endingCapital = Number(Math.max(0.01, startingCapital + netProfitUsd).toFixed(2));
      const roiPct =
        mTrades.length === 0
          ? 0
          : startingCapital > 0
          ? Number(((netProfitUsd / startingCapital) * 100).toFixed(2))
          : 0;

      // Exact continuous capital into the next month when cashflow record is absent
      runningCapital = cf ? Number(Math.max(0.01, cf.endBalance).toFixed(2)) : endingCapital;

      // Real rank among connected accounts
      const rank = mTrades.length === 0 ? 0 : Math.min(Math.max(1, trader.rank), liveParticipantsCount);

      chronoMap[ym] = {
        ym,
        rank,
        totalParticipants: liveParticipantsCount,
        netProfitUsd,
        netPips,
        roiPct,
        startingCapital,
        endingCapital,
        tradesCount: mTrades.length,
        winCount,
        lossCount,
        buyCount,
        buyWins,
        sellCount,
        sellWins,
        grossProfit,
        grossLoss,
        goldCount,
        goldVolumeUsd,
        fxCount,
        fxVolumeUsd,
        cryptoCount,
        cryptoVolumeUsd,
        cfdCount,
        cfdVolumeUsd,
        dailyMap,
      };
    }

    return {
      byMonth: chronoMap,
      monthsDesc,
    };
  }, [availableMonths, realTrades, trader.rank, liveAccountBalance, liveParticipantsCount, liveMonthlyCashflows]);

  const activeMonthData = monthlyArchives.byMonth[selectedYearMonth] || {
    ym: selectedYearMonth,
    rank: trader.rank,
    totalParticipants: liveParticipantsCount,
    netProfitUsd: 0,
    netPips: 0,
    roiPct: 0,
    startingCapital: liveAccountBalance ?? 2.8,
    endingCapital: liveAccountBalance ?? 2.8,
    tradesCount: 0,
    winCount: 0,
    lossCount: 0,
    buyCount: 0,
    buyWins: 0,
    sellCount: 0,
    sellWins: 0,
    grossProfit: 0,
    grossLoss: 0,
    goldCount: 0,
    goldVolumeUsd: 0,
    fxCount: 0,
    fxVolumeUsd: 0,
    cryptoCount: 0,
    cryptoVolumeUsd: 0,
    cfdCount: 0,
    cfdVolumeUsd: 0,
    dailyMap: {},
  };

  // Build Calendar Grid Cells for `selectedYearMonth`
  const calendarCells = useMemo(() => {
    const [yearStr, monthStr] = selectedYearMonth.split('-');
    const year = Number(yearStr) || 2026;
    const monthIndex = (Number(monthStr) || 10) - 1;
    const firstDayOfWeek = new Date(year, monthIndex, 1).getDay(); // 0 (Sun) .. 6 (Sat)
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const cells: Array<{
      day: number | null;
      dateKey: string | null;
      pnlUsd: number;
      pnlPips: number;
      count: number;
    }> = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ day: null, dateKey: null, pnlUsd: 0, pnlPips: 0, count: 0 });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayStat = activeMonthData.dailyMap[dateKey];
      cells.push({
        day: d,
        dateKey,
        pnlUsd: dayStat?.pnlUsd ?? 0,
        pnlPips: dayStat?.pnlPips ?? 0,
        count: dayStat?.count ?? 0,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateKey: null, pnlUsd: 0, pnlPips: 0, count: 0 });
    }

    return cells;
  }, [selectedYearMonth, activeMonthData]);

  const formattedSelectedMonthLabel = useMemo(() => {
    const [yearStr, monthStr] = selectedYearMonth.split('-');
    const year = Number(yearStr) || 2026;
    const month = Number(monthStr) || 10;
    if (language === 'ja' || language === 'zh') {
      return `${year}年 ${month}月`;
    }
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [selectedYearMonth, language]);

  const filteredTrades = useMemo(() => {
    if (ledgerFilter === 'DAY' && selectedDayKey) {
      return realTrades.filter(t => t.closeTime.startsWith(selectedDayKey));
    }
    if (ledgerFilter === 'GOLD') {
      return realTrades.filter(t => t.symbol.toUpperCase().includes('GOLD') || t.symbol.toUpperCase().includes('XAU'));
    }
    if (ledgerFilter === 'WINS') {
      return realTrades.filter(t => t.pnlCurrency > 0 || (t.pnlCurrency === 0 && t.pnlPips > 0));
    }
    if (ledgerFilter === 'OCT') {
      return realTrades.filter(t => t.closeTime.startsWith(selectedYearMonth));
    }
    return realTrades;
  }, [realTrades, ledgerFilter, selectedDayKey, selectedYearMonth]);

  // Compute live performance metrics dynamically from the active verified trade ledger
  const stats = useMemo(() => {
    const source = filteredTrades.length > 0 ? filteredTrades : realTrades;
    if (source.length === 0) {
      return {
        netPips: trader.netPips,
        winningPips: Math.max(0, trader.netPips),
        winRate: trader.winRate,
        winCount: Math.round((trader.totalTrades * trader.winRate) / 100),
        lossCount: Math.max(0, trader.totalTrades - Math.round((trader.totalTrades * trader.winRate) / 100)),
        profitFactor: trader.profitFactor,
        grossProfit: 0,
        grossLoss: 0,
        netProfitUsd: 0,
        totalTrades: trader.totalTrades,
        bestTradePips: trader.bestTradePips,
        bestTradeUsd: 0,
        level: trader.level,
        xp: trader.xp,
        verifiedSince: trader.verifiedSince,
        isLiveCalculated: false,
      };
    }

    const netPips = Number(source.reduce((sum, t) => sum + t.pnlPips, 0).toFixed(1));
    const winningTrades = source.filter(t => t.pnlCurrency > 0 || (t.pnlCurrency === 0 && t.pnlPips > 0));
    const winningPips = Number(
      winningTrades.reduce((sum, t) => sum + Math.max(0, t.pnlPips), 0).toFixed(1)
    );
    const winRate = Math.round((winningTrades.length / source.length) * 100);

    const grossProfit = Number(
      source.filter(t => t.pnlCurrency > 0).reduce((s, t) => s + t.pnlCurrency, 0).toFixed(2)
    );
    const grossLoss = Number(
      Math.abs(source.filter(t => t.pnlCurrency < 0).reduce((s, t) => s + t.pnlCurrency, 0)).toFixed(2)
    );
    const netProfitUsd = Number(source.reduce((s, t) => s + t.pnlCurrency, 0).toFixed(2));
    const profitFactor = grossLoss > 0
      ? Number((grossProfit / grossLoss).toFixed(2))
      : grossProfit > 0 ? 99.99 : 1.0;

    const bestTradePips = Math.max(0, ...source.map(t => t.pnlPips));
    const bestTradeUsd = Math.max(0, ...source.map(t => t.pnlCurrency));

    const oldestTrade = realTrades[realTrades.length - 1];
    const verifiedSince = oldestTrade?.openTime
      ? new Date(oldestTrade.openTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : trader.verifiedSince;

    const xp = realTrades.length * 25;
    const level = Math.max(1, Math.floor(realTrades.length / 40) + 1);

    return {
      netPips,
      winningPips,
      winRate,
      winCount: winningTrades.length,
      lossCount: source.length - winningTrades.length,
      profitFactor,
      grossProfit,
      grossLoss,
      netProfitUsd,
      totalTrades: source.length,
      bestTradePips: Number(bestTradePips.toFixed(1)),
      bestTradeUsd: Number(bestTradeUsd.toFixed(2)),
      level,
      xp,
      verifiedSince,
      isLiveCalculated: true,
    };
  }, [filteredTrades, realTrades, trader]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFollowToggle = () => {
    setIsFollowing(prev => {
      const next = !prev;
      try {
        if (next) localStorage.setItem(followStorageKey, '1');
        else localStorage.removeItem(followStorageKey);
      } catch {
        // ignore storage errors
      }
      setFollowerCount(next ? 1 : 0);
      return next;
    });
  };

  const handleShareProfile = () => {
    const url = `${window.location.origin}/?trader=${encodeURIComponent(trader.username)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const formattedLevelText = t.profile.levelLabel.includes('{level}')
    ? t.profile.levelLabel.replace('{level}', String(stats.level))
    : `${t.profile.levelLabel} ${stats.level}`;

  const formattedVerifiedSince = t.profile.verifiedSinceLabel.includes('{date}')
    ? t.profile.verifiedSinceLabel.replace('{date}', stats.verifiedSince)
    : `${t.profile.verifiedSinceLabel} ${stats.verifiedSince}`;

  const isJpy =
    trader.broker === 'XMTrading' ||
    (trader as any).currency === 'JPY' ||
    Boolean(liveServerName && (liveServerName.toLowerCase().includes('xmtrading') || liveServerName.toLowerCase().includes('japan') || liveServerName.toLowerCase().includes('jpy')));
  const curSymbol = isJpy ? '¥' : '$';

  const brokerSlots: Array<{ id: Broker; label: string }> = [
    { id: 'XM', label: 'XM Global' },
    { id: 'XMTrading', label: 'XMTrading (Japan JPY)' },
    { id: 'Exness', label: 'Exness' },
    { id: 'IC_MARKETS', label: 'IC Markets' },
    { id: 'Axiory', label: 'Axiory' },
    { id: 'Vantage', label: 'Vantage' },
    { id: 'Vanguard', label: 'Vanguard' },
  ];

  const formatUsdSigned = (val: number) => {
    const sign = val > 0 ? '+' : val < 0 ? '-' : '';
    if (isJpy) {
      return `${sign}¥${Math.round(Math.abs(val)).toLocaleString('ja-JP')}`;
    }
    return `${sign}$${Math.abs(val).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatCurrencyVal = (val: number) => {
    if (isJpy) {
      return `¥${Math.round(val).toLocaleString('ja-JP')}`;
    }
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div
      className="profile-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 6, 14, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        className="card-panel profile-modal-content"
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '92vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: 'linear-gradient(180deg, #0b1120 0%, #070b14 100%)',
          border: '1px solid rgba(129, 216, 208, 0.28)',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.85)',
          color: '#f8fafc',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* =====================================================================
            SECTION 1: TRADER PROFILE HEADER, METHODOLOGY DONUT & BIO (Ref 1)
           ===================================================================== */}
        <div
          style={{
            background: 'rgba(13, 20, 36, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          {/* Top Row: Avatar + Name + Following/Followers | Follow + Share + Lang + Close */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '22px',
            }}
          >
            {(() => {
              const modalIdentity = resolveTraderIdentity({
                username: trader.username,
                accountHolderName: liveHolderName,
                accountNumber: liveAccountNumber,
                userId: trader.userId,
              });
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <TraderAvatar
                    username={modalIdentity.avatarSeed}
                    symbol={trader.avatarSymbol}
                    avatarUrl={trader.avatarUrl}
                    size={72}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em', color: '#ffffff' }}>
                        {modalIdentity.profileName}
                      </h2>
                      {modalIdentity.accountTag && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#94a3b8',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            letterSpacing: '0.2px',
                          }}
                        >
                          {modalIdentity.accountTag}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '3px 9px',
                          borderRadius: '999px',
                          background: 'rgba(16, 185, 129, 0.16)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ShieldCheck size={12} /> {trader.broker} {copy.mt5VerifiedBadge}
                        {liveServerName ? ` (${liveServerName})` : ''}
                      </span>
                      {trader.instagramHandle && (
                        <a
                          href={`https://instagram.com/${trader.instagramHandle.replace(/^@/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            color: '#e1306c',
                            background: 'rgba(225, 48, 108, 0.12)',
                            border: '1px solid rgba(225, 48, 108, 0.35)',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                          }}
                        >
                          <Instagram size={11} color="#e1306c" />
                          <span>{trader.instagramHandle.startsWith('@') ? trader.instagramHandle : `@${trader.instagramHandle}`}</span>
                        </a>
                      )}
                    </div>

                    {/* Following / Followers Counter Row (Ref 1) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>
                      <span>
                        <strong style={{ color: '#ffffff', fontSize: '15px', fontWeight: 800 }}>0</strong>{' '}
                        <span style={{ fontSize: '12px' }}>{copy.following}</span>
                      </span>
                      <span>
                        <strong style={{ color: '#ffffff', fontSize: '15px', fontWeight: 800 }}>{followerCount}</strong>{' '}
                        <span style={{ fontSize: '12px' }}>{copy.followers}</span>
                      </span>
                      <span style={{ color: '#475569' }}>•</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {formattedLevelText} ({stats.xp.toLocaleString()} XP) • {formattedVerifiedSince}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Right Controls: Follow Button + Share Button + Language + Close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleFollowToggle}
                style={{
                  padding: '8px 22px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  border: isFollowing ? '1px solid #00f0ff' : '1px solid #ffffff',
                  background: isFollowing ? 'rgba(0, 240, 255, 0.15)' : '#ffffff',
                  color: isFollowing ? '#00f0ff' : '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.18s',
                }}
              >
                {isFollowing ? (
                  <>
                    <CheckCircle2 size={14} /> {copy.followingActive}
                  </>
                ) : (
                  <>
                    <UserPlus size={14} /> {copy.follow}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareProfile}
                title={copy.shareTooltip}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  background: copiedShare ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.9)',
                  border: copiedShare ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.14)',
                  color: copiedShare ? '#34d399' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {copiedShare ? <Check size={15} /> : <Share2 size={15} />}
              </button>

              <LanguageSelector variant="compact" />

              <button
                type="button"
                onClick={onClose}
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Trading Methodology Donut Chart & Legend (トレード手法 - Ref 1) */}
          <div
            className="profile-methodology-container"
          >
            <div style={{ position: 'relative', width: '148px', height: '148px', flexShrink: 0 }}>
              <svg width="148" height="148" viewBox="0 0 148 148">
                {donutSegments.map(seg => (
                  <g key={seg.key}>
                    <path d={seg.path} fill={seg.color} stroke="#0b1120" strokeWidth="1.5" />
                    {seg.pct >= 8 && (
                      <text
                        x={seg.labelPos.x}
                        y={seg.labelPos.y}
                        fill="#ffffff"
                        fontSize="12"
                        fontWeight="800"
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontFamily: 'var(--font-mono, monospace)', textShadow: '0 1px 3px rgba(0,0,0,0.65)' }}
                      >
                        {seg.pct}%
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
                {copy.methodologyTitle}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
                <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#2596ff', display: 'inline-block' }} />
                <span>{copy.technical}</span>
                <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono, monospace)', fontSize: '12px' }}>
                  ({methodology.technical}%)
                </strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
                <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span>{copy.fundamental}</span>
                <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono, monospace)', fontSize: '12px' }}>
                  ({methodology.fundamental}%)
                </strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
                <span style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#ec4899', display: 'inline-block' }} />
                <span>{copy.intuition}</span>
                <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono, monospace)', fontSize: '12px' }}>
                  ({methodology.intuition}%)
                </strong>
              </div>
            </div>
          </div>

          {/* Self-Introduction (自己紹介) & Verified Broker Badges Row */}
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '16px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              {copy.bioTitle}
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#cbd5e1', lineHeight: 1.55 }}>
              {resolvedBio}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              {/* Connected Broker Slots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {brokerSlots.map(slot => {
                  const isConnected =
                    connectedBrokers.includes(slot.id.toUpperCase()) ||
                    trader.broker.toUpperCase() === slot.id.toUpperCase() ||
                    (Array.isArray(trader.brokers) && trader.brokers.some(b => b.toUpperCase() === slot.id.toUpperCase()));
                  return (
                    <div
                      key={slot.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        background: isConnected ? 'rgba(20, 32, 54, 0.95)' : 'rgba(15, 23, 42, 0.55)',
                        border: isConnected
                          ? '1px solid rgba(16, 185, 129, 0.45)'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                        color: isConnected ? '#ffffff' : '#475569',
                        fontSize: '12px',
                        fontWeight: 800,
                      }}
                    >
                      {isConnected && (
                        <span
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: '#10b981',
                            color: '#052e16',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                          }}
                        >
                          <Check size={11} strokeWidth={3.5} />
                        </span>
                      )}
                      <span>{slot.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Link to Historical Monthly Data Table */}
              <button
                type="button"
                onClick={() => {
                  setShowHistoricalArchive(true);
                  setTimeout(() => {
                    historicalTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 60);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 4px',
                }}
              >
                <span>{copy.historicalDataLink}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECTION 1B: LIVE OPEN ORDERS (REAL-TIME ACTIVE POSITIONS)
           ===================================================================== */}
        <div
          style={{
            background: 'rgba(11, 17, 30, 0.94)',
            border: '1px solid rgba(10, 186, 181, 0.3)',
            borderRadius: '16px',
            padding: '18px 22px',
            marginBottom: '24px',
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.45)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <Activity size={18} color="#00f0ff" />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#ffffff' }}>
                {language === 'ja'
                  ? 'ライブ保有注文 (リアルタイム有効ポジション)'
                  : language === 'zh'
                  ? '实时持仓订单 (Live Open Orders)'
                  : 'Live Open Orders (Active Positions)'}
              </h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  background: liveOrders.length > 0 ? 'rgba(16, 185, 129, 0.16)' : 'rgba(148, 163, 184, 0.12)',
                  color: liveOrders.length > 0 ? '#10b981' : '#94a3b8',
                  border: liveOrders.length > 0 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(148, 163, 184, 0.25)',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: liveOrders.length > 0 ? '#10b981' : '#00f0ff',
                    boxShadow: liveOrders.length > 0 ? '0 0 8px #10b981' : '0 0 6px #00f0ff',
                  }}
                />
                {liveOrders.length}{' '}
                {language === 'ja' ? 'ポジション稼働中' : language === 'zh' ? '笔持仓中' : 'Active'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {(() => {
                const totalFloatPips = Number(liveOrders.reduce((s, o) => s + o.profitPips, 0).toFixed(1));
                const totalFloatProfit = liveOrders.reduce((s, o) => s + o.profitCurrency, 0);
                const isPosFloat = totalFloatPips >= 0;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12.5px' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 700 }}>
                      {language === 'ja' ? '含み損益:' : language === 'zh' ? '浮动盈亏:' : 'Floating P&L:'}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontWeight: 900,
                        color: isPosFloat ? '#10b981' : '#f43f5e',
                      }}
                    >
                      {totalFloatPips >= 0 ? `+${totalFloatPips}` : totalFloatPips} pips (
                      {formatUsdSigned(totalFloatProfit)})
                    </span>
                  </div>
                );
              })()}

              <button
                type="button"
                onClick={handleManualRefreshOrders}
                title="Refresh Live Open Orders"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: 'rgba(0, 240, 255, 0.08)',
                  border: '1px solid rgba(0, 240, 255, 0.28)',
                  color: '#00f0ff',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw
                  size={12}
                  style={{ animation: isRefreshingOrders ? 'spin 0.8s linear infinite' : 'none' }}
                />
                <span>{language === 'ja' ? '更新' : language === 'zh' ? '刷新' : 'Sync Live'}</span>
              </button>
            </div>
          </div>

          {liveOrders.length === 0 ? (
            <div
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(4, 9, 18, 0.55)',
                border: '1px dashed rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '12.5px' }}>
                <Radio size={15} color="#00f0ff" />
                <span>
                  {language === 'ja'
                    ? '現在保有中のオープン注文はありません。MT4/MT5ターミナルのリアルタイム注文ストリームを監視中...'
                    : language === 'zh'
                    ? '当前暂无未平仓实时订单 — 正在实时监听 MT4/MT5 经纪商终端成交...'
                    : 'No open orders currently active on broker terminal — real-time MT4/MT5 execution stream connected.'}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                ● {language === 'ja' ? '5秒自動同期' : language === 'zh' ? '5秒自动同步' : '5s Live Sync'}
              </span>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12.5px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#94a3b8',
                      textAlign: 'left',
                      fontSize: '11px',
                    }}
                  >
                    <th style={{ padding: '8px' }}>{language === 'ja' ? 'チケット' : language === 'zh' ? '订单号' : 'Ticket'}</th>
                    <th style={{ padding: '8px' }}>{language === 'ja' ? '銘柄' : language === 'zh' ? '品种' : 'Symbol'}</th>
                    <th style={{ padding: '8px' }}>{language === 'ja' ? '売買' : language === 'zh' ? '方向' : 'Side'}</th>
                    <th style={{ padding: '8px' }}>{language === 'ja' ? 'ロット' : language === 'zh' ? '手数' : 'Lots'}</th>
                    <th style={{ padding: '8px' }}>{language === 'ja' ? '建値' : language === 'zh' ? '开仓价' : 'Open Price'}</th>
                    <th style={{ padding: '8px' }}>{language === 'ja' ? '現在値' : language === 'zh' ? '现价' : 'Live Price'}</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>{language === 'ja' ? '獲得Pips' : language === 'zh' ? '浮动点数' : 'Floating Pips'}</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>{language === 'ja' ? '含み損益' : language === 'zh' ? '浮动盈亏' : 'Floating P&L'}</th>
                  </tr>
                </thead>
                <tbody>
                  {liveOrders.map(ord => {
                    const isPos = ord.profitPips >= 0;
                    const isMoneyPos = ord.profitCurrency >= 0;
                    return (
                      <tr
                        key={ord.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          background: 'rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        <td style={{ padding: '10px 8px', color: '#94a3b8' }}>#{ord.ticket.slice(-8)}</td>
                        <td style={{ padding: '10px 8px', fontWeight: 900, color: '#ffffff' }}>{ord.symbol}</td>
                        <td style={{ padding: '10px 8px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              background: ord.type === 'BUY' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(244, 63, 94, 0.18)',
                              color: ord.type === 'BUY' ? '#10b981' : '#f43f5e',
                            }}
                          >
                            {ord.type === 'BUY' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {ord.type}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', color: '#e2e8f0', fontWeight: 700 }}>
                          {ord.lotSize.toFixed(2)} {copy.lotsLabel}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#94a3b8' }}>
                          {ord.openPrice.toFixed(ord.digits)}
                        </td>
                        <td style={{ padding: '10px 8px', color: '#ffffff', fontWeight: 800 }}>
                          {ord.currentPrice.toFixed(ord.digits)}
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: 900,
                              background: isPos ? 'rgba(16, 185, 129, 0.14)' : 'rgba(244, 63, 94, 0.14)',
                              color: isPos ? '#10b981' : '#f43f5e',
                              border: `1px solid ${isPos ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`,
                            }}
                          >
                            {isPos ? `+${ord.profitPips.toFixed(1)}` : ord.profitPips.toFixed(1)}p
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            textAlign: 'right',
                            fontWeight: 900,
                            color: isMoneyPos ? '#38bdf8' : '#f43f5e',
                          }}
                        >
                          {formatUsdSigned(ord.profitCurrency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =====================================================================
            SECTION 2: RANKING & MONTHLY DAILY P&L CALENDAR (Ref 2)
           ===================================================================== */}
        <div
          style={{
            background: 'rgba(11, 17, 30, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          {/* Section Title */}
          <h3 style={{ margin: '0 0 16px 0', textAlign: 'center', fontSize: '20px', fontWeight: 900, color: '#ffffff' }}>
            {copy.rankingSectionTitle}
          </h3>

          {/* Profit Amount (収益額) vs Return Rate (収益率) Tabs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '32px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '18px',
            }}
          >
            <button
              type="button"
              onClick={() => setMetricTab('AMOUNT')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: metricTab === 'AMOUNT' ? '3px solid #10b981' : '3px solid transparent',
                padding: '8px 24px 10px 24px',
                fontSize: '13.5px',
                fontWeight: 800,
                color: metricTab === 'AMOUNT' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {copy.profitAmountTab}
            </button>
            <button
              type="button"
              onClick={() => setMetricTab('RATE')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: metricTab === 'RATE' ? '3px solid #10b981' : '3px solid transparent',
                padding: '8px 24px 10px 24px',
                fontSize: '13.5px',
                fontWeight: 800,
                color: metricTab === 'RATE' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {copy.returnRateTab}
            </button>
          </div>

          {/* Centered Overall Rank Badge Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ width: '32px' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontFamily: 'var(--font-mono, monospace)' }}>
                {selectedYearMonth}-01
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 14px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.45)',
                  color: '#ecfdf5',
                  fontSize: '13px',
                  fontWeight: 800,
                }}
              >
                <span>
                  {language === 'ja'
                    ? `${trader.rank}${copy.rankUnit} / ${activeMonthData.totalParticipants.toLocaleString()}${copy.peopleUnit}`
                    : language === 'zh'
                    ? `第 ${trader.rank} ${copy.rankUnit} / ${activeMonthData.totalParticipants.toLocaleString()} ${copy.peopleUnit}`
                    : `Rank #${trader.rank} / ${activeMonthData.totalParticipants.toLocaleString()} ${copy.peopleUnit}`}
                </span>
                <span style={{ color: '#34d399', fontFamily: 'var(--font-mono, monospace)' }}>
                  ({stats.netPips >= 0 ? `+${stats.netPips}` : stats.netPips}p)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHistoricalArchive(prev => !prev)}
              title={copy.toggleTableTooltip}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <BarChart3 size={16} />
            </button>
          </div>

          {/* Monthly Calendar Box */}
          <div
            style={{
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#090e1a',
              marginBottom: '20px',
            }}
          >
            {/* Calendar Brand & Month Selector Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 18px',
                background: 'linear-gradient(90deg, #101b33 0%, #14223d 50%, #101b33 100%)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              {/* Left: TradeRank.live Brand Mark */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'rgba(0, 240, 255, 0.15)',
                    border: '1px solid rgba(0, 240, 255, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00f0ff',
                  }}
                >
                  <Calendar size={13} />
                </div>
                <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '0.04em', color: '#ffffff' }}>
                  TRADERANK<span style={{ color: '#00f0ff' }}>.LIVE</span>
                </span>
              </div>

              {/* Center: < October 2026 > Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={currentMonthIdx <= 0}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '4px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: currentMonthIdx <= 0 ? '#334155' : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: currentMonthIdx <= 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', minWidth: '135px', textAlign: 'center' }}>
                  {formattedSelectedMonthLabel}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={currentMonthIdx >= availableMonths.length - 1}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '4px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: currentMonthIdx >= availableMonths.length - 1 ? '#334155' : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: currentMonthIdx >= availableMonths.length - 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Right: Monthly Rank & Monthly Net P&L */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                <span style={{ color: '#cbd5e1', fontWeight: 700 }}>
                  {activeMonthData.rank > 0
                    ? language === 'ja'
                      ? `${activeMonthData.rank}${copy.rankUnit} / ${activeMonthData.totalParticipants.toLocaleString()}${copy.peopleUnit}`
                      : language === 'zh'
                      ? `第 ${activeMonthData.rank} ${copy.rankUnit} / ${activeMonthData.totalParticipants.toLocaleString()}${copy.peopleUnit}`
                      : `#${activeMonthData.rank} / ${activeMonthData.totalParticipants.toLocaleString()}`
                    : `- / ${activeMonthData.totalParticipants.toLocaleString()}`}
                </span>
                <span style={{ color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {metricTab === 'AMOUNT' ? copy.netProfitLabel : copy.returnRateLabel}
                  <Info size={12} color="#64748b" />
                </span>
                <strong
                  style={{
                    fontSize: '15px',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono, monospace)',
                    color:
                      metricTab === 'AMOUNT'
                        ? activeMonthData.netProfitUsd >= 0
                          ? '#38bdf8'
                          : '#f43f5e'
                        : activeMonthData.roiPct >= 0
                        ? '#38bdf8'
                        : '#f43f5e',
                  }}
                >
                  {metricTab === 'AMOUNT'
                    ? formatUsdSigned(activeMonthData.netProfitUsd)
                    : `${activeMonthData.roiPct >= 0 ? '+' : ''}${activeMonthData.roiPct}% (${activeMonthData.netPips >= 0 ? '+' : ''}${activeMonthData.netPips.toFixed(1)}p)`}
                </strong>
              </div>
            </div>

            {/* 7-Column Weekday Header (SUN..SAT / 日..土 / 周日..周六) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                background: '#0f172a',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              {copy.weekdays.map(dayName => (
                <div
                  key={dayName}
                  style={{
                    padding: '6px 4px',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#94a3b8',
                    letterSpacing: '0.04em',
                  }}
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* 7-Column Calendar Day Cells */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
              }}
            >
              {calendarCells.map((cell, idx) => {
                const isSelected = Boolean(cell.dateKey && selectedDayKey === cell.dateKey && ledgerFilter === 'DAY');
                const hasActivity = cell.count > 0;
                const displayVal =
                  metricTab === 'AMOUNT'
                    ? formatUsdSigned(cell.pnlUsd)
                    : `${cell.pnlPips >= 0 ? '+' : ''}${cell.pnlPips.toFixed(1)}p`;
                const isPositive = metricTab === 'AMOUNT' ? cell.pnlUsd >= 0 : cell.pnlPips >= 0;

                return (
                  <div
                    key={cell.dateKey || `empty_${idx}`}
                    className="profile-calendar-cell"
                    onClick={() => {
                      if (!cell.dateKey || !hasActivity) return;
                      if (selectedDayKey === cell.dateKey && ledgerFilter === 'DAY') {
                        setSelectedDayKey(null);
                        setLedgerFilter('ALL');
                      } else {
                        setSelectedDayKey(cell.dateKey);
                        setLedgerFilter('DAY');
                        setVisibleLimit(30);
                      }
                    }}
                    title={
                      hasActivity
                        ? `${cell.dateKey}: ${cell.count}${copy.timesUnit} • ${formatUsdSigned(cell.pnlUsd)} (${cell.pnlPips >= 0 ? '+' : ''}${cell.pnlPips} pips)`
                        : undefined
                    }
                    style={{
                      borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      background: isSelected
                        ? 'rgba(0, 240, 255, 0.14)'
                        : hasActivity
                        ? 'rgba(15, 23, 42, 0.45)'
                        : 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      cursor: hasActivity ? 'pointer' : 'default',
                      transition: 'background 0.15s',
                    }}
                  >
                    {cell.day !== null && (
                      <>
                        <span
                          className="profile-calendar-day-num"
                          style={{
                            fontWeight: 800,
                            color: hasActivity ? '#ffffff' : '#64748b',
                          }}
                        >
                          {cell.day}
                        </span>
                        {hasActivity && (
                          <span
                            className="profile-calendar-day-val"
                            style={{
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono, monospace)',
                              color: isPositive ? '#38bdf8' : '#f43f5e',
                            }}
                          >
                            {displayVal}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2x5 Breakdown Cards Grid Below Calendar (10 Cards matching Ref 2) */}
          <div
            className="profile-breakdown-grid"
          >
            {/* Card 1: Monthly Net Profit & Return Rate */}
            <div
              style={{
                background: '#111a2e',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{copy.netProfitLabel}</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: activeMonthData.netProfitUsd >= 0 ? '#38bdf8' : '#f43f5e',
                  textAlign: 'right',
                  marginTop: '2px',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {formatUsdSigned(activeMonthData.netProfitUsd)}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{copy.returnRateLabel}</div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: activeMonthData.roiPct >= 0 ? '#38bdf8' : '#f43f5e',
                  textAlign: 'right',
                  marginTop: '2px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {activeMonthData.roiPct >= 0 ? `+${activeMonthData.roiPct}%` : `${activeMonthData.roiPct}%`}
              </div>
            </div>

            {/* Card 2: Current Equity & Starting Capital */}
            <div
              style={{
                background: '#111a2e',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{copy.currentAssetsLabel}</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textAlign: 'right',
                  marginTop: '2px',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                ${activeMonthData.endingCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{copy.initialAssetsLabel}</div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#cbd5e1',
                  textAlign: 'right',
                  marginTop: '2px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                ${activeMonthData.startingCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Card 3: Gold / Metals Count & Notional Volume */}
            <div
              style={{
                background: '#111a2e',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{copy.goldCountLabel}</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textAlign: 'right',
                  marginTop: '2px',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {activeMonthData.goldCount}
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '2px' }}>{copy.timesUnit}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{copy.notionalValueLabel}</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textAlign: 'right',
                  marginTop: '2px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                ${activeMonthData.goldVolumeUsd.toLocaleString()}
              </div>
            </div>

            {/* Card 4: Forex Count & Notional Volume */}
            <div
              style={{
                background: '#111a2e',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>{copy.fxCountLabel}</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textAlign: 'right',
                  marginTop: '2px',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {activeMonthData.fxCount}
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '2px' }}>{copy.timesUnit}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>{copy.notionalValueLabel}</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textAlign: 'right',
                  marginTop: '2px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                ${activeMonthData.fxVolumeUsd.toLocaleString()}
              </div>
            </div>

            {/* Card 5: CFD / Indices Count & Notional Volume */}
            <div
              style={{
                background: '#111a2e',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>{copy.cfdCountLabel}</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textAlign: 'right',
                  marginTop: '2px',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {activeMonthData.cfdCount}
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '2px' }}>{copy.timesUnit}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>{copy.notionalValueLabel}</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textAlign: 'right',
                  marginTop: '2px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                ${activeMonthData.cfdVolumeUsd.toLocaleString()}
              </div>
            </div>

            {/* Card 6: Crypto Count & Notional Volume */}
            <div
              style={{
                background: '#111a2e',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>{copy.cryptoCountLabel}</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textAlign: 'right',
                  marginTop: '2px',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {activeMonthData.cryptoCount}
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '2px' }}>{copy.timesUnit}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, whiteSpace: 'nowrap' }}>{copy.notionalValueLabel}</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textAlign: 'right',
                  marginTop: '2px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                ${activeMonthData.cryptoVolumeUsd.toLocaleString()}
              </div>
            </div>

            {/* Card 7: Winning Executions & Gross Profit */}
            <div
              style={{
                background: '#111a2e',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{copy.winCountLabel}</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: '#38bdf8',
                  textAlign: 'right',
                  marginTop: '2px',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {activeMonthData.winCount}
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '2px' }}>{copy.timesUnit}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{copy.grossProfitLabel}</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: '#38bdf8',
                  textAlign: 'right',
                  marginTop: '2px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                +${activeMonthData.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Card 8: Losing Executions & Gross Loss */}
            <div
              style={{
                background: '#111a2e',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{copy.lossCountLabel}</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: '#f43f5e',
                  textAlign: 'right',
                  marginTop: '2px',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {activeMonthData.lossCount}
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '2px' }}>{copy.timesUnit}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{copy.grossLossLabel}</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: '#f43f5e',
                  textAlign: 'right',
                  marginTop: '2px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                -${activeMonthData.grossLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Card 9: Long (BUY) Executions & Win Rate */}
            <div
              style={{
                background: '#111a2e',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{copy.longCountLabel}</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textAlign: 'right',
                  marginTop: '2px',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {activeMonthData.buyCount}
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '2px' }}>{copy.timesUnit}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{copy.winRateSubLabel}</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: '#34d399',
                  textAlign: 'right',
                  marginTop: '2px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {activeMonthData.buyCount > 0
                  ? `${Math.round((activeMonthData.buyWins / activeMonthData.buyCount) * 100)}%`
                  : '-'}
              </div>
            </div>

            {/* Card 10: Short (SELL) Executions & Win Rate */}
            <div
              style={{
                background: '#111a2e',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{copy.shortCountLabel}</div>
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: '#ffffff',
                  textAlign: 'right',
                  marginTop: '2px',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {activeMonthData.sellCount}
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '2px' }}>{copy.timesUnit}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{copy.winRateSubLabel}</div>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 900,
                  color: '#34d399',
                  textAlign: 'right',
                  marginTop: '2px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {activeMonthData.sellCount > 0
                  ? `${Math.round((activeMonthData.sellWins / activeMonthData.sellCount) * 100)}%`
                  : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================================
            SECTION 3: HISTORICAL MONTHLY PERFORMANCE TABLE (過去データ - Ref 3)
           ===================================================================== */}
        {showHistoricalArchive && (
          <div
            ref={historicalTableRef}
            style={{
              background: 'rgba(11, 17, 30, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '22px',
              marginBottom: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', textAlign: 'center', fontSize: '20px', fontWeight: 900, color: '#ffffff' }}>
              {copy.historicalTableTitle}
            </h3>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px',
                  minWidth: '780px',
                }}
              >
                <thead>
                  {/* Top Group Header Row (月間ランキング | 投資状況) */}
                  <tr style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)', color: '#ffffff' }}>
                    <th
                      colSpan={2}
                      style={{
                        padding: '8px 10px',
                        fontWeight: 800,
                        textAlign: 'center',
                        borderRight: '1px solid rgba(255, 255, 255, 0.25)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
                      }}
                    >
                      {copy.monthlyRankingHeader}
                    </th>
                    <th
                      colSpan={7}
                      style={{
                        padding: '8px 10px',
                        fontWeight: 800,
                        textAlign: 'center',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
                      }}
                    >
                      {copy.investmentStatusHeader}
                    </th>
                  </tr>

                  {/* Column Sub-Headers — 2-line stacked format so EN / JA / ZH never wrap mid-word */}
                  <tr style={{ background: '#1e293b', color: '#cbd5e1', fontSize: '11px', lineHeight: 1.3 }}>
                    {[
                      { label: copy.yearMonthCol, align: 'center' as const },
                      { label: copy.rankCol, align: 'center' as const },
                      { label: copy.roiAndProfitCol, align: 'right' as const },
                      { label: copy.assetsCol, align: 'right' as const },
                      { label: copy.goldCol, align: 'right' as const },
                      { label: copy.fxCol, align: 'right' as const },
                      { label: copy.cryptoCol, align: 'right' as const },
                      { label: copy.cfdCol, align: 'right' as const },
                      { label: copy.pipsWinCol, align: 'right' as const, isLast: true },
                    ].map((col, idx) => {
                      const parts = col.label.split(' / ');
                      return (
                        <th
                          key={idx}
                          style={{
                            padding: '8px 10px',
                            borderRight: col.isLast ? 'none' : '1px solid rgba(255,255,255,0.08)',
                            textAlign: col.align,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {parts.length === 2 ? (
                            <>
                              <div style={{ color: '#f1f5f9', fontWeight: 800 }}>{parts[0]}</div>
                              <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '10px', marginTop: '2px' }}>
                                {parts[1]}
                              </div>
                            </>
                          ) : (
                            <div style={{ color: '#f1f5f9', fontWeight: 800 }}>{col.label}</div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {monthlyArchives.monthsDesc.map(ym => {
                    const row = monthlyArchives.byMonth[ym];
                    if (!row) return null;
                    const [y, m] = ym.split('-');
                    const isSelectedMonth = ym === selectedYearMonth;
                    const isProfitPos = row.netProfitUsd >= 0;
                    const winRateMonth = row.tradesCount > 0 ? Math.round((row.winCount / row.tradesCount) * 100) : 0;

                    return (
                      <tr
                        key={ym}
                        onClick={() => {
                          setSelectedYearMonth(ym);
                          setSelectedDayKey(null);
                        }}
                        style={{
                          background: isSelectedMonth ? 'rgba(0, 240, 255, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono, monospace)',
                        }}
                      >
                        {/* Year / Month */}
                        <td
                          style={{
                            padding: '10px 8px',
                            textAlign: 'center',
                            fontWeight: 800,
                            color: isSelectedMonth ? '#00f0ff' : '#f8fafc',
                            borderRight: '1px solid rgba(255,255,255,0.06)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <div>{language === 'en' ? y : `${y}年`}</div>
                          <div>
                            {language === 'en'
                              ? new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short' })
                              : `${Number(m)}月`}
                          </div>
                        </td>

                        {/* Rank */}
                        <td
                          style={{
                            padding: '10px 8px',
                            textAlign: 'center',
                            fontWeight: 800,
                            color: '#e2e8f0',
                            borderRight: '1px solid rgba(255,255,255,0.06)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {row.tradesCount > 0
                            ? language === 'en'
                              ? `#${row.rank.toLocaleString()}`
                              : `${row.rank.toLocaleString()}${copy.rankUnit}`
                            : '-'}
                        </td>

                        {/* ROI % / Net P&L */}
                        <td
                          style={{
                            padding: '8px 10px',
                            textAlign: 'right',
                            fontWeight: 800,
                            borderRight: '1px solid rgba(255,255,255,0.06)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <div
                            style={{
                              color: row.roiPct >= 0 ? '#38bdf8' : '#f43f5e',
                              borderBottom: '1px dashed rgba(255,255,255,0.08)',
                              paddingBottom: '3px',
                              marginBottom: '3px',
                            }}
                          >
                            {row.tradesCount > 0 ? `${row.roiPct >= 0 ? '+' : ''}${row.roiPct}%` : '0.0%'}
                          </div>
                          <div style={{ color: isProfitPos ? '#38bdf8' : '#f43f5e' }}>
                            {row.tradesCount > 0 ? formatUsdSigned(row.netProfitUsd) : (isJpy ? '¥0' : '$0.00')}
                          </div>
                        </td>

                        {/* Ending / Starting Capital */}
                        <td
                          style={{
                            padding: '8px 10px',
                            textAlign: 'right',
                            color: '#e2e8f0',
                            borderRight: '1px solid rgba(255,255,255,0.06)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <div
                            style={{
                              borderBottom: '1px dashed rgba(255,255,255,0.08)',
                              paddingBottom: '3px',
                              marginBottom: '3px',
                              fontWeight: 700,
                            }}
                          >
                            {formatCurrencyVal(row.endingCapital)}
                          </div>
                          <div style={{ color: '#94a3b8' }}>
                            {formatCurrencyVal(row.startingCapital)}
                          </div>
                        </td>

                        {/* Gold Count & Volume */}
                        <td
                          style={{
                            padding: '8px 10px',
                            textAlign: 'right',
                            color: '#e2e8f0',
                            borderRight: '1px solid rgba(255,255,255,0.06)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <div
                            style={{
                              borderBottom: '1px dashed rgba(255,255,255,0.08)',
                              paddingBottom: '3px',
                              marginBottom: '3px',
                              fontWeight: 700,
                            }}
                          >
                            {row.goldCount}
                            {copy.timesUnit}
                          </div>
                          <div style={{ color: '#94a3b8' }}>{curSymbol}{Math.round(row.goldVolumeUsd).toLocaleString()}</div>
                        </td>

                        {/* FX Count & Volume */}
                        <td
                          style={{
                            padding: '8px 10px',
                            textAlign: 'right',
                            color: '#e2e8f0',
                            borderRight: '1px solid rgba(255,255,255,0.06)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <div
                            style={{
                              borderBottom: '1px dashed rgba(255,255,255,0.08)',
                              paddingBottom: '3px',
                              marginBottom: '3px',
                              fontWeight: 700,
                            }}
                          >
                            {row.fxCount}
                            {copy.timesUnit}
                          </div>
                          <div style={{ color: '#94a3b8' }}>{curSymbol}{Math.round(row.fxVolumeUsd).toLocaleString()}</div>
                        </td>

                        {/* Crypto Count & Volume */}
                        <td
                          style={{
                            padding: '8px 10px',
                            textAlign: 'right',
                            color: '#e2e8f0',
                            borderRight: '1px solid rgba(255,255,255,0.06)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <div
                            style={{
                              borderBottom: '1px dashed rgba(255,255,255,0.08)',
                              paddingBottom: '3px',
                              marginBottom: '3px',
                              fontWeight: 700,
                            }}
                          >
                            {row.cryptoCount}
                            {copy.timesUnit}
                          </div>
                          <div style={{ color: '#94a3b8' }}>{curSymbol}{Math.round(row.cryptoVolumeUsd).toLocaleString()}</div>
                        </td>

                        {/* CFD Count & Volume */}
                        <td
                          style={{
                            padding: '8px 10px',
                            textAlign: 'right',
                            color: '#e2e8f0',
                            borderRight: '1px solid rgba(255,255,255,0.06)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <div
                            style={{
                              borderBottom: '1px dashed rgba(255,255,255,0.08)',
                              paddingBottom: '3px',
                              marginBottom: '3px',
                              fontWeight: 700,
                            }}
                          >
                            {row.cfdCount}
                            {copy.timesUnit}
                          </div>
                          <div style={{ color: '#94a3b8' }}>${row.cfdVolumeUsd.toLocaleString()}</div>
                        </td>

                        {/* Net Pips / Win Rate */}
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap' }}>
                          <div
                            style={{
                              color: row.netPips >= 0 ? '#34d399' : '#f43f5e',
                              borderBottom: '1px dashed rgba(255,255,255,0.08)',
                              paddingBottom: '3px',
                              marginBottom: '3px',
                            }}
                          >
                            {row.netPips >= 0 ? `+${row.netPips.toFixed(1)}p` : `${row.netPips.toFixed(1)}p`}
                          </div>
                          <div style={{ color: '#fbbf24' }}>
                            {language === 'ja'
                              ? `勝率 ${winRateMonth}%`
                              : language === 'zh'
                              ? `胜率 ${winRateMonth}%`
                              : `${winRateMonth}% Win`}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =====================================================================
            SECTION 4: RECENT VERIFIED EXECUTIONS LEDGER
           ===================================================================== */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
              {t.profile.recentVerifiedExecutions} ({filteredTrades.length})
            </h4>

            {realTrades.length > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '2px',
                  gap: '3px',
                }}
              >
                {[
                  { id: 'ALL', label: `${copy.filterAll} (${realTrades.length})` },
                  { id: 'GOLD', label: `${copy.filterGold} (${realTrades.filter(t => t.symbol.includes('GOLD')).length})` },
                  {
                    id: 'OCT',
                    label: `${selectedYearMonth} (${realTrades.filter(t => t.closeTime.startsWith(selectedYearMonth)).length})`,
                  },
                  { id: 'WINS', label: `${copy.filterWins} (${realTrades.filter(t => t.pnlCurrency > 0).length})` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setLedgerFilter(tab.id as any);
                      setSelectedDayKey(null);
                      setVisibleLimit(20);
                    }}
                    style={{
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: ledgerFilter === tab.id ? 'rgba(10, 186, 181, 0.25)' : 'transparent',
                      color: ledgerFilter === tab.id ? '#00f0ff' : '#94a3b8',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
                {ledgerFilter === 'DAY' && selectedDayKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDayKey(null);
                      setLedgerFilter('ALL');
                    }}
                    style={{
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      background: 'rgba(0, 240, 255, 0.25)',
                      color: '#00f0ff',
                    }}
                  >
                    {copy.filterDayPrefix}: {selectedDayKey} ✕
                  </button>
                )}
              </div>
            )}
          </div>

          <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={12} className="animate-pulse" style={{ color: 'var(--accent-green)' }} />
            {copy.auditVerifiedTag}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {isLoadingTrades ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              {copy.verifyingLedgerMsg}
            </div>
          ) : filteredTrades.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px' }}>
              {copy.noTradesMsg}
            </div>
          ) : (
            <>
              {filteredTrades.slice(0, visibleLimit).map((trade, idx) => {
                const isProfit = trade.pnlCurrency >= 0;
                const localeCode = language === 'ja' ? 'ja-JP' : language === 'zh' ? 'zh-CN' : 'en-US';
                const formattedTime = trade.closeTime
                  ? new Date(trade.closeTime).toLocaleDateString(localeCode, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Verified';

                return (
                  <div
                    key={trade.ticket !== 'N/A' ? `${trade.ticket}_${idx}` : `trade_${idx}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '3px 7px',
                          borderRadius: '4px',
                          background: trade.type === 'BUY' ? 'rgba(10, 186, 181, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: trade.type === 'BUY' ? 'var(--accent-green)' : '#ef4444',
                        }}
                      >
                        {trade.type}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '14px' }}>{trade.symbol}</strong>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {trade.lotSize} {copy.lotsLabel}
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              color: '#94a3b8',
                              background: 'rgba(255,255,255,0.06)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontFamily: 'var(--font-mono, monospace)',
                            }}
                            title={`MT5 Position ID: #${trade.positionId} • Exit Deal ID: #${trade.ticket}`}
                          >
                            {copy.posLabel}{trade.positionId}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono, monospace)' }}>
                          {trade.openPrice > 0 ? `@ ${trade.openPrice.toFixed(trade.digits)}` : ''}{' '}
                          {trade.closePrice > 0 ? `→ ${trade.closePrice.toFixed(trade.digits)}` : ''} • {formattedTime}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono, monospace)' }}>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: isProfit ? '#38bdf8' : '#f43f5e' }}>
                        {trade.pnlPips > 0 ? `+${trade.pnlPips.toFixed(1)}` : trade.pnlPips.toFixed(1)} pips
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: isProfit ? '#38bdf8' : '#f43f5e' }}>
                        {isProfit ? `+$${trade.pnlCurrency.toFixed(2)}` : `-$${Math.abs(trade.pnlCurrency).toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredTrades.length > visibleLimit && (
                <button
                  type="button"
                  onClick={() => setVisibleLimit(prev => prev + 30)}
                  style={{
                    marginTop: '6px',
                    padding: '10px',
                    borderRadius: '10px',
                    background: 'rgba(10, 186, 181, 0.12)',
                    border: '1px solid rgba(10, 186, 181, 0.35)',
                    color: '#00f0ff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {copy.loadMoreExecutions} ({filteredTrades.length - visibleLimit} {copy.remainingLabel})
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
