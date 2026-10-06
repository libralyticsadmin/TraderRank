/**
 * TraderRank Multi-Language (i18n) Dictionary
 * Supported Languages: English (en), Japanese (ja), Mandarin Chinese (zh)
 * Design & Terminology styled after Bitget / Pro Crypto & FX Trading Exchanges.
 */

export type Language = 'en' | 'ja' | 'zh';

export interface TranslationDictionary {
  // Navigation & Headers
  nav: {
    terminal: string;
    landing: string;
    overview: string;
    dailyIntel: string;
    liveCharts: string;
    rankings: string;
    tournaments: string;
    rewards: string;
    community: string;
    positions: string;
    securityVault: string;
    connectAccount: string;
    proLeague: string;
    proSubscriber: string;
    unlockPro: string;
    proPlanActive: string;
    viewOnlyBadge: string;
    wsConnected: string;
    wsConnecting: string;
    refreshRates: string;
    switchView: string;
  };
  // Landing Page
  landing: {
    badge: string;
    heroTitlePrefix: string;
    heroTitleAccent: string;
    heroTitleSuffix: string;
    heroSubtitle: string;
    enterArenaBtn: string;
    connectBrokerBtn: string;
    exploreChartsBtn: string;
    verifiedPnlBadge: string;
    zeroWriteGuarantee: string;
    liveBrokersCount: string;
    activeTradersCount: string;
    volume24h: string;
    topPerformersTitle: string;
    topPerformersSubtitle: string;
    tabPips: string;
    tabProfit: string;
    tabWinRate: string;
    rankCol: string;
    traderCol: string;
    brokerCol: string;
    gainCol: string;
    winRateCol: string;
    actionCol: string;
    viewProfile: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
    feature4Title: string;
    feature4Desc: string;
    ctaHeading: string;
    ctaSubtitle: string;
    ctaButton: string;
  };
  // Daily Intelligence Hub
  intel: {
    title: string;
    subtitle: string;
    marketRegime: string;
    sentimentGreed: string;
    sentimentFear: string;
    sentimentNeutral: string;
    forexFactoryNews: string;
    customTimeframeEngine: string;
    symbolSelect: string;
    timeframeSelect: string;
    riskRewardTarget: string;
    rr1_3: string;
    rr1_5: string;
    rr1_7: string;
    strategyType: string;
    generateAnalysis: string;
    analyzing: string;
    tradeQualification: string;
    directiveQualified: string;
    directiveDisqualified: string;
    doNotEnterTrade: string;
    findOtherPairs: string;
    alternativePairs: string;
    recommendedAction: string;
    entryZone: string;
    stopLoss: string;
    takeProfit1: string;
    takeProfit2: string;
    takeProfit3: string;
    smcKeyLevels: string;
    orderBlock: string;
    demandZone: string;
    supplyZone: string;
    institutionalBias: string;
    unlockProPrompt: string;
    unlockProBtn: string;
    pricePerMonth: string;
  };
  // Live Chart & SMC
  chart: {
    liveFeed: string;
    candlestickStream: string;
    selectPair: string;
    timeframe: string;
    indicators: string;
    customIndicators: string;
    smcOverlay: string;
    bosDetected: string;
    chocDetected: string;
    fairValueGap: string;
    highPrecision: string;
    bid: string;
    ask: string;
    spread: string;
    volume: string;
    realtimeTick: string;
  };
  // Subscription / Paywall Modal
  subscription: {
    modalTitle: string;
    modalSubtitle: string;
    monthlyTier: string;
    monthlyPrice: string;
    annualTier: string;
    annualPrice: string;
    annualSavings: string;
    perMonth: string;
    billedAnnually: string;
    billedMonthly: string;
    selectPlan: string;
    currentPlan: string;
    paymentMethodsTitle: string;
    creditCard: string;
    appleGooglePay: string;
    cryptoUsdt: string;
    cardNumber: string;
    cardExpiry: string;
    cardCvc: string;
    cardholderName: string;
    oneClickCheckout: string;
    cryptoNetwork: string;
    depositAddress: string;
    copyAddress: string;
    copied: string;
    timerRemaining: string;
    confirmAndUnlock: string;
    processingPayment: string;
    congratsTitle: string;
    congratsSubtitle: string;
    licenseId: string;
    downloadReceipt: string;
    launchIntelBtn: string;
    guaranteeText: string;
  };
  // Account Connection & Security
  connector: {
    modalTitle: string;
    modalSubtitle: string;
    selectBroker: string;
    brokerServer: string;
    loginId: string;
    passwordLabel: string;
    investorPasswordHint: string;
    accountNickname: string;
    connectBtn: string;
    connecting: string;
    connectedSuccess: string;
    zeroWriteTitle: string;
    zeroWriteDesc: string;
    readOnlyAudited: string;
    disconnectAccount: string;
    activePositionsCount: string;
    accountBalance: string;
    accountEquity: string;
  };
  // Tournaments & Rewards
  arena: {
    tournamentsTitle: string;
    tournamentsSubtitle: string;
    liveContests: string;
    upcomingContests: string;
    prizePool: string;
    participants: string;
    timeLeft: string;
    joinArena: string;
    registered: string;
    dailyChampionTitle: string;
    dailyChampionPips: string;
    badgesTitle: string;
    communityFeedTitle: string;
    liveTradeFeed: string;
  };
  // Footer
  footer: {
    poweredBy: string;
    companyName: string;
    allRightsReserved: string;
    riskDisclaimer: string;
    privacyPolicy: string;
    termsOfService: string;
    apiDocs: string;
    systemStatus: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    nav: {
      terminal: 'Live Terminal',
      landing: 'Trade Island',
      overview: 'Overview',
      dailyIntel: 'Daily Intel Hub',
      liveCharts: 'Live Charts & SMC',
      rankings: 'Leaderboard',
      tournaments: 'Tournaments',
      rewards: 'Badges & Rewards',
      community: 'Community',
      positions: 'Active Positions',
      securityVault: 'Zero-Write Vault',
      connectAccount: '+ Connect Broker',
      proLeague: 'PRO LEAGUE',
      proSubscriber: 'PRO ACTIVE',
      unlockPro: 'Unlock Pro ($9/mo)',
      proPlanActive: 'PRO ALL-ACCESS',
      viewOnlyBadge: 'IMMUTABLE VIEW-ONLY',
      wsConnected: 'LIVE FEED CONNECTED',
      wsConnecting: 'CONNECTING FEED...',
      refreshRates: 'Refresh Live Rates',
      switchView: 'Switch View',
    },
    landing: {
      badge: 'VERIFIED MULTI-BROKER ARENA',
      heroTitlePrefix: 'The Global Arena for ',
      heroTitleAccent: 'Verified Forex Masters',
      heroTitleSuffix: '',
      heroSubtitle:
        'Connect MT4 & MT5 across XM, Exness, Axiory, and Vantage with zero-write investor passwords. Compete in live pip tournaments, track audited metrics, and unlock institutional AI intelligence.',
      enterArenaBtn: 'Enter Live Arena',
      connectBrokerBtn: 'Connect Broker Account',
      exploreChartsBtn: 'Explore Live Charts',
      verifiedPnlBadge: '100% Cryptographically Verified MT4/MT5 Feeds',
      zeroWriteGuarantee: 'Zero-Write Security: Funds Remain 100% Inaccessible',
      liveBrokersCount: 'Supported Top Tier Brokers',
      activeTradersCount: 'Active Competing Traders',
      volume24h: '24h Audited Volume',
      topPerformersTitle: "Today's Top Podium Champions",
      topPerformersSubtitle: 'Real-time pip yields computed directly from verified broker ledger streams.',
      tabPips: 'Pips Gained',
      tabProfit: 'Net Profit ($)',
      tabWinRate: 'Win Rate (%)',
      rankCol: 'RANK',
      traderCol: 'TRADER',
      brokerCol: 'BROKER',
      gainCol: 'DAILY PIPS',
      winRateCol: 'WIN RATE',
      actionCol: 'ACTION',
      viewProfile: 'View Intel',
      feature1Title: 'Zero-Write Investor Protocol',
      feature1Desc: 'Trade safely. We only accept investor passwords with read-only permission — zero order execution capability guaranteed.',
      feature2Title: 'Institutional SMC Engine',
      feature2Desc: 'Automated Order Block, Break of Structure (BOS), and 5-decimal demand zones mapped in real-time.',
      feature3Title: 'Staged 1:3, 1:5, 1:7 R:R Directives',
      feature3Desc: 'Enforces professional asymmetric risk management. If setup fails criteria, system instructs: DO NOT ENTER TRADE.',
      feature4Title: 'Live Multi-Broker Tournaments',
      feature4Desc: 'Climb daily and weekly leaderboard seasons. Win verifiable on-chain badges and member prestige.',
      ctaHeading: 'Ready to Prove Your Edge on the Global Stage?',
      ctaSubtitle: 'Join thousands of forex traders competing across live MT4 & MT5 feeds with institutional daily intelligence.',
      ctaButton: 'Launch TraderRank Terminal Now',
    },
    intel: {
      title: 'Daily Trading Intelligence & Institutional Setup Hub',
      subtitle: 'Real-time multi-timeframe SMC confluence, ForexFactory macro news, and strict 1:3 / 1:5 / 1:7 R:R trade qualification.',
      marketRegime: 'Market Macro Regime',
      sentimentGreed: 'Greed / Risk-On Expansion',
      sentimentFear: 'Fear / Risk-Off Liquidity Hunt',
      sentimentNeutral: 'Equilibrium / Range Consolidation',
      forexFactoryNews: 'ForexFactory Macro Releases & Economic Events',
      customTimeframeEngine: 'Custom Strategic Timeframe & Analysis Generator',
      symbolSelect: 'Select Symbol',
      timeframeSelect: 'Strategic Timeframe',
      riskRewardTarget: 'Risk-to-Reward (R:R) Target',
      rr1_3: 'Target 1:3 — Conservative Target',
      rr1_5: 'Target 1:5 — Staged Momentum Target',
      rr1_7: 'Target 1:7 — Institutional Asymmetric Runner',
      strategyType: 'Trading Strategy Type',
      generateAnalysis: 'Generate Custom Strategy Analysis',
      analyzing: 'Analyzing Institutional Order Flow...',
      tradeQualification: 'Trade Qualification Directive',
      directiveQualified: 'QUALIFIED SETUP — EXECUTION CRITERIA MET',
      directiveDisqualified: 'STRICT DIRECTIVE: DO NOT ENTER TRADE',
      doNotEnterTrade: '⛔ DO NOT ENTER TRADE',
      findOtherPairs: 'FIND OTHER PAIR FOR TRADING',
      alternativePairs: 'Recommended Alternative Pairs with Higher R:R Confluence:',
      recommendedAction: 'Strategic Action',
      entryZone: 'Optimal Entry Zone',
      stopLoss: 'Tactical Stop Loss',
      takeProfit1: 'TP1 (1:3 Target)',
      takeProfit2: 'TP2 (1:5 Target)',
      takeProfit3: 'TP3 (1:7 Runner Target)',
      smcKeyLevels: 'SMC Institutional Order Blocks & Demand Zones',
      orderBlock: 'Institutional Order Block',
      demandZone: 'Key Demand Zone',
      supplyZone: 'Key Supply Zone',
      institutionalBias: 'Institutional Bias',
      unlockProPrompt: 'Unlock Full Daily Market Intelligence & Custom Analysis Engine for just $9/month.',
      unlockProBtn: 'Unlock Full Access for $9/mo →',
      pricePerMonth: '$9 / month',
    },
    chart: {
      liveFeed: 'Live Candlestick Feed (AllTick / OANDA)',
      candlestickStream: 'High-Frequency Tick Streaming',
      selectPair: 'Select Pair',
      timeframe: 'Timeframe',
      indicators: 'Indicators',
      customIndicators: 'Custom Indicator Studio',
      smcOverlay: 'Smart Money Concepts (SMC) Overlay',
      bosDetected: 'BOS (Break of Structure)',
      chocDetected: 'CHoCH (Change of Character)',
      fairValueGap: 'FVG (Fair Value Gap)',
      highPrecision: '5-Decimal Forex Precision',
      bid: 'BID',
      ask: 'ASK',
      spread: 'SPREAD',
      volume: 'VOL',
      realtimeTick: 'LIVE TICK',
    },
    subscription: {
      modalTitle: 'TraderRank Pro — Daily Intelligence All-Access',
      modalSubtitle: 'Get daily institutional trade setups, 1:3 / 1:5 / 1:7 R:R qualifiers, SMC zones, and multi-timeframe AI engine.',
      monthlyTier: 'Pro Monthly Access',
      monthlyPrice: '$9.00',
      annualTier: 'Pro Annual All-Access',
      annualPrice: '$79.00',
      annualSavings: 'Save 27% ($6.58/mo)',
      perMonth: '/ month',
      billedAnnually: 'Billed annually ($79/yr)',
      billedMonthly: 'Billed monthly ($9/mo)',
      selectPlan: 'Select Plan',
      currentPlan: 'Current Plan',
      paymentMethodsTitle: 'Choose Payment Gateway',
      creditCard: 'Credit / Debit Card',
      appleGooglePay: 'Apple Pay / Google Pay (1-Click)',
      cryptoUsdt: 'Crypto (USDT TRC20 / ERC20 / BTC)',
      cardNumber: 'Card Number',
      cardExpiry: 'MM / YY',
      cardCvc: 'CVC / CVV',
      cardholderName: 'Cardholder Name',
      oneClickCheckout: '1-Click Instant Authorization',
      cryptoNetwork: 'Select Transfer Network',
      depositAddress: 'Deposit Address',
      copyAddress: 'Copy Address',
      copied: 'Copied to Clipboard!',
      timerRemaining: 'Payment Window Remaining',
      confirmAndUnlock: 'Confirm & Unlock Pro Access →',
      processingPayment: 'Securing Merchant Authorization...',
      congratsTitle: 'Welcome to TraderRank Pro!',
      congratsSubtitle: 'Your Pro subscription is active. All premium trading intelligence and custom AI engines are unlocked.',
      licenseId: 'MEMBER LICENSE ID',
      downloadReceipt: 'Download Tax Invoice (PDF)',
      launchIntelBtn: 'Launch Daily Trading Intelligence →',
      guaranteeText: 'Instant unlock • 14-day money back guarantee • Cancel anytime with 1 click.',
    },
    connector: {
      modalTitle: 'Connect MT4 / MT5 Broker Account',
      modalSubtitle: 'Read-only verified telemetry. We only require your investor password to ingest trades and rankings.',
      selectBroker: 'Select Broker',
      brokerServer: 'Broker Server Name',
      loginId: 'Account Login / ID',
      passwordLabel: 'Investor Password (Read-Only)',
      investorPasswordHint: 'Never share your master trading password. Investor passwords grant 100% read-only access.',
      accountNickname: 'Account Nickname',
      connectBtn: 'Verify & Link Account',
      connecting: 'Establishing Secure Cloud Bridge...',
      connectedSuccess: 'Account Connected Successfully!',
      zeroWriteTitle: 'Zero-Write Security Guarantee',
      zeroWriteDesc: 'TraderRank operates strictly as an immutable spectator. Execution and withdrawal functions are physically impossible.',
      readOnlyAudited: 'Zero-Write Audit Verified',
      disconnectAccount: 'Disconnect Account & Purge Credentials',
      activePositionsCount: 'Open Floating Positions',
      accountBalance: 'Balance',
      accountEquity: 'Equity',
    },
    arena: {
      tournamentsTitle: 'Live Trading Tournament Arena',
      tournamentsSubtitle: 'Compete with verified MT4/MT5 traders globally for prizes, prestige, and verified track records.',
      liveContests: 'Live Active Arenas',
      upcomingContests: 'Upcoming Tournaments',
      prizePool: 'Prize Pool',
      participants: 'Contenders',
      timeLeft: 'Time Remaining',
      joinArena: 'Enter Tournament Arena',
      registered: 'Registered',
      dailyChampionTitle: 'Daily Pip Crown Champion',
      dailyChampionPips: 'Daily Net Pips',
      badgesTitle: 'Achievement Badges & Tier Prestige',
      communityFeedTitle: 'Live Global Community Stream',
      liveTradeFeed: 'Real-Time Trade Stream',
    },
    footer: {
      poweredBy: 'Powered by',
      companyName: 'Libralytic Co.,Ltd',
      allRightsReserved: 'All Rights Reserved',
      riskDisclaimer: 'Trading Forex and CFDs carries a high level of risk. Performance metrics are read-only and for informational purposes only.',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      apiDocs: 'API Documentation',
      systemStatus: 'System Status: All Services Operational',
    },
  },

  ja: {
    nav: {
      terminal: 'ライブターミナル',
      landing: 'トレードアイランド',
      overview: '概要',
      dailyIntel: '日次インテリジェンス',
      liveCharts: 'ライブチャート & SMC',
      rankings: 'リーダーボード',
      tournaments: 'トーナメント',
      rewards: 'バッジ & 特典',
      community: 'コミュニティ',
      positions: '保有ポジション',
      securityVault: 'ゼロライト金庫',
      connectAccount: '+ ブローカー接続',
      proLeague: 'プロリーグ',
      proSubscriber: 'PRO有効',
      unlockPro: 'Proを解除 ($9/月)',
      proPlanActive: 'PROオールアクセス',
      viewOnlyBadge: '閲覧専用・書き込み不可',
      wsConnected: 'ライブフィード接続中',
      wsConnecting: 'フィード接続中...',
      refreshRates: 'レートを更新',
      switchView: '表示切替',
    },
    landing: {
      badge: '検証済みマルチブローカーアリーナ',
      heroTitlePrefix: '世界最高峰の ',
      heroTitleAccent: '検証済みFXトレーダーアリーナ',
      heroTitleSuffix: '',
      heroSubtitle:
        'XM、Exness、Axiory、VantageのMT4/MT5口座を閲覧専用パスワードで安全に連携。リアルタイムのPipsトーナメントで競い、検証済み実績を証明、機関投資家レベルのAI分析を活用しましょう。',
      enterArenaBtn: 'アリーナに入る',
      connectBrokerBtn: 'ブローカー口座を連携',
      exploreChartsBtn: 'チャートを見る',
      verifiedPnlBadge: '100% 暗号署名検証済み MT4/MT5 フィード',
      zeroWriteGuarantee: 'ゼロライト安全保証: 資金の引き出しや発注は物理的に不可能です',
      liveBrokersCount: '対応大手ブローカー',
      activeTradersCount: '参戦中のアクティブトレーダー',
      volume24h: '24時間 監査済み取引高',
      topPerformersTitle: '本日の表彰台チャンピオン',
      topPerformersSubtitle: '検証済みブローカー台帳ストリームから直接算出されたリアルタイム獲得Pips。',
      tabPips: '獲得Pips',
      tabProfit: '純利益 ($)',
      tabWinRate: '勝率 (%)',
      rankCol: '順位',
      traderCol: 'トレーダー',
      brokerCol: 'ブローカー',
      gainCol: '本日Pips',
      winRateCol: '勝率',
      actionCol: '操作',
      viewProfile: '詳細を見る',
      feature1Title: 'ゼロライト（閲覧専用）プロトコル',
      feature1Desc: '安全なデータ連携。インベスター（閲覧専用）パスワードのみを受理し、一切の発注・決済を行いません。',
      feature2Title: '機関投資家向け SMC エンジン',
      feature2Desc: 'オーダーブロック、構造ブレイク（BOS）、5桁精度の需要/供給ゾーンをリアルタイム検出。',
      feature3Title: '1:3 / 1:5 / 1:7 リスクリワード判定',
      feature3Desc: '非対称なプロ向け資金管理を徹底。条件を満たさない場合は「エントリー不可（他通貨ペアを探す）」と厳格指示。',
      feature4Title: 'リアルタイム・マルチブローカートーナメント',
      feature4Desc: '日次・週次のリーダーボードシーズンに参加し、オンチェーン検証可能なバッジと栄誉を獲得。',
      ctaHeading: '世界のアリーナであなたの実力を証明しませんか？',
      ctaSubtitle: '数千人のFXトレーダーがリアルタイムMT4/MT5フィードで競い合い、機関投資家向けAIインテリジェンスを活用しています。',
      ctaButton: 'TraderRank ターミナルを起動',
    },
    intel: {
      title: '日次トレーディング・インテリジェンス & 機関セットアップハブ',
      subtitle: '複数時間足SMCコンフルエンス、ForexFactoryマクロ指標、厳格な1:3 / 1:5 / 1:7 R:Rトレード適合判定。',
      marketRegime: 'マクロ市場レジーム',
      sentimentGreed: '強気 / リスクオン拡大',
      sentimentFear: '弱気 / リスクオフ流動性ハント',
      sentimentNeutral: '均衡 / レンジ保ち合い',
      forexFactoryNews: 'ForexFactory 経済指標 & マクロイベント',
      customTimeframeEngine: 'カスタム戦略時間足 & AI分析ジェネレーター',
      symbolSelect: '通貨ペア・銘柄を選択',
      timeframeSelect: '戦略的時間足',
      riskRewardTarget: '目標リスクリワード比 (R:R)',
      rr1_3: '目標 1:3 — 堅実なターゲット',
      rr1_5: '目標 1:5 — トレンド推進ターゲット',
      rr1_7: '目標 1:7 — 機関投資家向け非対称ランナー',
      strategyType: 'トレード戦略タイプ',
      generateAnalysis: 'カスタム戦略分析を生成',
      analyzing: '機関オーダーフローを分析中...',
      tradeQualification: 'トレード適合判定ディレクティブ',
      directiveQualified: '適合セットアップ — エントリー条件を完全に満たしています',
      directiveDisqualified: '厳格指示: トレードにエントリーしないでください',
      doNotEnterTrade: '⛔ トレードエントリー不可',
      findOtherPairs: '他の通貨ペアを探索してください',
      alternativePairs: 'より高いR:Rコンフルエンスを持つ推奨代替ペア:',
      recommendedAction: '推奨アクション',
      entryZone: '最適エントリーゾーン',
      stopLoss: '戦略的損切り (SL)',
      takeProfit1: 'TP1 (1:3 ターゲット)',
      takeProfit2: 'TP2 (1:5 ターゲット)',
      takeProfit3: 'TP3 (1:7 ランナーターゲット)',
      smcKeyLevels: 'SMC 機関オーダーブロック & 需要ゾーン',
      orderBlock: '機関オーダーブロック (OB)',
      demandZone: '主要需要ゾーン (Demand)',
      supplyZone: '主要供給ゾーン (Supply)',
      institutionalBias: '機関投資家バイアス',
      unlockProPrompt: '月額わずか $9 で日次マーケットインテリジェンスとAIカスタム分析エンジンを全解除。',
      unlockProBtn: '月額 $9 でProを解除する →',
      pricePerMonth: '$9 / 月',
    },
    chart: {
      liveFeed: 'リアルタイムローソク足フィード (AllTick / OANDA)',
      candlestickStream: '高頻度ティックストリーミング',
      selectPair: '銘柄選択',
      timeframe: '時間足',
      indicators: 'インジケーター',
      customIndicators: 'カスタムインジケータースタジオ',
      smcOverlay: 'SMC（スマートマネーコンセプト）オーバーレイ',
      bosDetected: 'BOS (構造ブレイク)',
      chocDetected: 'CHoCH (トレンド転換)',
      fairValueGap: 'FVG (フェアバリューギャップ)',
      highPrecision: '5桁FX高精度表示',
      bid: '買値 (BID)',
      ask: '売値 (ASK)',
      spread: 'スプレッド',
      volume: '出来高',
      realtimeTick: 'リアルタイムティック',
    },
    subscription: {
      modalTitle: 'TraderRank Pro — 日次インテリジェンス オールアクセス',
      modalSubtitle: '毎日の機関トレードセットアップ、1:3 / 1:5 / 1:7 R:R判定、SMCゾーン、AI複数時間足分析を解放。',
      monthlyTier: 'Pro 月額プラン',
      monthlyPrice: '$9.00',
      annualTier: 'Pro 年間プラン',
      annualPrice: '$79.00',
      annualSavings: '27% お得 (実質 $6.58/月)',
      perMonth: '/ 月',
      billedAnnually: '年間一括請求 ($79/年)',
      billedMonthly: '月額請求 ($9/月)',
      selectPlan: 'プランを選択',
      currentPlan: '現在のプラン',
      paymentMethodsTitle: '決済方法を選択',
      creditCard: 'クレジットカード / デビットカード',
      appleGooglePay: 'Apple Pay / Google Pay (ワンクリック)',
      cryptoUsdt: '暗号資産 (USDT TRC20 / ERC20 / BTC)',
      cardNumber: 'カード番号',
      cardExpiry: '月 / 年 (MM/YY)',
      cardCvc: 'CVC / セキュリティコード',
      cardholderName: 'カード名義人',
      oneClickCheckout: 'ワンクリック即時決済',
      cryptoNetwork: '送金ネットワークを選択',
      depositAddress: '入金用アドレス',
      copyAddress: 'アドレスをコピー',
      copied: 'クリップボードにコピーしました！',
      timerRemaining: '決済有効期限',
      confirmAndUnlock: '決済を完了してProを解除 →',
      processingPayment: '決済を安全に処理中...',
      congratsTitle: 'TraderRank Pro へようこそ！',
      congratsSubtitle: 'Proプランが有効になりました。すべてのプレミアムインテリジェンスとカスタムAI機能をご利用いただけます。',
      licenseId: '会員ライセンスID',
      downloadReceipt: '領収書 (PDF) をダウンロード',
      launchIntelBtn: '日次インテリジェンスを起動 →',
      guaranteeText: '即時利用可能 • 14日間返金保証 • いつでもワンクリックで解約可能。',
    },
    connector: {
      modalTitle: 'MT4 / MT5 ブローカー口座を連携',
      modalSubtitle: '閲覧専用の安全な連携。実績とランキング収集のためインベスター（閲覧専用）パスワードのみを使用します。',
      selectBroker: 'ブローカーを選択',
      brokerServer: 'ブローカーサーバー名',
      loginId: '口座ログインID',
      passwordLabel: 'インベスターパスワード (閲覧専用)',
      investorPasswordHint: 'マスター取引パスワードは絶対に入力しないでください。インベスターパスワードで安全に連携できます。',
      accountNickname: '口座ニックネーム',
      connectBtn: '検証して口座を連携',
      connecting: '安全なクラウドアダプターに接続中...',
      connectedSuccess: '口座の連携に成功しました！',
      zeroWriteTitle: 'ゼロライト安全保証',
      zeroWriteDesc: 'TraderRankは閲覧専用システムとして動作します。取引の執行や資金の引き出しは物理的にブロックされます。',
      readOnlyAudited: 'ゼロライト監査検証済み',
      disconnectAccount: '口座の連携を解除して認証情報を完全破棄',
      activePositionsCount: '保有ポジション数',
      accountBalance: '口座残高',
      accountEquity: '有効証拠金',
    },
    arena: {
      tournamentsTitle: 'リアルタイム・トレードトーナメントアリーナ',
      tournamentsSubtitle: '世界中の検証済みMT4/MT5トレーダーと賞金、名誉、公式実績をかけて競い合いましょう。',
      liveContests: '開催中のアリーナ',
      upcomingContests: '近日開催のトーナメント',
      prizePool: '賞金総額',
      participants: '参加者数',
      timeLeft: '残り時間',
      joinArena: 'トーナメントに参加',
      registered: '参加登録済み',
      dailyChampionTitle: '本日のPipsクラウンチャンピオン',
      dailyChampionPips: '本日獲得純Pips',
      badgesTitle: '獲得バッジ & ランクプレステージ',
      communityFeedTitle: 'グローバル・コミュニティストリーム',
      liveTradeFeed: 'リアルタイム取引速報',
    },
    footer: {
      poweredBy: 'Powered by',
      companyName: 'Libralytic Co.,Ltd',
      allRightsReserved: 'All Rights Reserved',
      riskDisclaimer: 'FXおよびCFD取引には高いリスクが伴います。表示されている実績データは閲覧専用であり、投資助言を目的としたものではありません。',
      privacyPolicy: 'プライバシーポリシー',
      termsOfService: '利用規約',
      apiDocs: 'API ドキュメント',
      systemStatus: 'システム稼働状況: 全サービス正常稼働中',
    },
  },

  zh: {
    nav: {
      terminal: '实时交易终端',
      landing: '交易之岛',
      overview: '总览',
      dailyIntel: '每日交易情报',
      liveCharts: '实时图表 & SMC',
      rankings: '排行榜',
      tournaments: '交易锦标赛',
      rewards: '勋章 & 奖励',
      community: '社区动态',
      positions: '当前持仓',
      securityVault: '只读安全金库',
      connectAccount: '+ 绑定经纪商账户',
      proLeague: 'PRO 联赛',
      proSubscriber: 'PRO 会员激活',
      unlockPro: '解锁 Pro ($9/月)',
      proPlanActive: 'PRO 全功能通行',
      viewOnlyBadge: '只读只查 • 无法写入',
      wsConnected: '实时行情已连接',
      wsConnecting: '正在连接行情...',
      refreshRates: '刷新实时汇率',
      switchView: '切换视图',
    },
    landing: {
      badge: '权威多经纪商实盘竞技场',
      heroTitlePrefix: '全球顶尖 ',
      heroTitleAccent: '外汇高手实盘竞技场',
      heroTitleSuffix: '',
      heroSubtitle:
        '通过只读观察员密码安全连接 XM、Exness、Axiory、Vantage 的 MT4/MT5 实盘账户。参与实时点数（Pips）锦标赛，获取经审计的真实战绩，解锁机构级 AI 交易情报。',
      enterArenaBtn: '进入竞技场',
      connectBrokerBtn: '绑定经纪商账户',
      exploreChartsBtn: '查看实时图表',
      verifiedPnlBadge: '100% 密码学验真 MT4/MT5 实盘数据',
      zeroWriteGuarantee: '零写入安全保证：绝无划转或代操盘权限',
      liveBrokersCount: '已支持主流顶级经纪商',
      activeTradersCount: '正在竞技的实盘交易员',
      volume24h: '24小时经审计交易量',
      topPerformersTitle: '今日领奖台冠军',
      topPerformersSubtitle: '由经审计的经纪商实时账本数据直接计算出的今日净获利点数（Pips）。',
      tabPips: '净获利点数 (Pips)',
      tabProfit: '净利润 ($)',
      tabWinRate: '胜率 (%)',
      rankCol: '排名',
      traderCol: '交易员',
      brokerCol: '经纪商',
      gainCol: '今日点数',
      winRateCol: '胜率',
      actionCol: '操作',
      viewProfile: '查看情报',
      feature1Title: '零写入观察员协议',
      feature1Desc: '安全无忧。我们仅接收只读投资人密码，系统在底层物理级隔绝任何下单与平仓权限。',
      feature2Title: '机构级 SMC 智能引擎',
      feature2Desc: '自动标定订单块（Order Block）、结构突破（BOS）及 5 位小数精度供需关键带。',
      feature3Title: '分阶 1:3 / 1:5 / 1:7 盈亏比判定',
      feature3Desc: '执行专业非对称风控规则。若形态不符，系统将下达严格指令：不可入场交易，请寻找其他品种。',
      feature4Title: '实时跨平台交易锦标赛',
      feature4Desc: '冲击每日与每周天梯排行榜，赢得可链上验真的专属勋章与尊贵荣誉。',
      ctaHeading: '准备好在全球舞台上证明你的实力了吗？',
      ctaSubtitle: '加入数千名顶尖外汇交易员的行列，通过实盘 MT4/MT5 数据竞技，尊享机构级 AI 策略情报。',
      ctaButton: '立即启动 TraderRank 终端',
    },
    intel: {
      title: '每日交易情报 & 机构策略工坊',
      subtitle: '多周期 SMC 共振、ForexFactory 宏观财经日历、严格 1:3 / 1:5 / 1:7 盈亏比入场资格鉴定。',
      marketRegime: '宏观市场状态',
      sentimentGreed: '贪婪 / 顺势扩张 Risk-On',
      sentimentFear: '恐慌 / 流动性猎杀 Risk-Off',
      sentimentNeutral: '均衡 / 震荡整理区间',
      forexFactoryNews: 'ForexFactory 财经日历 & 宏观重磅事件',
      customTimeframeEngine: '自定义策略周期 & 智能分析生成器',
      symbolSelect: '选择交易品种',
      timeframeSelect: '策略分析周期',
      riskRewardTarget: '目标盈亏比 (R:R)',
      rr1_3: '目标 1:3 — 稳健止盈目标',
      rr1_5: '目标 1:5 — 趋势推升目标',
      rr1_7: '目标 1:7 — 机构级非对称长波段目标',
      strategyType: '交易策略类型',
      generateAnalysis: '生成专属策略研报',
      analyzing: '正在解析机构订单流...',
      tradeQualification: '交易入场资格指令',
      directiveQualified: '具备入场资格 — 完全符合高盈亏比执行标准',
      directiveDisqualified: '严格指令：禁止入场交易',
      doNotEnterTrade: '⛔ 禁止入场交易',
      findOtherPairs: '请寻找其他交易品种',
      alternativePairs: '推荐具有更高盈亏比共振的替代品种：',
      recommendedAction: '策略行动建议',
      entryZone: '最佳入场区间',
      stopLoss: '防守止损位 (SL)',
      takeProfit1: 'TP1 (1:3 目标位)',
      takeProfit2: 'TP2 (1:5 目标位)',
      takeProfit3: 'TP3 (1:7 长波段目标位)',
      smcKeyLevels: 'SMC 机构订单块 & 供需关键位',
      orderBlock: '机构订单块 (OB)',
      demandZone: '核心需求区 (Demand)',
      supplyZone: '核心供应区 (Supply)',
      institutionalBias: '机构多空倾向',
      unlockProPrompt: '每月仅需 $9，即可全面解锁每日机构市场情报与自定义 AI 分析引擎。',
      unlockProBtn: '立即以 $9/月 解锁完整权限 →',
      pricePerMonth: '$9 / 月',
    },
    chart: {
      liveFeed: '实时 K 线数据源 (AllTick / OANDA)',
      candlestickStream: '高频 Tick 数据流',
      selectPair: '选择品种',
      timeframe: '周期',
      indicators: '技术指标',
      customIndicators: '自定义指标工坊',
      smcOverlay: 'SMC 聪明钱概念图层',
      bosDetected: 'BOS (结构突破)',
      chocDetected: 'CHoCH (特征转换)',
      fairValueGap: 'FVG (价值失衡区)',
      highPrecision: '5 位小数外汇高精度报价',
      bid: '买价 (BID)',
      ask: '卖价 (ASK)',
      spread: '点差',
      volume: '成交量',
      realtimeTick: '实时报价',
    },
    subscription: {
      modalTitle: 'TraderRank Pro — 每日交易情报全功能版',
      modalSubtitle: '获取每日机构策略指引、1:3 / 1:5 / 1:7 盈亏比鉴定、SMC 核心关键带及多周期 AI 分析。',
      monthlyTier: 'Pro 按月订阅',
      monthlyPrice: '$9.00',
      annualTier: 'Pro 年度畅享版',
      annualPrice: '$79.00',
      annualSavings: '省 27% (折合 $6.58/月)',
      perMonth: '/ 月',
      billedAnnually: '按年结算 ($79/年)',
      billedMonthly: '按月结算 ($9/月)',
      selectPlan: '选择订阅方案',
      currentPlan: '当前方案',
      paymentMethodsTitle: '选择支付渠道',
      creditCard: '信用卡 / 借记卡 (Visa/Mastercard)',
      appleGooglePay: 'Apple Pay / Google Pay (一键快捷支付)',
      cryptoUsdt: '加密货币 (USDT TRC20 / ERC20 / BTC)',
      cardNumber: '卡号',
      cardExpiry: '有效期 (MM/YY)',
      cardCvc: '安全码 (CVC)',
      cardholderName: '持卡人姓名',
      oneClickCheckout: '一键极速授权',
      cryptoNetwork: '选择转账网络',
      depositAddress: '充值收款地址',
      copyAddress: '复制地址',
      copied: '已复制到剪贴板！',
      timerRemaining: '支付有效倒计时',
      confirmAndUnlock: '确认支付并解锁 Pro 权限 →',
      processingPayment: '正在安全处理商户授权...',
      congratsTitle: '欢迎加入 TraderRank Pro！',
      congratsSubtitle: '您的 Pro 会员已成功激活。所有高级交易情报与专属 AI 分析引擎现已完全解锁。',
      licenseId: '会员授权许可证 ID',
      downloadReceipt: '下载发票电子凭证 (PDF)',
      launchIntelBtn: '立即启动每日交易情报 →',
      guaranteeText: '即时生效 • 14天无理由退款保证 • 随时一键取消订阅。',
    },
    connector: {
      modalTitle: '绑定 MT4 / MT5 经纪商实盘账户',
      modalSubtitle: '只读安全同步。我们仅需要您的投资人（只读）密码来同步交易战绩与排行榜数据。',
      selectBroker: '选择经纪商',
      brokerServer: '服务器名称 (Server)',
      loginId: '账户登录号 (Login ID)',
      passwordLabel: '投资人密码 (只读权限)',
      investorPasswordHint: '切勿提供交易主密码。投资人密码保证 100% 只读，无任何资金交易权限。',
      accountNickname: '账户别名',
      connectBtn: '验真并绑定账户',
      connecting: '正在建立加密云端桥接...',
      connectedSuccess: '账户绑定成功！',
      zeroWriteTitle: '零写入安全保障',
      zeroWriteDesc: 'TraderRank 在底层严格作为只读观察者运行。下单与出金等写入操作已被物理级封锁。',
      readOnlyAudited: '经零写入安全审计认证',
      disconnectAccount: '解除绑定并彻底销毁凭证',
      activePositionsCount: '当前持仓笔数',
      accountBalance: '账户余额',
      accountEquity: '动态净值',
    },
    arena: {
      tournamentsTitle: '实盘交易锦标赛竞技场',
      tournamentsSubtitle: '与全球经实盘验真的 MT4/MT5 交易员同台竞技，争夺高额奖金池、专属勋章与权威排位。',
      liveContests: '正在进行的竞技场',
      upcomingContests: '即将开启的比赛',
      prizePool: '奖金池',
      participants: '参赛人数',
      timeLeft: '剩余时间',
      joinArena: '立即加入锦标赛',
      registered: '已报名',
      dailyChampionTitle: '今日点数皇冠霸主',
      dailyChampionPips: '今日净获利点数',
      badgesTitle: '荣誉勋章 & 段位体系',
      communityFeedTitle: '全球实盘交易动态流',
      liveTradeFeed: '实时成交快报',
    },
    footer: {
      poweredBy: 'Powered by',
      companyName: 'Libralytic Co.,Ltd',
      allRightsReserved: 'All Rights Reserved',
      riskDisclaimer: '外汇与差价合约交易具有高风险。平台上所有战绩仅供只读参考与竞技，不构成任何投资建议。',
      privacyPolicy: '隐私政策',
      termsOfService: '服务条款',
      apiDocs: 'API 开发者文档',
      systemStatus: '系统运行状态: 所有服务运行正常',
    },
  },
};
