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
    fastConnect: string;
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
    todayMarketSummary: string;
    separateFromChart: string;
    proUnlocked: string;
    unlockProBtn: string;
    marketRegime: string;
    headline: string;
    macroSentimentIndex: string;
    sentimentGreed: string;
    sentimentFear: string;
    sentimentNeutral: string;
    forexFactoryNews: string;
    customTimeframeEngine: string;
    customTimeframeDesc: string;
    confluenceEngineBadge: string;
    assetFocus: string;
    symbolSelect: string;
    timeframeSelect: string;
    strategicTimeframe: string;
    tradingStyle: string;
    strategyModel: string;
    strategyType: string;
    riskRewardTarget: string;
    rr1_3: string;
    rr1_5: string;
    rr1_7: string;
    sessionWindow: string;
    sessionFocus: string;
    accountSizeLabel: string;
    accountSize: string;
    generateAnalysis: string;
    generateCustomStrategy: string;
    analyzing: string;
    synthesizingConfluence: string;
    tradeQualification: string;
    tradeSetupQualified: string;
    directiveQualified: string;
    directiveDisqualified: string;
    doNotEnterTrade: string;
    rrTargetsLabel: string;
    findOtherPairs: string;
    findAnotherPair: string;
    alternativePairs: string;
    switchScan: string;
    confluenceScore: string;
    recommendedAction: string;
    entryZone: string;
    optimalEntryZone: string;
    stopLoss: string;
    takeProfit1: string;
    takeProfit2: string;
    takeProfit3: string;
    riskRewardLots: string;
    marketStructureContext: string;
    entryTriggerRule: string;
    strictInvalidationScenario: string;
    optimalSessionExecution: string;
    preExecutionChecklist: string;
    unlockGeneratorModalTitle: string;
    unlockGeneratorModalDesc: string;
    unlockBtn: string;
    forexFactoryReleasesTitle: string;
    highImpactReleasesToday: string;
    forecast: string;
    previous: string;
    dailyBreakdownTitle: string;
    dailyBreakdownDesc: string;
    liveAnchor: string;
    volatility: string;
    technicalMarketStructure: string;
    fundamentalDrivers: string;
    institutionalDemandBlock: string;
    institutionalSupplyBlock: string;
    pivotLevels: string;
    smcKeyLevels: string;
    orderBlock: string;
    demandZone: string;
    supplyZone: string;
    institutionalBias: string;
    unlockProPrompt: string;
    pricePerMonth: string;
    refreshReport: string;
    macroRegimeTitle: string;
    highImpactNews: string;
    riskTolerance: string;
    optimalSession: string;
    calculatedLotSize: string;
    confluenceFactors: string;
    invalidationPrice: string;
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
    aiAnalysisBtn: string;
    lastPrice: string;
    change24h: string;
    high24h: string;
    low24h: string;
    quickIndicators: string;
    createCustomIndicator: string;
    pineScriptStudio: string;
    smcSectionTitle: string;
    demandSupplyLabel: string;
    demandSupplyDesc: string;
    bosLabel: string;
    bosDesc: string;
    myCustomIndicators: string;
    oscillatorSubPanel: string;
    hideSub: string;
    smcQuickBtn: string;
    pineScriptQuickBtn: string;
    aiMultiTfQuickBtn: string;
    forexFactoryQuickBtn: string;
    allTickLiveBadge: string;
    refreshCandles: string;
    aiLevelsActive: string;
    aiKeyLevels: string;
    newsCalendar: string;
    loadingKLine: string;
    closeSubPanel: string;
    liveStreamActive: string;
    tokenTrial: string;
    overlayIndicators: string;
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
    mostPopular: string;
    save27: string;
    monthlyDesc: string;
    annualDesc: string;
    paymentMethodsTitle: string;
    selectPaymentGateway: string;
    creditCard: string;
    appleGooglePay: string;
    cryptoUsdt: string;
    cardNumber: string;
    cardExpiry: string;
    cardCvc: string;
    cardholderName: string;
    country: string;
    applePayDesc: string;
    payWithAppleGpay: string;
    oneClickCheckout: string;
    cryptoNetwork: string;
    sendExactly: string;
    rateExpiresIn: string;
    depositAddress: string;
    copyAddress: string;
    copied: string;
    timerRemaining: string;
    subtotal: string;
    estimatedTax: string;
    totalDueToday: string;
    sslEncrypted: string;
    instantActivationBadge: string;
    moneyBackGuarantee: string;
    confirmAndUnlock: string;
    processingPayment: string;
    congratsTitle: string;
    congratsSubtitle: string;
    paymentConfirmedBadge: string;
    licenseId: string;
    subscriptionPlan: string;
    memberLicenseId: string;
    nextAutoRenewal: string;
    downloadReceipt: string;
    receiptSaved: string;
    downloadInvoice: string;
    launchIntelBtn: string;
    openDailyIntelBtn: string;
    membershipActiveBadge: string;
    membershipActiveDesc: string;
    billingRate: string;
    activationDate: string;
    renewalExpiryDate: string;
    unlockedFeaturesTitle: string;
    resetToFreeMode: string;
    guaranteeText: string;
    instantActivation: string;
  };

  // Account Connection & Security
  connector: {
    modalTitle: string;
    modalSubtitle: string;
    selectBroker: string;
    selectBrokerDesc: string;
    routeTitle: string;
    routeDesc: string;
    exnessNativeTitle: string;
    exnessNativeDesc: string;
    mtGatewayTitle: string;
    mtGatewayDesc: string;
    brokerAgnosticTitle: string;
    brokerAgnosticDesc: string;
    credentialsTitle: string;
    securityCalloutTitle: string;
    securityCalloutDesc: string;
    platform: string;
    brokerServer: string;
    brokerServerName: string;
    popularServers: string;
    findIcServer: string;
    loginId: string;
    accountLoginNumber: string;
    passwordLabel: string;
    investorPassword: string;
    investorPasswordHint: string;
    neverMasterPassword: string;
    exnessAccountId: string;
    exnessApiKey: string;
    exnessApiSecret: string;
    exnessApiHint: string;
    accountNickname: string;
    diagnosticsTitle: string;
    diagnosticsDesc: string;
    pingingBroker: string;
    preflightPassedTitle: string;
    connectionFailedTitle: string;
    brokerLabel: string;
    integrationLabel: string;
    accountLabel: string;
    balanceLabel: string;
    equityLabel: string;
    leverageLabel: string;
    editCredentials: string;
    confirmIngestTrades: string;
    persistingToVault: string;
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
    runPreflight: string;
    preflightChecking: string;
    preflightPassed: string;
    stepBroker: string;
    stepCredentials: string;
    stepVerification: string;
    stepComplete: string;
    nextStep: string;
    backStep: string;
  };

  // Daily Best Trader Card
  dailyBest: {
    spotlight: string;
    window: string;
    traderOfTheDay: string;
    subtitle: string;
    rollover: string;
    hideHallOfFame: string;
    dailyChampions: string;
    dailyCrown: string;
    platformsTraded: string;
    winRate: string;
    trades: string;
    todayNetGain: string;
    pips: string;
    closed: string;
    float: string;
    noTrades: string;
    totalPipsGenerated: string;
    activeCompeting: string;
    hallOfFameTitle: string;
  };

  // Tournaments & Arena
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
    weeklySprint: string;
    weeklySprintTag: string;
    weeklySprintDesc: string;
    sprintDays: string;
    monthlyChampionship: string;
    monthlyChampionshipTag: string;
    monthlyChampionshipDesc: string;
    monthlyDuration: string;
    globalGoldRushTitle: string;
    globalGoldRushSubtitle: string;
    tokyoLondonOverlapTitle: string;
    tokyoLondonOverlapSubtitle: string;
    maxDailyLoss: string;
    maxTrailingDD: string;
    minTradesReq: string;
    freeEntry: string;
    liveBattleBadge: string;
    antiGamblingRules: string;
    maxDailyLossDesc: string;
    maxTrailingDDDesc: string;
    minTradesDesc: string;
    scoringSystem: string;
    scoringFormula: string;
    scoringSystemDesc: string;
    tradesToQualify: string;
    peakDD: string;
    equityLoss: string;
    standingsTitle: string;
    disqualifiedBadge: string;
    enteredTracking: string;
    enterTournament: string;
    battleEndsIn: string;
    estimatedPrize: string;
    netPips: string;
  };

  // Rewards & Badges Hub
  rewards: {
    title: string;
    subtitle: string;
    currentTier: string;
    levelTrader: string;
    currentXp: string;
    progressTo: string;
    xpRemaining: string;
    dailyStreakTitle: string;
    streakActive: string;
    claimBtn: string;
    claimed: string;
    active: string;
    locked: string;
    verified: string;
    seasonal: string;
    mysteryBadge: string;
    dayLabel: string;
    honorBadgesTitle: string;
    honorBadgesSubtitle: string;
    unlockedCount: string;
    rarityCommon: string;
    rarityRare: string;
    rarityEpic: string;
    rarityLegendary: string;
    badgeModalTitle: string;
    howToUnlock: string;
    rewardBonus: string;
    closeBtn: string;
    toastClaimed: string;
    exploreRewardsBtn: string;
    badgeRiskGuardianName: string;
    badgeRiskGuardianDesc: string;
    badgeRiskGuardianCriteria: string;
    badgePrecisionSniperName: string;
    badgePrecisionSniperDesc: string;
    badgePrecisionSniperCriteria: string;
    badgeCenturyClubName: string;
    badgeCenturyClubDesc: string;
    badgeCenturyClubCriteria: string;
    badgePodiumMasterName: string;
    badgePodiumMasterDesc: string;
    badgePodiumMasterCriteria: string;
    badgeHallOfFameName: string;
    badgeHallOfFameDesc: string;
    badgeHallOfFameCriteria: string;
    badgeIronDisciplineName: string;
    badgeIronDisciplineDesc: string;
    badgeIronDisciplineCriteria: string;
    tierNovice: string;
    tierProSwing: string;
    tierMarketVeteran: string;
    tierApexPredator: string;
    tierHallOfFame: string;
    prestigeBadge: string;
    yesterday: string;
    daysAgo: string;
    lastWeek: string;
    clickToInspect: string;
  };

  // Leaderboard & Rankings
  leaderboard: {
    title: string;
    subtitle: string;
    allTimeTab: string;
    todayTab: string;
    weekTab: string;
    dailySprint: string;
    weeklyLeague: string;
    allTimeLegends: string;
    filterAll: string;
    filterProp: string;
    filterEcn: string;
    rankingMetric: string;
    winningPips: string;
    profitAmount: string;
    profitRate: string;
    searchPlaceholder: string;
    allBrokers: string;
    rankCol: string;
    traderCol: string;
    brokerCol: string;
    netPipsCol: string;
    winRateCol: string;
    tradesCol: string;
    drawdownCol: string;
    actionCol: string;
    viewAnalytics: string;
    liveVerified: string;
    following: string;
    follow: string;
    dailyChampion: string;
    totalDailyPips: string;
    activeTradersToday: string;
    goldChampion: string;
    silverContender: string;
    bronzeMaster: string;
    trades: string;
    estProfit: string;
    winRate: string;
    xp: string;
    netPips: string;
    profit: string;
    rate: string;
  };

  // Community Feed
  community: {
    title: string;
    subtitle: string;
    challengeTitle: string;
    challengeDesc: string;
    coopChallengeTitle: string;
    collectiveHarvest: string;
    completed: string;
    endsInDays: string;
    liveBulletinTitle: string;
    liveBulletinDesc: string;
    postPlaceholder: string;
    postBtn: string;
    allFeed: string;
    liveTradesOnly: string;
    filterAll: string;
    filterWins: string;
    filterBadges: string;
    filterTournaments: string;
    closedTradeText: string;
    withPips: string;
    unlockedBadgeText: string;
    climbedRankText: string;
    enlistedTournamentText: string;
    cheerBtn: string;
    cheersBullish: string;
    cheersRocket: string;
    cheersKing: string;
    cheersShield: string;
    justNow: string;
    verifiedExecution: string;
  };

  // Accounts List
  accounts: {
    title: string;
    connectedAccounts: string;
    activeAccounts: string;
    addAccount: string;
    noAccounts: string;
    noAccountsDesc: string;
    activeFeed: string;
    accountLabel: string;
    serverLabel: string;
    leverageLabel: string;
    equityBalance: string;
    vaultSecretRef: string;
    disconnectTitle: string;
    balance: string;
    equity: string;
    openPnl: string;
    viewOnly: string;
    syncing: string;
    disconnectConfirm: string;
  };

  // Active Positions
  positions: {
    title: string;
    liveIngestionFeed: string;
    subSecondStream: string;
    netFloatingPnl: string;
    noPositionsTitle: string;
    openTradesCount: string;
    ticketCol: string;
    instrumentCol: string;
    sideCol: string;
    volumeCol: string;
    openPriceCol: string;
    livePriceCol: string;
    normalizedPipsCol: string;
    profitUsdCol: string;
    symbol: string;
    type: string;
    lots: string;
    openPrice: string;
    currentPrice: string;
    pips: string;
    pnl: string;
    noPositions: string;
    noPositionsDesc: string;
    readOnlyStream: string;
  };

  // Security Vault
  vault: {
    title: string;
    subtitle: string;
    vaultTitle: string;
    aesBadge: string;
    collapseLogs: string;
    viewLiveTrail: string;
    vaultDesc: string;
    noLogsYet: string;
    blockedStatus: string;
    okStatus: string;
    architectureTitle: string;
    immutableNotice: string;
    physicalBlockTitle: string;
    physicalBlockDesc: string;
    aesEncryptionTitle: string;
    aesEncryptionDesc: string;
    auditedStatus: string;
    downloadAuditReport: string;
  };

  // Trader Profile
  profile: {
    title: string;
    overview: string;
    globalRankingBadge: string;
    followingBtn: string;
    followBtn: string;
    recentVerifiedExecutions: string;
    verifiedSinceLabel: string;
    levelLabel: string;
    netWinningPips: string;
    winRate: string;
    profitFactor: string;
    maxDrawdown: string;
    totalTrades: string;
    bestTrade: string;
    avgHoldingTime: string;
    verifiedSince: string;
    followTrader: string;
    following: string;
    copyDisabledNotice: string;
  };

  // AI Chart Modal
  aiModal: {
    title: string;
    subtitle: string;
    multiTfTitle: string;
    multiTfSubtitle: string;
    reScanAi: string;
    scanningAsset: string;
    primaryAiBias: string;
    confluenceScoreLabel: string;
    highProbAgreement: string;
    riskRewardRatioLabel: string;
    swingTargetTp2: string;
    plotOnChartBtn: string;
    plottedOnChartBtn: string;
    multiTfStructureBreakdown: string;
    tacticalBlueprintTitle: string;
    keyLevelsMatrixTitle: string;
    institutionalCommentaryTitle: string;
    riskFactorsTitle: string;
    analyzingChart: string;
    confidenceScore: string;
    marketStructure: string;
    trendConfluence: string;
    keyLevels: string;
    tradeSetup: string;
    entry: string;
    sl: string;
    tp: string;
    disclaimer: string;
  };

  // ForexFactory Economic Calendar Modal
  forexCalendar: {
    title: string;
    subtitle: string;
    filterCurrency: string;
    filterImpact: string;
    hidePassed: string;
    highImpactOnly: string;
    redFolders: string;
    refreshCalendar: string;
    timeUntil: string;
    actual: string;
    forecast: string;
    previous: string;
    noEvents: string;
    impactHigh: string;
    impactMed: string;
    impactLow: string;
    impactHoliday: string;
    modalTitle: string;
    liveRedFolderFeed: string;
    subtitleDetailed: string;
    nextHighImpact: string;
    allEvents: string;
    highImpact: string;
    mediumImpact: string;
    lowImpact: string;
    hidePast: string;
    currency: string;
    impact: string;
    ingesting: string;
    noEventsMatching: string;
    eventsCount: string;
    timeCol: string;
    curCol: string;
    impactCol: string;
    eventCol: string;
    actualCol: string;
    forecastCol: string;
    previousCol: string;
    feedActive: string;
    dataSource: string;
    time: string;
  };

  // Live Trade Bulletin & Prices
  bulletin: {
    badgeTitle: string;
    badgeSubtitle: string;
    liveExecution: string;
    takeProfit: string;
    pipsSurge: string;
    newTop10: string;
    verifiedBridge: string;
    scalpWin: string;
    goldRush: string;
    londonBreakout: string;
    swingPullback: string;
    verifiedDeal: string;
    weeklyHigh: string;
    tournamentLead: string;
    m15Pullback: string;
    justNow: string;
    pips: string;
  };

  marketTicker: {
    badgeTitle: string;
    badgeSubtitle: string;
    realApiLive: string;
    liveEngine: string;
    topTradingPairs: string;
    spread: string;
    bid: string;
    ask: string;
    tagMostTraded: string;
    tagAlltick: string;
    tagHighMomentum: string;
    tagTopVolatility: string;
    tagOanda: string;
    tagCrypto: string;
    tagAsiaPac: string;
    tagCommodityFx: string;
    tagUsSession: string;
  };

  // Custom Indicators Studio
  customStudio: {
    modalTitle: string;
    sandboxBadge: string;
    modalSubtitle: string;
    tabTemplates: string;
    tabEditor: string;
    tabLibrary: string;
    tabDocs: string;
    newIndicatorBtn: string;
    chooseTemplateTitle: string;
    chooseTemplateDesc: string;
    useTemplate: string;
    activeOnChart: string;
    indicatorName: string;
    shortLabel: string;
    description: string;
    chartPane: string;
    mainOverlay: string;
    subPanel: string;
    visualStyle: string;
    plotLine: string;
    plotHistogram: string;
    plotDots: string;
    colorTheme: string;
    lineWidth: string;
    parametersTitle: string;
    addParam: string;
    sourceCodeTitle: string;
    testRunBtn: string;
    saveApplyBtn: string;
    testPassed: string;
    testFailed: string;
    dataPoints: string;
    range: string;
    deleteConfirm: string;
  };

  // App Level Strings
  app: {
    heroSubheading: string;
    syncing: string;
    sslVault: string;
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
      connectAccount: 'Connect Broker',
      proLeague: 'PRO LEAGUE',
      proSubscriber: 'PRO ACTIVE',
      unlockPro: 'Unlock Pro ($9/mo)',
      proPlanActive: 'PRO ALL-ACCESS',
      viewOnlyBadge: 'IMMUTABLE VIEW-ONLY',
      wsConnected: 'LIVE WS CONNECTED',
      wsConnecting: 'CONNECTING WS...',
      refreshRates: 'Refresh Live Rates',
      switchView: 'Switch View',
      fastConnect: 'Fast Connect',
    },
    landing: {
      badge: 'VERIFIED MULTI-BROKER ARENA',
      heroTitlePrefix: 'The Global Arena for ',
      heroTitleAccent: 'Verified Forex Masters',
      heroTitleSuffix: '',
      heroSubtitle: 'Connect XM, Exness, Axiory, Vantage and IC Markets via 100% read-only investor passwords. Compete on raw pips, win cash tournaments, and unlock daily strategic intelligence.',
      enterArenaBtn: 'Enter Pro Arena',
      connectBrokerBtn: 'Connect Broker Account',
      exploreChartsBtn: 'Live SMC Charts',
      verifiedPnlBadge: 'Zero-Write Verified Execution',
      zeroWriteGuarantee: '100% Read-Only • No Fund Access Guarantee',
      liveBrokersCount: 'Verified Brokers',
      activeTradersCount: 'Global Contenders',
      volume24h: 'Normalized Daily Volume',
      topPerformersTitle: 'Verified Global Leaderboard',
      topPerformersSubtitle: 'Real-time rankings normalized across raw pip yield, win rate stability, and drawdown control.',
      tabPips: 'Net Pips Harvested',
      tabProfit: 'Net Realized Profit',
      tabWinRate: 'Win Rate Consistency',
      rankCol: 'Rank',
      traderCol: 'Trader & Tier',
      brokerCol: 'Broker Feed',
      gainCol: 'Pips Gain',
      winRateCol: 'Win Rate',
      actionCol: 'Action',
      viewProfile: 'View Verified Stats',
      feature1Title: 'Zero-Write Immutable Security',
      feature1Desc: 'TraderRank operates strictly with investor read-only passwords. Trade placement and withdrawal verbs are physically blocked at the engine core.',
      feature2Title: 'Multi-Broker Normalization',
      feature2Desc: 'Algorithmic conversion standardizes 5-decimal quotes, raw spread differentials, and instrument naming across all major brokers.',
      feature3Title: 'Institutional Daily Intelligence ($9/mo)',
      feature3Desc: 'Gain high-probability 1:3, 1:5, and 1:7 R:R trade setups, ForexFactory news breakdowns, and institutional SMC order block matrices daily.',
      feature4Title: 'Competitive Esports Tournaments',
      feature4Desc: 'Join 5-day sprints and 30-day prop tournaments with guaranteed cash prize pools, XP levels, and prestigious honor badges.',
      ctaHeading: 'Ready to Prove Your Edge on the Global Stage?',
      ctaSubtitle: 'Connect your MT4/MT5 investor password in under 60 seconds. Zero risk to funds.',
      ctaButton: 'Launch Live Arena Now →',
    },
    intel: {
      title: 'Daily Trading Intelligence Hub',
      subtitle: 'Macro fundamental trends, ForexFactory news releases, institutional SMC order blocks, and custom strategic timeframe trade setups.',
      todayMarketSummary: "Today's Market Summary",
      separateFromChart: 'Separate from Live Chart',
      proUnlocked: 'PRO UNLOCKED ($9/mo)',
      unlockProBtn: 'Unlock Pro for $9/Month',
      marketRegime: "Today's Market Regime",
      headline: 'Macro Regime Outlook',
      macroSentimentIndex: 'Macro Sentiment Index',
      sentimentGreed: 'Extreme Greed (Risk-On Flow)',
      sentimentFear: 'Extreme Fear (Flight to Safety)',
      sentimentNeutral: 'Equilibrium (Rangebound Consolidation)',
      forexFactoryNews: 'High-Impact ForexFactory Releases',
      customTimeframeEngine: 'Custom Strategic Timeframe Generator',
      customTimeframeDesc: 'Input your preferred trading timeframe (1m - 1W) & strategy model to generate a custom tactical execution card.',
      confluenceEngineBadge: 'AI Multi-Timeframe Confluence Engine',
      assetFocus: 'Asset Focus',
      symbolSelect: 'Select Asset',
      timeframeSelect: 'Strategic Timeframe',
      strategicTimeframe: 'Strategic Timeframe',
      tradingStyle: 'Trading Style',
      strategyModel: 'Strategy Model',
      strategyType: 'Trading Strategy Model',
      riskRewardTarget: 'Risk / Reward Target',
      rr1_3: '1:3 R:R (Standard Scalp & Intraday)',
      rr1_5: '1:5 R:R (High Probability SMC Expansion)',
      rr1_7: '1:7 R:R (Maximum Asymmetric Runner)',
      sessionWindow: 'Session Window',
      sessionFocus: 'Session Focus',
      accountSizeLabel: 'Account Equity ($)',
      accountSize: 'Account Size for 1% Risk:',
      generateAnalysis: 'Generate Custom Strategy Plan',
      generateCustomStrategy: 'Generate Custom Daily Strategy',
      analyzing: 'Synthesizing Order Flow & SMC Liquidity...',
      synthesizingConfluence: 'Synthesizing Confluence...',
      tradeQualification: 'Trade Qualification Directive',
      tradeSetupQualified: 'TRADE SETUP QUALIFIED • TARGET {targetRR} R:R VALIDATED',
      directiveQualified: 'QUALIFIED FOR EXECUTION — High Probability Setup',
      directiveDisqualified: 'STRICT DIRECTIVE: DO NOT ENTER TRADE',
      doNotEnterTrade: '[HOLD] DO NOT ENTER TRADE • INSUFFICIENT {targetRR} R:R',
      rrTargetsLabel: 'R:R Targets: 1:3 • 1:5 • 1:7',
      findOtherPairs: 'Find other pairs with higher risk:reward resonance',
      findAnotherPair: 'Find Another Pair For Trading (Recommended High-Confluence Scans):',
      alternativePairs: 'Recommended Alternative Pairs with Higher R:R Potential:',
      switchScan: 'Switch & Scan',
      confluenceScore: 'Confluence Score:',
      recommendedAction: 'Recommended Strategic Action',
      entryZone: 'Optimal Entry Zone',
      optimalEntryZone: 'Optimal Entry Zone',
      stopLoss: 'Stop Loss (Invalidation)',
      takeProfit1: 'Take Profit 1 (1:3 R:R)',
      takeProfit2: 'Take Profit 2 (1:5 R:R)',
      takeProfit3: 'Take Profit 3 (1:7 Runner)',
      riskRewardLots: 'Risk : Reward & Lots',
      marketStructureContext: 'Market Structure Context',
      entryTriggerRule: 'Entry Trigger Rule',
      strictInvalidationScenario: 'Strict Invalidation Scenario',
      optimalSessionExecution: 'Optimal Session Execution Window',
      preExecutionChecklist: 'Pre-Execution Trader Checklist:',
      unlockGeneratorModalTitle: 'Unlock Custom Strategic Timeframe Generator',
      unlockGeneratorModalDesc: 'Subscribe to TraderRank Pro ($9 / month) to generate bespoke high-probability setups with exact Entry, Invalidation Stop Loss, and Take Profit targets across all timeframes (1m, 5m, 15m, 1H, 4H, 1D, 1W).',
      unlockBtn: 'Unlock for $9 / Month',
      forexFactoryReleasesTitle: "Today's ForexFactory Macro Releases & News Digest",
      highImpactReleasesToday: '{count} High-Impact Releases Today',
      forecast: 'Forecast:',
      previous: 'Previous:',
      dailyBreakdownTitle: 'Daily Technical & Fundamental Asset Breakdown',
      dailyBreakdownDesc: 'Select an asset to inspect institutional Order Blocks, Pivot levels, and macro catalysts.',
      liveAnchor: 'Live Anchor:',
      volatility: 'Volatility:',
      technicalMarketStructure: 'Technical Market Structure',
      fundamentalDrivers: 'Fundamental Drivers',
      institutionalDemandBlock: 'Institutional Demand Block (SMC Zone)',
      institutionalSupplyBlock: 'Institutional Supply Block (Resistance Zone)',
      pivotLevels: 'Pivot Levels (S1 / Pivot / R1)',
      smcKeyLevels: 'SMC Key Levels & Order Blocks',
      orderBlock: 'Institutional Order Block (OB)',
      demandZone: 'Key Demand Zone',
      supplyZone: 'Key Supply Zone',
      institutionalBias: 'Institutional Bias',
      unlockProPrompt: 'Unlock full daily intelligence reports & custom timeframe analysis for only $9/month.',
      pricePerMonth: '$9 / Month',
      refreshReport: 'Refresh Daily Intel',
      macroRegimeTitle: 'Macro Market Regime',
      highImpactNews: 'High-Impact Economic Calendar',
      riskTolerance: 'Risk Tolerance',
      optimalSession: 'Optimal Execution Window',
      calculatedLotSize: 'Calculated 1% Risk Size',
      confluenceFactors: 'Confluence Factors',
      invalidationPrice: 'Structural Invalidation',
    },
    chart: {
      liveFeed: 'Live Market Feed (AllTick / OANDA)',
      candlestickStream: 'High-Frequency Tick Data Stream',
      selectPair: 'Select Pair',
      timeframe: 'Timeframe',
      indicators: 'Indicators',
      customIndicators: 'Custom Indicator Studio',
      smcOverlay: 'SMC Smart Money Concepts Layer',
      bosDetected: 'BOS (Break of Structure)',
      chocDetected: 'CHoCH (Change of Character)',
      fairValueGap: 'FVG (Fair Value Gap)',
      highPrecision: '5-Decimal High Precision FX Feed',
      bid: 'BID',
      ask: 'ASK',
      spread: 'Spread',
      volume: 'Volume',
      realtimeTick: 'Real-Time Tick',
      aiAnalysisBtn: 'AI Smart Analysis',
      lastPrice: 'Last Price',
      change24h: '24h Change',
      high24h: '24h High',
      low24h: '24h Low',
      quickIndicators: 'Quick Indicators:',
      createCustomIndicator: '+ Create Custom Indicator',
      pineScriptStudio: 'TradingView Pine Script Studio',
      smcSectionTitle: 'Smart Money Concepts (SMC)',
      demandSupplyLabel: 'Demand & Supply Zones',
      demandSupplyDesc: 'Institutional unmitigated Order Blocks',
      bosLabel: 'Break of Structure (BOS / CHoCH)',
      bosDesc: 'Swing fractals & structural breaks',
      myCustomIndicators: 'My Custom Indicators',
      oscillatorSubPanel: 'Oscillator Sub-Panel',
      hideSub: 'Hide Sub',
      smcQuickBtn: 'SMC (BOS • Demand)',
      pineScriptQuickBtn: '+ Pine Script',
      aiMultiTfQuickBtn: 'AI Multi-TF (15m • 4h • 1D • 1W)',
      forexFactoryQuickBtn: 'ForexFactory',
      allTickLiveBadge: 'AllTick Stream Active (7-Day Token)',
      refreshCandles: 'Refresh Candlesticks',
      aiLevelsActive: 'AI Levels (Active)',
      aiKeyLevels: 'AI Key Levels',
      newsCalendar: 'News Calendar',
      loadingKLine: 'Loading AllTick K-Line Stream...',
      closeSubPanel: 'Close Sub-Panel',
      liveStreamActive: 'MetaApi Broker Stream: Live Forex & Gold Feed Active',
      tokenTrial: 'MetaApi Cloud Broker Ledger (Live)',
      overlayIndicators: 'Overlay Indicators (Main Chart)',
    },
    subscription: {
      modalTitle: 'TraderRank Pro — Daily Intelligence All-Access',
      modalSubtitle: 'Get daily institutional setups, 1:3 / 1:5 / 1:7 R:R qualifications, SMC zones, and custom AI timeframe analysis.',
      monthlyTier: 'Pro Monthly',
      monthlyPrice: '$9.00',
      annualTier: 'Pro Annual',
      annualPrice: '$79.00',
      annualSavings: 'SAVE 27%',
      perMonth: '/ month',
      billedAnnually: '$79 billed annually ($6.58/mo)',
      billedMonthly: '$9 billed monthly (cancel anytime)',
      selectPlan: 'Select Membership Tier',
      currentPlan: 'Current Plan',
      mostPopular: 'MOST POPULAR',
      save27: 'SAVE 27%',
      monthlyDesc: 'Full daily market intelligence & custom strategy generator. Cancel anytime.',
      annualDesc: 'All Pro features + Priority Alpha Discord group & Historical Archives.',
      paymentMethodsTitle: 'Select Payment Method',
      selectPaymentGateway: 'Select Payment Gateway:',
      creditCard: 'Card / Debit',
      appleGooglePay: 'Apple / GPay',
      cryptoUsdt: 'Crypto (USDT)',
      cardNumber: 'Card Number',
      cardExpiry: 'Expiry (MM/YY)',
      cardCvc: 'CVC / CVV',
      cardholderName: 'Cardholder Name',
      country: 'Country',
      applePayDesc: 'Pay securely with your Apple Wallet or Google Pay linked account.',
      payWithAppleGpay: 'Pay {amount} with Pay / GPay',
      oneClickCheckout: '1-Click Fast Checkout',
      cryptoNetwork: 'Select Transfer Network',
      sendExactly: 'Send exactly:',
      rateExpiresIn: 'Rate expires in',
      depositAddress: 'Deposit Address',
      copyAddress: 'Copy',
      copied: 'Copied',
      timerRemaining: 'Rate Guarantee Timer',
      subtotal: 'Subtotal',
      estimatedTax: 'Estimated Tax / VAT (0%)',
      totalDueToday: 'Total Due Today',
      sslEncrypted: '256-Bit SSL Encrypted',
      instantActivationBadge: 'Instant Pro Activation',
      moneyBackGuarantee: '14-Day Money-Back Guarantee',
      confirmAndUnlock: 'Complete Payment & Unlock Pro',
      processingPayment: 'Processing Payment...',
      congratsTitle: 'Welcome to TraderRank Pro',
      congratsSubtitle: 'Your Pro Daily Trading Intelligence and bespoke Multi-Timeframe Strategy Generator have been successfully unlocked and verified.',
      paymentConfirmedBadge: 'PAYMENT CONFIRMED • PRO ACTIVATED',
      licenseId: 'License Key ID',
      subscriptionPlan: 'Subscription Plan:',
      memberLicenseId: 'Member License ID:',
      nextAutoRenewal: 'Next Auto-Renewal:',
      downloadReceipt: 'Download Invoice Receipt',
      receiptSaved: 'Receipt Saved!',
      downloadInvoice: 'Download Invoice',
      launchIntelBtn: 'Launch Daily Trading Intelligence',
      openDailyIntelBtn: 'Open Daily Intelligence Hub',
      membershipActiveBadge: 'PRO MEMBERSHIP ACTIVE',
      membershipActiveDesc: 'You have full institutional access to Daily Trading Intelligence, Macro Reports, and Custom Strategy Generation.',
      billingRate: 'Billing Rate',
      activationDate: 'Activation Date',
      renewalExpiryDate: 'Renewal / Expiry Date',
      unlockedFeaturesTitle: 'Your Active Unlocked Features:',
      resetToFreeMode: 'Reset to Free Preview Mode',
      guaranteeText: 'Instant Activation • 14-Day Money-Back Guarantee • Cancel anytime with one click.',
      instantActivation: 'Instant 256-Bit SSL Activation',
    },
    connector: {
      modalTitle: 'Select Trading Broker',
      modalSubtitle: 'Choose the broker hosting your trading account to route to the optimal connector.',
      selectBroker: 'Select Broker',
      selectBrokerDesc: 'Choose the broker hosting your trading account to route to the optimal connector.',
      routeTitle: 'Integration Path for {broker}',
      routeDesc: 'Per TraderRank PRD §5.3 routing logic, select the connector architecture.',
      exnessNativeTitle: 'Exness Native API (Recommended)',
      exnessNativeDesc: 'Direct official REST & WebSocket feed. Zero gateway latency, zero third-party subscription fees.',
      mtGatewayTitle: 'MT4/MT5 Gateway (Fallback)',
      mtGatewayDesc: 'Standard connector for Exness MT4/MT5 accounts without an issued API key.',
      brokerAgnosticTitle: 'Broker-Agnostic MT4/MT5 Gateway',
      brokerAgnosticDesc: 'Standard connector covering {broker} through cloud investor-password bridge.',
      credentialsTitle: 'Enter Read-Only Credentials',
      securityCalloutTitle: 'Zero Trade-Placement Risk:',
      securityCalloutDesc: 'TraderRank only requires read-only access. Investor passwords cannot open or close trades. Credentials are encrypted via AES-256-GCM in the isolated Secrets Vault.',
      platform: 'Platform',
      brokerServer: 'Server Name',
      brokerServerName: 'Broker Server Name',
      popularServers: 'Popular IC Markets / IC Trading Servers:',
      findIcServer: 'Find your IC Markets server / Create Raw Spread Account (ic.com) →',
      loginId: 'Account Login ID',
      accountLoginNumber: 'Account Login / Number',
      passwordLabel: 'Investor Password (Read-Only)',
      investorPassword: 'Investor (Read-Only) Password',
      investorPasswordHint: 'NEVER enter your master trading password. Read-only investor password only.',
      neverMasterPassword: 'Never enter your master trading password. Read-only investor password only.',
      exnessAccountId: 'Exness Account ID (Optional)',
      exnessApiKey: 'Exness API Key',
      exnessApiSecret: 'Exness Secret Key',
      exnessApiHint: 'Generated from Exness Settings > API Access after KYC Tier-2.',
      accountNickname: 'Account Nickname',
      diagnosticsTitle: 'Connection Diagnostics',
      diagnosticsDesc: 'Running synchronous test read call per PRD §6 step 4 before persisting to database.',
      pingingBroker: 'Pinging broker server & testing read permissions...',
      preflightPassedTitle: 'Pre-Flight Connection Passed',
      connectionFailedTitle: 'Connection Failed',
      brokerLabel: 'Broker:',
      integrationLabel: 'Integration:',
      accountLabel: 'Account:',
      balanceLabel: 'Balance:',
      equityLabel: 'Equity:',
      leverageLabel: 'Leverage:',
      editCredentials: 'Edit Credentials',
      confirmIngestTrades: 'Confirm & Ingest Trades',
      persistingToVault: 'Persisting to Vault...',
      connectBtn: 'Verify & Connect',
      connecting: 'Establishing Secure Cloud Bridge...',
      connectedSuccess: 'Account Connected Successfully!',
      zeroWriteTitle: 'Zero-Write Security Guarantee',
      zeroWriteDesc: 'TraderRank operates strictly as a read-only observer. Order execution, modification, and withdrawal verbs are physically blocked at the engine level.',
      readOnlyAudited: 'Zero-Write Security Audited & Verified',
      disconnectAccount: 'Disconnect Account & Purge Credentials',
      activePositionsCount: 'Active Positions Count',
      accountBalance: 'Account Balance',
      accountEquity: 'Dynamic Equity',
      runPreflight: 'Run Preflight Safety Check',
      preflightChecking: 'Validating Read-Only Permissions...',
      preflightPassed: 'Preflight Passed — Read-Only Verified',
      stepBroker: '1. Select Broker',
      stepCredentials: '2. Enter Credentials',
      stepVerification: '3. Preflight Check',
      stepComplete: '4. Connected',
      nextStep: 'Next: Credentials →',
      backStep: 'Back',
    },
    dailyBest: {
      spotlight: 'Daily Winning Pips Spotlight',
      window: '24h Cross-Platform Window',
      traderOfTheDay: 'Trader of the Day',
      subtitle: 'Highest net pip performance across XM, Axiory, Exness, and Vantage today',
      rollover: 'Rollover:',
      hideHallOfFame: 'Hide Hall of Fame',
      dailyChampions: 'Daily Champions',
      dailyCrown: 'DAILY CROWN',
      platformsTraded: 'Platforms Traded:',
      winRate: 'Win Rate:',
      trades: 'trades',
      todayNetGain: "Today's Net Gain",
      pips: 'pips',
      closed: 'Closed:',
      float: 'Float:',
      noTrades: "No winning pips recorded yet for today's session.",
      totalPipsGenerated: 'Total Pips Generated Today:',
      activeCompeting: 'Active Competing Traders:',
      hallOfFameTitle: 'Hall of Fame — Previous Daily Best Traders',
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
      weeklySprint: 'Weekly FX Blitz League',
      weeklySprintTag: 'WEEKLY SPRINT',
      weeklySprintDesc: 'Fast 5-day sprint for EUR, GBP, and Gold traders. Top 3 claim USD prizes and tier boosts.',
      sprintDays: 'Monday – Friday',
      monthlyChampionship: 'Apex Prop Championship',
      monthlyChampionshipTag: 'MONTHLY CHAMPIONSHIP',
      monthlyChampionshipDesc: 'The flagship endurance competition. Multi-factor scoring combines net pips with Sharpe ratio stability.',
      monthlyDuration: '30-Day Gauntlet',
      globalGoldRushTitle: 'Global Gold Rush Masters',
      globalGoldRushSubtitle: 'Precision XAUUSD & Precious Metals Gauntlet',
      tokyoLondonOverlapTitle: 'Tokyo-London Overlap Rush',
      tokyoLondonOverlapSubtitle: 'Fast-paced 8-hour session battle on GBP & EUR pairs',
      maxDailyLoss: 'Max Daily Loss',
      maxTrailingDD: 'Max Trailing Drawdown',
      minTradesReq: 'Minimum Trades to Qualify',
      freeEntry: 'Free Entry',
      liveBattleBadge: 'LIVE BATTLE',
      antiGamblingRules: 'Anti-Gambling Institutional Rules Banner',
      maxDailyLossDesc: 'Equity Loss',
      maxTrailingDDDesc: 'Peak DD',
      minTradesDesc: 'Trades to Qualify',
      scoringSystem: 'Scoring System',
      scoringFormula: 'Normalized Pips × WinRate',
      scoringSystemDesc: 'Normalized Pips × WinRate',
      tradesToQualify: 'Trades to Qualify',
      peakDD: 'Peak DD',
      equityLoss: 'Equity Loss',
      standingsTitle: 'Battle Standings & Prize Positions',
      disqualifiedBadge: 'DISQUALIFIED',
      enteredTracking: 'ENTERED (TRACKING)',
      enterTournament: 'ENTER TOURNAMENT',
      battleEndsIn: 'Battle Ends In:',
      estimatedPrize: 'Est. Prize',
      netPips: 'Net Pips',
    },
    rewards: {
      title: 'Trader Prestige, XP & Honor Badges',
      subtitle: 'Earn verified badges through strict risk management, high win rates, and tournament podium finishes.',
      currentTier: 'Market Veteran',
      levelTrader: 'LEVEL 3 TRADER',
      currentXp: 'Current Experience',
      progressTo: 'Progress to Level 4: Apex Predator',
      xpRemaining: 'XP remaining to Level Up',
      dailyStreakTitle: 'Daily Trading Streak Rewards',
      streakActive: '4-Day Active Streak',
      claimBtn: 'Claim +200 XP',
      claimed: 'Claimed',
      active: 'Active',
      locked: 'Locked',
      verified: 'Verified',
      seasonal: 'Seasonal',
      mysteryBadge: 'Mystery Badge',
      dayLabel: 'Day',
      honorBadgesTitle: 'Honor Badges & Achievements',
      honorBadgesSubtitle: 'Earn badges through verified discipline, low drawdown, and podium finishes',
      unlockedCount: 'Unlocked Badges',
      rarityCommon: 'Common',
      rarityRare: 'Rare',
      rarityEpic: 'Epic',
      rarityLegendary: 'Legendary',
      badgeModalTitle: 'Badge Details & Requirements',
      howToUnlock: 'How to Unlock',
      rewardBonus: 'Reward Bonus',
      closeBtn: 'Close',
      toastClaimed: 'Daily Streak Claimed! +200 XP Added.',
      exploreRewardsBtn: 'Explore Rewards Hub',
      badgeRiskGuardianName: 'Risk Guardian',
      badgeRiskGuardianDesc: 'Completed a 5-day tournament with under 2.0% maximum drawdown.',
      badgeRiskGuardianCriteria: 'Verified 5-day trading streak with Max Trailing DD strictly below 2.00% equity.',
      badgePrecisionSniperName: 'Precision Sniper',
      badgePrecisionSniperDesc: 'Achieved > 70% win rate across a minimum of 10 closed trades.',
      badgePrecisionSniperCriteria: 'Closed 10+ canonical orders with net win rate exceeding 70.0% on verified live feed.',
      badgeCenturyClubName: 'Century Club',
      badgeCenturyClubDesc: 'Harvested 100+ net normalized pips within a single trading week.',
      badgeCenturyClubCriteria: 'Accumulate 100.0+ normalized pips between Monday 00:00 UTC and Friday 23:59 UTC.',
      badgePodiumMasterName: 'Podium Master',
      badgePodiumMasterDesc: 'Finished Top 3 in an official verified community tournament.',
      badgePodiumMasterCriteria: 'Place 1st, 2nd, or 3rd on the official final leaderboard of any Pro Arena contest.',
      badgeHallOfFameName: 'Hall of Fame Titan',
      badgeHallOfFameDesc: 'Crowned seasonal champion on the All-Time Legends leaderboard.',
      badgeHallOfFameCriteria: 'Rank #1 globally at the conclusion of a 90-day competitive trading season.',
      badgeIronDisciplineName: 'Iron Discipline',
      badgeIronDisciplineDesc: 'Zero anti-gambling rule infractions across 30 consecutive trades.',
      badgeIronDisciplineCriteria: '30 consecutive trades with mandatory SL placement, no revenge trading, and max 2% risk/trade.',
      tierNovice: 'Novice Trader',
      tierProSwing: 'Pro Swing Trader',
      tierMarketVeteran: 'Market Veteran',
      tierApexPredator: 'Apex Predator',
      tierHallOfFame: 'Hall of Fame Titan',
      prestigeBadge: 'Prestige Badge',
      yesterday: 'Yesterday',
      daysAgo: '3 days ago',
      lastWeek: 'Last week',
      clickToInspect: 'Click to inspect criteria',
    },
    leaderboard: {
      title: 'Global Verified Leaderboard',
      subtitle: 'Multi-broker verified performance ranked by pure skill & normalized pips',
      allTimeTab: 'All-Time Legends',
      todayTab: 'Daily Sprint',
      weekTab: 'Weekly League',
      dailySprint: 'Daily Sprint',
      weeklyLeague: 'Weekly League',
      allTimeLegends: 'All-Time Legends',
      filterAll: 'All Brokers',
      filterProp: 'Prop Accounts',
      filterEcn: 'True ECN Only',
      rankingMetric: 'Ranking Metric:',
      winningPips: 'Winning Pips',
      profitAmount: 'Profit Amount ($)',
      profitRate: 'Profit Rate (%)',
      searchPlaceholder: 'Search trader...',
      allBrokers: 'All Brokers',
      rankCol: 'Rank',
      traderCol: 'Trader & Tier',
      brokerCol: 'Broker Feed',
      netPipsCol: 'Net Pips',
      winRateCol: 'Win Rate',
      tradesCol: 'Trades',
      drawdownCol: 'Max Drawdown',
      actionCol: 'Action',
      viewAnalytics: 'View Analytics',
      liveVerified: 'LIVE VERIFIED',
      following: 'Following',
      follow: 'Follow Trader',
      dailyChampion: 'Trader of the Day',
      totalDailyPips: 'Total Pips Harvested',
      activeTradersToday: 'Active Traders',
      goldChampion: 'Gold Champion',
      silverContender: 'Silver Contender',
      bronzeMaster: 'Bronze Master',
      trades: 'Trades',
      estProfit: 'Est. Profit',
      winRate: 'Win Rate:',
      xp: 'XP:',
      netPips: 'Net Pips',
      profit: 'Profit ($)',
      rate: 'Rate',
    },
    community: {
      title: 'Live Global Community Stream',
      subtitle: 'Verified executions, rank promotions, and honor badge achievements in real time',
      challengeTitle: 'The 5,000 Pips Global Harvest',
      challengeDesc: 'All traders unite: harvest 5,000 collective winning pips this week to unlock +500 Bonus XP for all participants!',
      coopChallengeTitle: 'COMMUNITY CO-OP CHALLENGE',
      collectiveHarvest: 'Collective Harvest',
      completed: 'Completed',
      endsInDays: 'Ends in {days} days',
      liveBulletinTitle: 'Live Trade Bulletin & Cheers',
      liveBulletinDesc: 'Real-time stream of verified broker executions, rank climbs, and badges',
      postPlaceholder: 'Share verified trading insight...',
      postBtn: 'Post',
      allFeed: 'All Activity',
      liveTradesOnly: 'Winning Trades',
      filterAll: 'All Activity',
      filterWins: 'Winning Trades',
      filterBadges: 'Badges & Ranks',
      filterTournaments: 'Battles',
      closedTradeText: 'Closed',
      withPips: 'with',
      unlockedBadgeText: 'Unlocked the',
      climbedRankText: 'Climbed to',
      enlistedTournamentText: 'Enlisted into',
      cheerBtn: 'Cheer',
      cheersBullish: 'Bullish [BULL]',
      cheersRocket: 'Breakout [EXP]',
      cheersKing: 'Alpha [LEAD]',
      cheersShield: 'Risk Guard [DEF]',
      justNow: 'Just now',
      verifiedExecution: 'Verified Execution',
    },
    accounts: {
      title: 'Connected Accounts',
      connectedAccounts: 'Connected Accounts',
      activeAccounts: '{count} active',
      addAccount: '+ Add Account',
      noAccounts: 'No trading accounts connected yet.',
      noAccountsDesc: 'Connect XM, Axiory, Exness or Vantage',
      activeFeed: 'Active Feed',
      accountLabel: 'Account:',
      serverLabel: 'Server:',
      leverageLabel: 'Leverage:',
      equityBalance: 'Equity / Balance',
      vaultSecretRef: 'Vault Secret Reference',
      disconnectTitle: 'Disconnect Account',
      balance: 'Account Balance',
      equity: 'Dynamic Equity',
      openPnl: 'Open Positions PnL',
      viewOnly: 'Read-Only Feed',
      syncing: 'Syncing...',
      disconnectConfirm: 'Disconnect this account from TraderRank?',
    },
    positions: {
      title: 'Live Position Ingestion Feed',
      liveIngestionFeed: 'Live Position Ingestion Feed',
      subSecondStream: 'Sub-Second Stream',
      netFloatingPnl: 'Net Floating PnL:',
      noPositionsTitle: 'No open positions currently detected on connected accounts.',
      openTradesCount: 'Active Open Positions',
      ticketCol: 'Ticket',
      instrumentCol: 'Instrument',
      sideCol: 'Side',
      volumeCol: 'Volume',
      openPriceCol: 'Open Price',
      livePriceCol: 'Live Price',
      normalizedPipsCol: 'Normalized Pips',
      profitUsdCol: 'Profit (USD)',
      symbol: 'Symbol',
      type: 'Type',
      lots: 'Lots',
      openPrice: 'Open Price',
      currentPrice: 'Live Price',
      pips: 'Floating Pips',
      pnl: 'Floating PnL ($)',
      noPositions: 'No open positions detected.',
      noPositionsDesc: 'New trades opened on your MT4/MT5 accounts will automatically stream here via sub-second WebSocket.',
      readOnlyStream: 'Read-Only Ingestion Stream',
    },
    vault: {
      title: 'Secrets Vault Security & Audit Log',
      subtitle: 'TraderRank isolates all Investor Passwords and Exness API Secrets in a dedicated AES-256-GCM Secrets Vault.',
      vaultTitle: 'Secrets Vault Security & Audit Log',
      aesBadge: 'AES-256-GCM',
      collapseLogs: 'Collapse Audit Logs',
      viewLiveTrail: 'View Live Vault Audit Trail ({count})',
      vaultDesc: 'TraderRank isolates all Investor Passwords and Exness API Secrets in a dedicated AES-256-GCM Secrets Vault. No plaintext credentials are ever logged, sent to the database, or exposed to downstream services.',
      noLogsYet: 'No audit events logged yet.',
      blockedStatus: 'BLOCKED',
      okStatus: 'OK',
      architectureTitle: 'Zero-Write Security Architecture',
      immutableNotice: 'Physical Hardware Block of Trade Placement Verbs',
      physicalBlockTitle: 'Physical Order Execution Block',
      physicalBlockDesc: 'Our proxy connector stripped all POST /trade/order endpoints. Only GET /positions and GET /history are allowed.',
      aesEncryptionTitle: 'AES-256-GCM Vault Isolation',
      aesEncryptionDesc: 'All credentials encrypted at rest and in memory with isolated KMS rotation keys.',
      auditedStatus: 'Verified Zero-Write Audited',
      downloadAuditReport: 'Download Security Audit Report (PDF)',
    },
    profile: {
      title: 'Verified Trader Profile',
      overview: 'Performance Overview',
      globalRankingBadge: '{rank} Global Ranking',
      followingBtn: 'FOLLOWING',
      followBtn: 'FOLLOW TRADER',
      recentVerifiedExecutions: 'Recent Verified Executions',
      verifiedSinceLabel: 'Verified Since {date}',
      levelLabel: 'Level {level}',
      netWinningPips: 'Net Winning Pips',
      winRate: 'Win Rate',
      profitFactor: 'Profit Factor',
      maxDrawdown: 'Max Drawdown',
      totalTrades: 'Total Trades',
      bestTrade: 'Best Trade',
      avgHoldingTime: 'Avg Holding Time',
      verifiedSince: 'Verified Since',
      followTrader: 'Follow Trader',
      following: 'Following',
      copyDisabledNotice: 'TraderRank is a competitive performance platform. Direct copy-trading is disabled to maintain zero-write security.',
    },
    aiModal: {
      title: 'AI Multi-Timeframe Chart Analysis',
      subtitle: 'Real-time algorithmic synthesis scanning institutional order flow, swing structure, and momentum confluence',
      multiTfTitle: 'AI Multi-Timeframe Chart Analysis',
      multiTfSubtitle: 'Real-time algorithmic synthesis scanning institutional order flow, swing structure, and momentum confluence',
      reScanAi: 'Re-Scan AI',
      scanningAsset: 'Synthesizing 15m, 4h, 1D, and 1W market structures for {symbol}...',
      primaryAiBias: 'PRIMARY AI BIAS',
      confluenceScoreLabel: 'CONFLUENCE SCORE',
      highProbAgreement: 'High-probability agreement across all 4 time horizons',
      riskRewardRatioLabel: 'RISK / REWARD RATIO',
      swingTargetTp2: 'Calculated to Swing Target (TP2)',
      plotOnChartBtn: 'Plot AI Key Levels on Chart',
      plottedOnChartBtn: 'AI Levels Plotted on Chart',
      multiTfStructureBreakdown: 'Multi-Timeframe Structure Breakdown',
      tacticalBlueprintTitle: 'Tactical Execution Blueprint',
      keyLevelsMatrixTitle: 'Multi-Timeframe Key Levels Matrix',
      institutionalCommentaryTitle: 'Institutional AI Market Commentary',
      riskFactorsTitle: 'Risk Factors & Macro Catalysts',
      analyzingChart: 'Synthesizing Multi-Timeframe Confluence...',
      confidenceScore: 'Confluence Score',
      marketStructure: 'Market Structure Context',
      trendConfluence: 'Trend Confluence',
      keyLevels: 'Institutional Levels',
      tradeSetup: 'Tactical Setup Blueprint',
      entry: 'Optimal Entry Zone',
      sl: 'Stop Loss (Invalidation)',
      tp: 'Target Profit (TP)',
      disclaimer: 'AI analysis is for educational and strategic modeling purposes. Always manage your own risk.',
    },
    forexCalendar: {
      title: "Today's ForexFactory Macro Releases & News Digest",
      subtitle: 'High-impact economic catalysts and central bank releases.',
      filterCurrency: 'Currency',
      filterImpact: 'Impact Level',
      hidePassed: 'Hide Passed Events',
      highImpactOnly: 'High Impact (Red Folders)',
      redFolders: 'Red Folders',
      refreshCalendar: 'Refresh Calendar',
      timeUntil: 'Time Remaining',
      actual: 'Actual',
      forecast: 'Forecast',
      previous: 'Previous',
      noEvents: 'No economic events found matching the selected filter.',
      impactHigh: 'HIGH IMPACT',
      impactMed: 'MEDIUM IMPACT',
      impactLow: 'LOW IMPACT',
      impactHoliday: 'BANK HOLIDAY',
      modalTitle: 'ForexFactory Economic Calendar',
      liveRedFolderFeed: 'Live Red Folder Feed',
      subtitleDetailed: 'Real-time macroeconomic news, interest rate decisions, inflation & employment data',
      nextHighImpact: 'NEXT HIGH IMPACT',
      allEvents: 'All Events',
      highImpact: 'High Impact',
      mediumImpact: 'Medium',
      lowImpact: 'Low',
      hidePast: 'Hide Past Releases',
      currency: 'Currency:',
      impact: 'Impact:',
      ingesting: 'Ingesting ForexFactory Economic Calendar...',
      noEventsMatching: 'No economic releases matching the selected filter criteria.',
      eventsCount: 'events',
      timeCol: 'Time',
      curCol: 'Cur',
      impactCol: 'Impact',
      eventCol: 'Event',
      actualCol: 'Actual',
      forecastCol: 'Forecast',
      previousCol: 'Previous',
      feedActive: 'ForexFactory Live Economic Feed Active • Automatic 5-minute sync',
      dataSource: 'Data Source:',
      time: 'Time:',
    },
    bulletin: {
      badgeTitle: 'LIVE TRADE BULLETIN',
      badgeSubtitle: 'REAL-TIME EXECUTION SPOT',
      liveExecution: 'LIVE EXECUTION',
      takeProfit: 'TAKE PROFIT',
      pipsSurge: 'PIPS SURGE',
      newTop10: 'NEW TOP 10',
      verifiedBridge: 'VERIFIED BRIDGE',
      scalpWin: 'SCALP WIN',
      goldRush: 'GOLD RUSH',
      londonBreakout: 'LONDON BREAKOUT',
      swingPullback: 'SWING PULLBACK',
      verifiedDeal: 'VERIFIED DEAL',
      weeklyHigh: 'WEEKLY HIGH',
      tournamentLead: 'TOURNAMENT LEAD',
      m15Pullback: 'M15 PULLBACK',
      justNow: 'Just now',
      pips: 'pips',
    },
    marketTicker: {
      badgeTitle: 'MARKET LIVE PRICES',
      badgeSubtitle: 'TOP TRADING PAIRS',
      realApiLive: '● Real API Rates Live',
      liveEngine: '● Live Market Engine',
      topTradingPairs: 'TOP TRADING PAIRS',
      spread: 'SPR:',
      bid: 'BID',
      ask: 'ASK',
      tagMostTraded: '#1 MOST TRADED',
      tagAlltick: 'ALLTICK FEED',
      tagHighMomentum: 'HIGH MOMENTUM',
      tagTopVolatility: 'TOP PROFIT VOLATILITY',
      tagOanda: 'OANDA / NYMEX LIVE',
      tagCrypto: '24/7 ALPHA CRYPTO',
      tagAsiaPac: 'ASIA-PAC ANCHOR',
      tagCommodityFx: 'COMMODITY FX',
      tagUsSession: 'US SESSION VOLUME',
    },
    customStudio: {
      modalTitle: 'Custom Indicator Studio',
      sandboxBadge: 'TradingView Sandbox',
      modalSubtitle: 'Create, customize and backtest your proprietary Pine / JavaScript trading indicators',
      tabTemplates: 'Preset Templates',
      tabEditor: 'Pine / JS Editor',
      tabLibrary: 'My Library',
      tabDocs: 'API Reference & CheatSheet',
      newIndicatorBtn: '+ New Indicator',
      chooseTemplateTitle: 'Choose a Ready-to-Use TradingView Template',
      chooseTemplateDesc: 'Select from community-tested momentum oscillators, volatility bands, and scalp ribbons to customize.',
      useTemplate: 'Use Template',
      activeOnChart: 'Active on Chart',
      indicatorName: 'Indicator Name',
      shortLabel: 'Short Label / Code (e.g. RSI14)',
      description: 'Description',
      chartPane: 'Chart Pane',
      mainOverlay: 'Main Chart Overlay',
      subPanel: 'Separate Sub-Panel',
      visualStyle: 'Visual Plot Style',
      plotLine: 'Continuous Line',
      plotHistogram: 'Histogram Bars',
      plotDots: 'Scatter Dots',
      colorTheme: 'Color Accent',
      lineWidth: 'Line Width',
      parametersTitle: 'Configurable Input Parameters',
      addParam: '+ Add Parameter',
      sourceCodeTitle: 'Pine / JavaScript Execution Logic',
      testRunBtn: '▶ Run Diagnostic Test',
      saveApplyBtn: 'Save & Apply to Chart',
      testPassed: 'Compilation & Diagnostic Test Passed',
      testFailed: 'Calculation Error Detected',
      dataPoints: 'Data Points Processed',
      range: 'Output Range',
      deleteConfirm: 'Delete Indicator',
    },
    app: {
      heroSubheading: 'Multi-broker verified competitive esports arena for Forex, Commodities & Crypto',
      syncing: 'Syncing...',
      sslVault: '256-Bit SSL Isolated Vault',
    },
    footer: {
      poweredBy: 'Powered by',
      companyName: 'Libralytic Co.,Ltd',
      allRightsReserved: 'All Rights Reserved',
      riskDisclaimer: 'Trading Forex, Commodities, and Crypto carries substantial risk of loss. TraderRank provides 100% read-only verification.',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      apiDocs: 'API Documentation',
      systemStatus: 'Systems 100% Operational',
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
      rewards: 'バッジ & 報酬',
      community: 'コミュニティ',
      positions: '保有ポジション',
      securityVault: 'ゼロライト金庫',
      connectAccount: '口座を連携',
      proLeague: 'プロリーグ',
      proSubscriber: 'PRO 有効中',
      unlockPro: 'Pro をアンロック ($9/月)',
      proPlanActive: 'PRO 全機能解放',
      viewOnlyBadge: '閲覧専用・不変セキュリティ',
      wsConnected: 'リアルタイムWS接続中',
      wsConnecting: 'WS接続中...',
      refreshRates: 'レートを最新に更新',
      switchView: '表示切替',
      fastConnect: 'クイック接続',
    },
    landing: {
      badge: '公式検証済みマルチブローカーアリーナ',
      heroTitlePrefix: '世界最高峰の ',
      heroTitleAccent: '検証済みFXトレーダー競技場',
      heroTitleSuffix: '',
      heroSubtitle: 'XM、Exness、Axiory、Vantage、IC Marketsの口座を100%閲覧専用インベスターパスワードで安全に連携。純Pips獲得数を競い合い、賞金トーナメントで勝利し、毎日の機関投資家レベルの取引インテリジェンスをアンロック。',
      enterArenaBtn: 'プロアリーナに入る',
      connectBrokerBtn: 'ブローカー口座を連携',
      exploreChartsBtn: 'SMC ライブチャート',
      verifiedPnlBadge: 'ゼロライト実盤検証済み',
      zeroWriteGuarantee: '100% 閲覧専用 • 資金アクセス一切不可の安全保証',
      liveBrokersCount: '対応ブローカー',
      activeTradersCount: '世界中の参加トレーダー',
      volume24h: '日次正規化取引量',
      topPerformersTitle: '世界公認ランキング',
      topPerformersSubtitle: '獲得純Pips、勝率の安定性、最大ドローダウン制御をアルゴリズムで公正に正規化。',
      tabPips: '獲得純Pips',
      tabProfit: '純利益額',
      tabWinRate: '勝率の安定性',
      rankCol: '順位',
      traderCol: 'トレーダー & ランク',
      brokerCol: 'ブローカー',
      gainCol: 'Pips 獲得',
      winRateCol: '勝率',
      actionCol: '操作',
      viewProfile: '詳細実績を確認',
      feature1Title: 'ゼロライト不変セキュリティ',
      feature1Desc: 'TraderRankはインベスター（閲覧専用）パスワードのみで動作。発注や出金操作はシステム基盤レベルで物理的に遮断されています。',
      feature2Title: 'マルチブローカー正規化エンジン',
      feature2Desc: '5桁の小数点表記、異なるスプレッド幅、通貨ペア命名規則を自動統一し、公平な競技環境を提供します。',
      feature3Title: '機関投資家向け日次インテリジェンス ($9/月)',
      feature3Desc: '1:3、1:5、1:7 の高リスクリワード戦略、ForexFactory重要指標分析、SMCオーダーブロックを毎日お届けします。',
      feature4Title: '賞金付き eスポーツ型トーナメント',
      feature4Desc: '5日間のスプリント戦や30日間の月間選手権に参加し、賞金プール、経験値(XP)、名誉バッジを獲得。',
      ctaHeading: '世界の頂点で、あなたの真の実力を証明しませんか？',
      ctaSubtitle: 'MT4/MT5のインベスターパスワードで60秒で安全連携。資金リスクは完全にゼロです。',
      ctaButton: 'ライブアリーナを開始する →',
    },
    intel: {
      title: '日次トレーディング・インテリジェンスハブ',
      subtitle: 'マクロファンダメンタルズ動向、ForexFactory経済指標発表、SMCオーダーブロック、およびマルチタイムフレーム戦略プラン。',
      todayMarketSummary: '本日の相場サマリー',
      separateFromChart: 'ライブチャートから独立',
      proUnlocked: 'PRO アンロック済み ($9/月)',
      unlockProBtn: '月額 $9 で Pro をアンロック',
      marketRegime: '本日の市場レジーム',
      headline: 'マクロ動向見通し',
      macroSentimentIndex: 'マクロセンチメント指数',
      sentimentGreed: '極度の強気 (リスク選好フロー)',
      sentimentFear: '極度の警戒 (安全資産への逃避)',
      sentimentNeutral: '均衡相場 (レンジ相場)',
      forexFactoryNews: 'ForexFactory 重要経済指標',
      customTimeframeEngine: 'カスタム時間軸・戦略ジェネレーター',
      customTimeframeDesc: '好みの取引時間枠 (1分足〜週足) と戦略モデルを選択して、高精度の戦術プランカードを生成します。',
      confluenceEngineBadge: 'AI マルチタイムフレーム根拠分析エンジン',
      assetFocus: '対象資産',
      symbolSelect: '銘柄を選択',
      timeframeSelect: '戦略時間枠',
      strategicTimeframe: '戦略時間枠',
      tradingStyle: '取引スタイル',
      strategyModel: '戦略モデル',
      strategyType: 'トレード戦略モデル',
      riskRewardTarget: '目標リスクリワード比 (R:R)',
      rr1_3: '1:3 R:R (標準スキャルピング & デイトレード)',
      rr1_5: '1:5 R:R (高勝率 SMC エクスパンション)',
      rr1_7: '1:7 R:R (最大非対称スイングランナー)',
      sessionWindow: 'セッション時間枠',
      sessionFocus: '主戦場セッション',
      accountSizeLabel: '口座残高 ($)',
      accountSize: '1% リスク計算用資金:',
      generateAnalysis: 'カスタム戦略プランを生成',
      generateCustomStrategy: 'カスタム日次戦略を生成',
      analyzing: '板情報とSMC流動性を分析中...',
      synthesizingConfluence: '複数の根拠を統合分析中...',
      tradeQualification: 'エントリー判定指令',
      tradeSetupQualified: 'トレード適格成立 • 目標 {targetRR} R:R 検証完了',
      directiveQualified: 'エントリー適格 — 高確率セットアップ',
      directiveDisqualified: '厳格指令: トレードを見送ってください',
      doNotEnterTrade: '[HOLD] トレードエントリー禁止 • 目標 {targetRR} R:R 未達',
      rrTargetsLabel: 'R:R 目標: 1:3 • 1:5 • 1:7',
      findOtherPairs: 'より高いリスクリワードが見込める他の通貨ペアを探す',
      findAnotherPair: '他の高根拠な通貨ペアを探索 (推奨スキャン):',
      alternativePairs: 'より高いR:Rが期待できる代替通貨ペア:',
      switchScan: '切り替えてスキャン',
      confluenceScore: '根拠スコア:',
      recommendedAction: '推奨アクション',
      entryZone: '最適エントリー帯',
      optimalEntryZone: '最適エントリー帯',
      stopLoss: '損切りポイント (無効化SL)',
      takeProfit1: '利確ターゲット 1 (1:3 R:R)',
      takeProfit2: '利確ターゲット 2 (1:5 R:R)',
      takeProfit3: '利確ターゲット 3 (1:7 ランナー)',
      riskRewardLots: 'リスクリワード比 & ロット数',
      marketStructureContext: '市場構造のコンテクスト',
      entryTriggerRule: 'エントリー発動ルール',
      strictInvalidationScenario: '厳格な無効化シナリオ',
      optimalSessionExecution: '最適な執行セッション時間帯',
      preExecutionChecklist: 'トレード執行前チェックリスト:',
      unlockGeneratorModalTitle: 'カスタム時間軸戦略ジェネレーターをアンロック',
      unlockGeneratorModalDesc: 'TraderRank Pro ($9/月) に加入すると、全時間軸 (1分・5分・15分・1時間・4時間・日足・週足) に対応したエントリー帯・損切り・利確目標を生成できます。',
      unlockBtn: '月額 $9 でアンロックする',
      forexFactoryReleasesTitle: '本日の ForexFactory 重要指標 & ニュース要約',
      highImpactReleasesToday: '本日 {count} 件の最重要指標発表',
      forecast: '予想:',
      previous: '前回:',
      dailyBreakdownTitle: '日次テクニカル & ファンダメンタル詳細分析',
      dailyBreakdownDesc: '資産を選択して、機関投資家のオーダーブロック、ピボット水準、カタリストを確認。',
      liveAnchor: 'リアルタイム価格:',
      volatility: 'ボラティリティ:',
      technicalMarketStructure: 'テクニカル市場構造',
      fundamentalDrivers: 'ファンダメンタル要因',
      institutionalDemandBlock: '機関投資家デマンドブロック (SMC帯)',
      institutionalSupplyBlock: '機関投資家サプライブロック (レジスタンス帯)',
      pivotLevels: 'ピボット水準 (S1 / Pivot / R1)',
      smcKeyLevels: 'SMC 重要水準 & オーダーブロック',
      orderBlock: '機関投資家オーダーブロック (OB)',
      demandZone: '主要デマンドゾーン',
      supplyZone: '主要サプライゾーン',
      institutionalBias: '機関投資家のバイアス',
      unlockProPrompt: '月額 $9 で毎日の完全なインテリジェンスとカスタム時間軸分析をアンロック。',
      pricePerMonth: '$9 / 月',
      refreshReport: 'インテリジェンスを更新',
      macroRegimeTitle: 'マクロ市場レジーム',
      highImpactNews: '重要経済カレンダー',
      riskTolerance: '許容リスク',
      optimalSession: '最適執行ウィンドウ',
      calculatedLotSize: '推奨1%リスクロット',
      confluenceFactors: '合流・根拠要因',
      invalidationPrice: '構造的無効化価格',
    },
    chart: {
      liveFeed: 'リアルタイム配信 (AllTick / OANDA)',
      candlestickStream: '高頻度ティックデータストリーム',
      selectPair: '通貨ペア選択',
      timeframe: '時間足',
      indicators: 'インジケーター',
      customIndicators: 'カスタムインジケータースタジオ',
      smcOverlay: 'SMC スマートマネーコンセプト層',
      bosDetected: 'BOS (構造ブレイク)',
      chocDetected: 'CHoCH (トレンド転換サイン)',
      fairValueGap: 'FVG (適正価値ギャップ)',
      highPrecision: '5桁高精度FXレート配信',
      bid: '買値 (BID)',
      ask: '売値 (ASK)',
      spread: 'スプレッド',
      volume: '出来高',
      realtimeTick: 'リアルタイムティック',
      aiAnalysisBtn: 'AIスマート分析',
      lastPrice: '現在値',
      change24h: '24時間変動',
      high24h: '24時間高値',
      low24h: '24時間安値',
      quickIndicators: 'クイック指標:',
      createCustomIndicator: '+ カスタム指標を作成',
      pineScriptStudio: 'TradingView Pine Script スタジオ',
      smcSectionTitle: 'スマートマネーコンセプト (SMC)',
      demandSupplyLabel: 'デマンド & サプライゾーン',
      demandSupplyDesc: '機関投資家の未決済オーダーブロック',
      bosLabel: '構造ブレイク (BOS / CHoCH)',
      bosDesc: 'スイングフラクタル & 構造変化',
      myCustomIndicators: 'マイカスタム指標',
      oscillatorSubPanel: 'オシレーターサブパネル',
      hideSub: 'サブパネル非表示',
      smcQuickBtn: 'SMC (BOS • デマンド)',
      pineScriptQuickBtn: '+ Pine Script',
      aiMultiTfQuickBtn: 'AI マルチTF (15m • 4h • 1D • 1W)',
      forexFactoryQuickBtn: 'ForexFactory',
      allTickLiveBadge: 'AllTick リアルタイム配信中 (7日トークン)',
      refreshCandles: 'ローソク足を更新',
      aiLevelsActive: 'AI水準 (表示中)',
      aiKeyLevels: 'AI重要水準',
      newsCalendar: '経済カレンダー',
      loadingKLine: 'AllTick Kラインストリーム読み込み中...',
      closeSubPanel: 'サブパネルを閉じる',
      liveStreamActive: 'MetaApi ブローカーストリーム: ライブ為替・ゴールド配信中',
      tokenTrial: 'MetaApi クラウドブローカー台帳 (ライブ)',
      overlayIndicators: 'メインチャート重ね合わせ指標',
    },
    subscription: {
      modalTitle: 'TraderRank Pro — 日次インテリジェンス全機能アクセス',
      modalSubtitle: '毎日の機関投資家セットアップ、1:3 / 1:5 / 1:7 R:R 判定、SMCゾーン、カスタムAI時間軸分析をすべて解放。',
      monthlyTier: 'Pro 月額プラン',
      monthlyPrice: '$9.00',
      annualTier: 'Pro 年間プラン',
      annualPrice: '$79.00',
      annualSavings: '27% お得',
      perMonth: '/ 月',
      billedAnnually: '年間 $79 (月換算 $6.58)',
      billedMonthly: '月額 $9 (いつでも解約可能)',
      selectPlan: '会員プランを選択',
      currentPlan: '現在のプラン',
      mostPopular: '一番人気',
      save27: '27% お得',
      monthlyDesc: '日次マーケット情報とカスタム戦略ジェネレーターの全機能。いつでも解約可能。',
      annualDesc: '全Pro機能に加え、優先Alpha Discordグループと過去ログアーカイブへのアクセス。',
      paymentMethodsTitle: '決済方法を選択',
      selectPaymentGateway: '決済ゲートウェイを選択:',
      creditCard: 'クレジットカード / デビットカード',
      appleGooglePay: 'Apple / Google Pay',
      cryptoUsdt: '暗号資産 (USDT)',
      cardNumber: 'カード番号',
      cardExpiry: '有効期限 (MM/YY)',
      cardCvc: 'セキュリティコード (CVC)',
      cardholderName: 'カード名義人',
      country: '国 / 地域',
      applePayDesc: 'Apple Wallet または Google Pay に連携されたアカウントで安全に決済します。',
      payWithAppleGpay: 'Pay / GPay で {amount} を決済',
      oneClickCheckout: 'ワンクリック即時決済',
      cryptoNetwork: '送金ネットワークを選択',
      sendExactly: '送金額:',
      rateExpiresIn: 'レート保証期限:',
      depositAddress: '入金用アドレス',
      copyAddress: 'コピー',
      copied: 'コピー完了',
      timerRemaining: 'レート保証タイマー',
      subtotal: '小計',
      estimatedTax: '税金 / VAT (0%)',
      totalDueToday: '本日のお支払い合計',
      sslEncrypted: '256-Bit SSL 暗号化通信',
      instantActivationBadge: '即時 Pro 有効化',
      moneyBackGuarantee: '14日間返金保証',
      confirmAndUnlock: '決済を完了して Pro をアンロック',
      processingPayment: '決済を処理中...',
      congratsTitle: 'TraderRank Pro へようこそ',
      congratsSubtitle: 'Pro日次インテリジェンスおよびマルチタイムフレーム戦略ジェネレーターが有効化されました。',
      paymentConfirmedBadge: '支払い確認完了 • PRO 有効化',
      licenseId: 'ライセンスキー ID',
      subscriptionPlan: 'サブスクリプションプラン:',
      memberLicenseId: 'メンバーライセンス ID:',
      nextAutoRenewal: '次回自動更新日:',
      downloadReceipt: '領収書 (PDF) をダウンロード',
      receiptSaved: '領収書を保存しました！',
      downloadInvoice: '請求書をダウンロード',
      launchIntelBtn: '日次インテリジェンスを開始',
      openDailyIntelBtn: '日次インテリジェンスハブを開く',
      membershipActiveBadge: 'PRO メンバーシップ有効中',
      membershipActiveDesc: '日次インテリジェンス、マクロレポート、カスタム戦略生成の全権限をご利用いただけます。',
      billingRate: '請求レート',
      activationDate: '有効化日時',
      renewalExpiryDate: '次回更新 / 有効期限',
      unlockedFeaturesTitle: '現在有効な機能一覧:',
      resetToFreeMode: '無料プレビューモードに戻す',
      guaranteeText: '即時有効化 • 14日間返金保証 • いつでもワンクリックで解約可能。',
      instantActivation: '256-Bit SSL 即時有効化',
    },
    connector: {
      modalTitle: '取引ブローカーを選択',
      modalSubtitle: '口座をホストしているブローカーを選択して、最適なコネクタへルーティングします。',
      selectBroker: 'ブローカーを選択',
      selectBrokerDesc: '口座をホストしているブローカーを選択して、最適なコネクタへルーティングします。',
      routeTitle: '{broker} の連携ルート',
      routeDesc: 'TraderRank PRD §5.3 のルーティング規約に従い、接続アーキテクチャを選択します。',
      exnessNativeTitle: 'Exness 公式ネイティブ API (推奨)',
      exnessNativeDesc: '公式 REST & WebSocket 直接接続。ゲートウェイ遅延ゼロ、外部手数料ゼロ。',
      mtGatewayTitle: 'MT4/MT5 ゲートウェイ (代替接続)',
      mtGatewayDesc: 'APIキーが発行されていない Exness MT4/MT5 口座用の標準接続。',
      brokerAgnosticTitle: 'ブローカー非依存型 MT4/MT5 ゲートウェイ',
      brokerAgnosticDesc: 'クラウドインベスターパスワードブリッジ経由で {broker} に接続します。',
      credentialsTitle: '閲覧専用の認証情報を入力',
      securityCalloutTitle: '発注リスク完全ゼロの保証:',
      securityCalloutDesc: 'TraderRankは閲覧専用アクセスのみを要求します。インベスターパスワードで注文を発注・決済することは技術的に不可能です。暗号化された認証情報は専用金庫で厳重に保護されます。',
      platform: 'プラットフォーム',
      brokerServer: 'サーバー名',
      brokerServerName: 'ブローカーサーバー名',
      popularServers: 'IC Markets / IC Trading の主要サーバー:',
      findIcServer: 'IC Markets のサーバーを確認 / Raw Spread 口座開設 (ic.com) →',
      loginId: '口座ログインID',
      accountLoginNumber: '口座番号 / ログインID',
      passwordLabel: 'インベスターパスワード (閲覧専用)',
      investorPassword: 'インベスター (閲覧専用) パスワード',
      investorPasswordHint: 'マスター取引パスワードは絶対に入力しないでください。閲覧専用インベスターパスワードのみを入力してください。',
      neverMasterPassword: 'マスター取引パスワードは入力不要です。閲覧専用のインベスターパスワードをご使用ください。',
      exnessAccountId: 'Exness 口座 ID (任意)',
      exnessApiKey: 'Exness API キー',
      exnessApiSecret: 'Exness シークレットキー',
      exnessApiHint: 'KYC Tier-2 完了後、Exness 設定 > API アクセスから発行されます。',
      accountNickname: '口座ニックネーム',
      diagnosticsTitle: '接続診断テスト',
      diagnosticsDesc: 'データベース保存前に、読み取り権限と通信テストを同期実行します。',
      pingingBroker: 'ブローカーサーバーと通信し、読み取り権限を確認中...',
      preflightPassedTitle: '接続事前テスト合格',
      connectionFailedTitle: '接続に失敗しました',
      brokerLabel: 'ブローカー:',
      integrationLabel: '連携方式:',
      accountLabel: '口座番号:',
      balanceLabel: '口座残高:',
      equityLabel: '有効証拠金:',
      leverageLabel: 'レバレッジ:',
      editCredentials: '認証情報を再編集',
      confirmIngestTrades: '接続を確定して取引履歴を取り込む',
      persistingToVault: '暗号化金庫へ保存中...',
      connectBtn: '検証して連携する',
      connecting: '安全なクラウドブリッジを確立中...',
      connectedSuccess: '口座が正常に連携されました！',
      zeroWriteTitle: 'ゼロライト安全保証',
      zeroWriteDesc: 'TraderRankは閲覧専用オブザーバーとして機能します。注文の発注、変更、出金操作は基盤レベルで遮断されています。',
      readOnlyAudited: 'ゼロライト・セキュリティ監査済み',
      disconnectAccount: '口座の連携を解除し認証情報を消去',
      activePositionsCount: '保有ポジション数',
      accountBalance: '口座残高',
      accountEquity: '有効証拠金',
      runPreflight: '事前安全診断を実行',
      preflightChecking: '閲覧権限を検証中...',
      preflightPassed: '事前テスト合格 — 閲覧専用確認済み',
      stepBroker: '1. ブローカー選択',
      stepCredentials: '2. 認証情報入力',
      stepVerification: '3. 事前テスト',
      stepComplete: '4. 完了',
      nextStep: '次へ: 認証情報入力 →',
      backStep: '戻る',
    },
    dailyBest: {
      spotlight: '日次ベストトレーダー・スポットライト',
      window: '24時間クロスプラットフォーム集計',
      traderOfTheDay: '本日の最優秀トレーダー',
      subtitle: 'XM、Axiory、Exness、Vantage全体で本日最も高い純Pipsを獲得したトレーダー',
      rollover: '日次集計リセットまで:',
      hideHallOfFame: '歴代記録を隠す',
      dailyChampions: '歴代チャンピオン',
      dailyCrown: '日次王冠',
      platformsTraded: '取引ブローカー:',
      winRate: '勝率:',
      trades: '回取引',
      todayNetGain: '本日の獲得純Pips',
      pips: 'pips',
      closed: '決済済み:',
      float: '含み損益:',
      noTrades: '本日のセッションではまだ取引データがありません。',
      totalPipsGenerated: '本日全参加者が獲得した総Pips:',
      activeCompeting: '本日稼働中のトレーダー数:',
      hallOfFameTitle: '殿堂入り — 歴代日次チャンピオン一覧',
    },
    arena: {
      tournamentsTitle: 'リアルタイム・トレード大会アリーナ',
      tournamentsSubtitle: '世界中の検証済みMT4/MT5トレーダーと賞金、名誉、公式実績をかけて競い合いましょう。',
      liveContests: '現在開催中のアリーナ',
      upcomingContests: '開催予定の大会',
      prizePool: '賞金プール',
      participants: '参加者数',
      timeLeft: '残り時間',
      joinArena: '大会アリーナに参戦',
      registered: '参加登録済み',
      dailyChampionTitle: '日次 Pips クラウン覇者',
      dailyChampionPips: '日次純Pips',
      badgesTitle: '実績バッジ & ランク名誉',
      communityFeedTitle: '世界コミュニティ・リアルタイム配信',
      liveTradeFeed: 'リアルタイム取引速報',
      weeklySprint: '週間 FX ブリッツリーグ',
      weeklySprintTag: '週間スプリント',
      weeklySprintDesc: 'EUR、GBP、ゴールドトレーダー向けの5日間スプリント。上位3名に賞金およびランク昇格ボーナスが付与されます。',
      sprintDays: '月曜日 – 金曜日',
      monthlyChampionship: '月間 Apex プロップ選手権',
      monthlyChampionshipTag: '月間チャンピオンシップ',
      monthlyChampionshipDesc: '旗艦となる長期耐力コンペティション。獲得PIPSとシャープレシオの安定性を組み合わせた多面評価。',
      monthlyDuration: '30日間ガントレット',
      globalGoldRushTitle: 'グローバル・ゴールドラッシュ・マスターズ',
      globalGoldRushSubtitle: 'XAUUSDおよび貴金属の精密トレードガントレット',
      tokyoLondonOverlapTitle: '東京・ロンドン・オーバーラップ・ラッシュ',
      tokyoLondonOverlapSubtitle: 'GBP・EUR通貨ペアを対象とした白熱の8時間セッションバトル',
      maxDailyLoss: '日次最大許容損失',
      maxTrailingDD: '最大トレイリングドローダウン',
      minTradesReq: '認定に必要な最低取引回数',
      freeEntry: '参加費無料',
      liveBattleBadge: 'ライブバトル',
      antiGamblingRules: '健全な資金管理を担保する機関投資家基準ルール',
      maxDailyLossDesc: '純資産損失',
      maxTrailingDDDesc: 'ピーク時DD',
      minTradesDesc: '回以上の取引で認定',
      scoringSystem: 'スコアリング方式',
      scoringFormula: '正規化純Pips × 勝率',
      scoringSystemDesc: '正規化純Pips × 勝率',
      tradesToQualify: '達成に必要な取引数',
      peakDD: 'ピーク時DD',
      equityLoss: '有効証拠金損失',
      standingsTitle: '大会順位表 & 賞金獲得圏',
      disqualifiedBadge: '失格判定',
      enteredTracking: '参戦中 (成績追跡中)',
      enterTournament: 'トーナメントに参戦',
      battleEndsIn: 'バトル終了まで:',
      estimatedPrize: '獲得予定賞金',
      netPips: '純Pips',
    },
    rewards: {
      title: 'トレーダー名誉・経験値(XP)・功績バッジ',
      subtitle: '徹底した資金管理、高勝率の維持、トーナメント入賞を通じて検証済みバッジを獲得。',
      currentTier: 'マーケットベテラン',
      levelTrader: 'LEVEL 3 トレーダー',
      currentXp: '現在の獲得経験値',
      progressTo: 'Level 4: Apex Predator への進捗',
      xpRemaining: 'レベルアップに必要な残りXP',
      dailyStreakTitle: '連続ログイン・トレード報酬',
      streakActive: '4日連続アクティブ継続中',
      claimBtn: '+200 XP を受け取る',
      claimed: '獲得済み',
      active: '獲得可能',
      locked: '未解放',
      verified: '公式認定',
      seasonal: 'シーズン限定',
      mysteryBadge: 'ミステリーバッジ',
      dayLabel: '日目',
      honorBadgesTitle: '名誉バッジ & 実績一覧',
      honorBadgesSubtitle: '低ドローダウン、高い規律、表彰台フィニッシュで名誉バッジを獲得',
      unlockedCount: '解放済みバッジ',
      rarityCommon: 'コモン',
      rarityRare: 'レア',
      rarityEpic: 'エピック',
      rarityLegendary: 'レジェンダリー',
      badgeModalTitle: 'バッジ詳細 & 解放条件',
      howToUnlock: '解放条件',
      rewardBonus: '獲得ボーナス',
      closeBtn: '閉じる',
      toastClaimed: 'デイリーストリークを受け取りました！ +200 XP 追加。',
      exploreRewardsBtn: 'リワードハブを見る',
      badgeRiskGuardianName: 'リスク・ガーディアン',
      badgeRiskGuardianDesc: '最大ドローダウン2.0%未満で5日間の大会を完走。',
      badgeRiskGuardianCriteria: '最大ドローダウン2.00%未満を厳格に維持した5日間の検証済み取引。',
      badgePrecisionSniperName: 'プレシジョン・スナイパー',
      badgePrecisionSniperDesc: '10回以上の決済取引で勝率70%超を達成。',
      badgePrecisionSniperCriteria: '検証済みライブフィードで勝率70.0%超の10回以上の注文を決済。',
      badgeCenturyClubName: 'センチュリー・クラブ',
      badgeCenturyClubDesc: '単一の取引週間で100以上の純Pipsを獲得。',
      badgeCenturyClubCriteria: '月曜00:00 UTCから金曜23:59 UTCの間に100.0以上の正規化Pipsを獲得。',
      badgePodiumMasterName: 'ポディウム・マスター',
      badgePodiumMasterDesc: '公式検証済みコミュニティ大会でトップ3に入賞。',
      badgePodiumMasterCriteria: '公式プロアリーナ大会の最終リーダーボードで1位〜3位に入賞。',
      badgeHallOfFameName: '殿堂入りタイタン',
      badgeHallOfFameDesc: '歴代レジェンドリーダーボードでシーズン王者に戴冠。',
      badgeHallOfFameCriteria: '90日間の競技取引シーズンの終了時に世界ランク1位を獲得。',
      badgeIronDisciplineName: '鉄の規律',
      badgeIronDisciplineDesc: '30回連続の取引でアンチギャンブル規律違反ゼロ。',
      badgeIronDisciplineCriteria: '必須SL設定、リベンジトレード禁止、1トレードあたり最大リスク2%を30回連続遵守。',
      tierNovice: 'ノービス・トレーダー',
      tierProSwing: 'プロ・スイングトレーダー',
      tierMarketVeteran: 'マーケットベテラン',
      tierApexPredator: 'Apex プレデター',
      tierHallOfFame: '殿堂入りタイタン',
      prestigeBadge: 'プレステージバッジ',
      yesterday: '昨日',
      daysAgo: '3日前',
      lastWeek: '先週',
      clickToInspect: 'クリックして条件を表示',
    },
    leaderboard: {
      title: '世界検証済みリーダーボード',
      subtitle: '純粋なスキルと正規化Pipsによって格付けされたマルチブローカー実盤ランキング',
      allTimeTab: '歴代レジェンド',
      todayTab: '日次スプリント',
      weekTab: '週間リーグ',
      dailySprint: '日次スプリント',
      weeklyLeague: '週間リーグ',
      allTimeLegends: '歴代レジェンド',
      filterAll: 'すべてのブローカー',
      filterProp: 'プロップ口座',
      filterEcn: 'True ECN 専用',
      rankingMetric: '順位基準:',
      winningPips: '獲得純Pips',
      profitAmount: '利益額 ($)',
      profitRate: '利益率 (%)',
      searchPlaceholder: 'トレーダーを検索...',
      allBrokers: 'すべてのブローカー',
      rankCol: '順位',
      traderCol: 'トレーダー & ランク',
      brokerCol: 'ブローカー',
      netPipsCol: '純Pips',
      winRateCol: '勝率',
      tradesCol: '取引数',
      drawdownCol: '最大ドローダウン',
      actionCol: '操作',
      viewAnalytics: '詳細分析を見る',
      liveVerified: '実盤検証済み',
      following: 'フォロー中',
      follow: 'トレーダーをフォロー',
      dailyChampion: '本日の最優秀トレーダー',
      totalDailyPips: '総獲得Pips',
      activeTradersToday: '本日参加者数',
      goldChampion: 'ゴールドチャンピオン',
      silverContender: 'シルバーコンテンダー',
      bronzeMaster: 'ブロンズマスター',
      trades: '回取引',
      estProfit: '推定利益額',
      winRate: '勝率:',
      xp: 'XP:',
      netPips: '純Pips',
      profit: '利益 ($)',
      rate: '利益率',
    },
    community: {
      title: '世界コミュニティ・リアルタイム配信',
      subtitle: '検証済みトレード約定、ランク昇格、バッジ獲得のリアルタイムタイムライン',
      challengeTitle: '5,000 Pips グローバル収穫祭',
      challengeDesc: '全トレーダー協力チャレンジ: 今週全員で合計 5,000 Pips を収穫して、全員に +500 ボーナス XP を解放！',
      coopChallengeTitle: 'コミュニティ協力チャレンジ',
      collectiveHarvest: '全体の収穫状況',
      completed: '達成率',
      endsInDays: '残り {days} 日',
      liveBulletinTitle: 'リアルタイム取引速報 & 応援',
      liveBulletinDesc: 'ブローカー実盤約定、ランキング上昇、バッジ獲得のライブストリーム',
      postPlaceholder: '検証済みの相場見解を共有...',
      postBtn: '投稿',
      allFeed: 'すべての活動',
      liveTradesOnly: '利確トレードのみ',
      filterAll: 'すべての活動',
      filterWins: '利確トレード',
      filterBadges: 'バッジ & 昇格',
      filterTournaments: 'バトル',
      closedTradeText: '決済',
      withPips: '獲得:',
      unlockedBadgeText: '名誉バッジを獲得:',
      climbedRankText: '日次ランキングで上昇:',
      enlistedTournamentText: '大会にエントリー:',
      cheerBtn: '拍手',
      cheersBullish: '強気 [BULL]',
      cheersRocket: '急上昇 [EXP]',
      cheersKing: '覇者 [LEAD]',
      cheersShield: '鉄壁の防衛 [DEF]',
      justNow: 'たった今',
      verifiedExecution: '検証済み約定',
    },
    accounts: {
      title: '連携済み口座一覧',
      connectedAccounts: '連携済み口座一覧',
      activeAccounts: '{count} 口座アクティブ',
      addAccount: '+ 口座を追加',
      noAccounts: '連携された取引口座はまだありません。',
      noAccountsDesc: 'XM、Axiory、Exness、Vantage を連携してください',
      activeFeed: '稼働中フィード',
      accountLabel: '口座番号:',
      serverLabel: 'サーバー:',
      leverageLabel: 'レバレッジ:',
      equityBalance: '有効証拠金 / 残高',
      vaultSecretRef: '暗号化金庫の参照ID',
      disconnectTitle: '口座の連携を解除',
      balance: '口座残高',
      equity: '有効証拠金',
      openPnl: '保有中ポジション損益',
      viewOnly: '閲覧専用フィード',
      syncing: '同期中...',
      disconnectConfirm: 'この口座の連携を解除しますか？',
    },
    positions: {
      title: 'リアルタイム保有ポジション監視',
      liveIngestionFeed: 'リアルタイム保有ポジション監視',
      subSecondStream: 'ミリ秒単位リアルタイムストリーム',
      netFloatingPnl: '合計含み損益:',
      noPositionsTitle: '連携済み口座で保有中のオープンポジションはありません。',
      openTradesCount: '現在保有中のポジション',
      ticketCol: '注文番号',
      instrumentCol: '通貨ペア',
      sideCol: '売買',
      volumeCol: '取引量',
      openPriceCol: '約定価格',
      livePriceCol: '現在価格',
      normalizedPipsCol: '正規化Pips',
      profitUsdCol: '含み損益 (USD)',
      symbol: '通貨ペア',
      type: '売買種別',
      lots: 'ロット数',
      openPrice: '約定価格',
      currentPrice: '現在値',
      pips: '含みPips',
      pnl: '含み損益 ($)',
      noPositions: '保有ポジションはありません。',
      noPositionsDesc: 'MT4/MT5口座で新しいポジションが保有されると、ミリ秒単位のWebSocketで自動表示されます。',
      readOnlyStream: '閲覧専用データストリーム',
    },
    vault: {
      title: 'シークレット金庫・セキュリティ & 監査ログ',
      subtitle: 'TraderRankはすべてのインベスターパスワードとExness APIシークレットを独立したAES-256-GCM暗号化金庫で厳重に隔離しています。',
      vaultTitle: 'シークレット金庫・セキュリティ & 監査ログ',
      aesBadge: 'AES-256-GCM',
      collapseLogs: '監査ログを折りたたむ',
      viewLiveTrail: 'リアルタイム監査ログを表示 ({count})',
      vaultDesc: 'TraderRankはすべてのインベスターパスワードとExness APIシークレットを独立したAES-256-GCM暗号化金庫で厳重に隔離しています。平文のパスワードがログやDB、外部サービスに漏洩することは一切ありません。',
      noLogsYet: '記録された監査イベントはまだありません。',
      blockedStatus: '遮断完了',
      okStatus: '正常',
      architectureTitle: 'ゼロライト・セキュリティ構造',
      immutableNotice: '発注操作の物理的ハードウェア遮断',
      physicalBlockTitle: '発注コマンドの物理的遮断',
      physicalBlockDesc: 'POST /trade/order などの発注系エンドポイントはプロキシ層で完全削除されています。',
      aesEncryptionTitle: 'AES-256-GCM による金庫隔離',
      aesEncryptionDesc: 'すべての認証情報は独立したKMS暗号鍵で暗号化されて保持されます。',
      auditedStatus: 'ゼロライト安全監査済み',
      downloadAuditReport: 'セキュリティ監査報告書 (PDF) をダウンロード',
    },
    profile: {
      title: '検証済みトレーダープロフィール',
      overview: 'パフォーマンス概要',
      globalRankingBadge: '世界順位 #{rank}',
      followingBtn: 'フォロー中',
      followBtn: 'トレーダーをフォロー',
      recentVerifiedExecutions: '直近の検証済み取引履歴',
      verifiedSinceLabel: '認証開始: {date}',
      levelLabel: 'Level {level}',
      netWinningPips: '獲得純Pips',
      winRate: '勝率',
      profitFactor: 'プロフィットファクター',
      maxDrawdown: '最大ドローダウン',
      totalTrades: '総取引回数',
      bestTrade: '最高記録トレード',
      avgHoldingTime: '平均保有時間',
      verifiedSince: '実盤認証開始',
      followTrader: 'トレーダーをフォロー',
      following: 'フォロー中',
      copyDisabledNotice: 'TraderRankは競技用プラットフォームです。ゼロライト安全性を守るため、直接のコピートレード機能は無効化されています。',
    },
    aiModal: {
      title: 'AI マルチタイムフレーム・チャート分析',
      subtitle: '機関投資家のオーダーフロー、スイング構造、モメンタムの合流点をリアルタイム解析',
      multiTfTitle: 'AI マルチタイムフレーム・チャート分析',
      multiTfSubtitle: '機関投資家のオーダーフロー、スイング構造、モメンタムの合流点をリアルタイム解析',
      reScanAi: 'AI 再解析を実行',
      scanningAsset: '{symbol} の 15分・4時間・日足・週足の市場構造を解析中...',
      primaryAiBias: '主要 AI バイアス',
      confluenceScoreLabel: '根拠一致スコア',
      highProbAgreement: '4つの時間軸すべてにおいて高確率で合意',
      riskRewardRatioLabel: 'リスクリワード比',
      swingTargetTp2: 'スイングターゲット (TP2) 基準で算出',
      plotOnChartBtn: 'AI重要水準をチャートに描画',
      plottedOnChartBtn: 'AI水準を描画中',
      multiTfStructureBreakdown: 'マルチタイムフレーム構造詳細',
      tacticalBlueprintTitle: '戦術的エントリー実行ブループリント',
      keyLevelsMatrixTitle: 'マルチ時間軸 重要水準マトリクス',
      institutionalCommentaryTitle: '機関投資家向け AI 市場解説',
      riskFactorsTitle: 'リスク要因 & マクロカタリスト',
      analyzingChart: 'マルチタイムフレームの根拠を統合分析中...',
      confidenceScore: '根拠スコア',
      marketStructure: '市場構造のコンテクスト',
      trendConfluence: 'トレンド合流度',
      keyLevels: '機関投資家水準',
      tradeSetup: '戦術セットアッププラン',
      entry: '最適エントリー帯',
      sl: '損切りポイント (無効化SL)',
      tp: '利確目標 (TP)',
      disclaimer: 'AI分析は学習および戦略モデリングを目的としたものです。ご自身の責任でリスク管理を行ってください。',
    },
    forexCalendar: {
      title: '本日の ForexFactory 重要経済指標 & ニュース要約',
      subtitle: '市場を動かす重要経済指標と中央銀行発表。',
      filterCurrency: '通貨',
      filterImpact: '重要度',
      hidePassed: '終了した指標を隠す',
      highImpactOnly: '最重要指標のみ (赤色フォルダ)',
      redFolders: '赤色フォルダ',
      refreshCalendar: 'カレンダーを更新',
      timeUntil: '発表まで',
      actual: '結果',
      forecast: '予想',
      previous: '前回',
      noEvents: '選択された条件に一致する経済イベントはありません。',
      impactHigh: '最重要指標',
      impactMed: '中重要指標',
      impactLow: '低重要指標',
      impactHoliday: '休場日',
      modalTitle: 'ForexFactory 経済指標カレンダー',
      liveRedFolderFeed: '赤フォルダ速報フィード',
      subtitleDetailed: 'リアルタイムマクロ経済指標、金利政策発表、インフレおよび雇用データ',
      nextHighImpact: '次の最重要指標',
      allEvents: '全イベント',
      highImpact: '最重要',
      mediumImpact: '中重要',
      lowImpact: '低重要',
      hidePast: '過去の指標を隠す',
      currency: '対象通貨:',
      impact: '重要度:',
      ingesting: 'ForexFactory 経済カレンダーを受信中...',
      noEventsMatching: '選択されたフィルター条件に合致する経済イベントはありません。',
      eventsCount: '件のイベント',
      timeCol: '時刻',
      curCol: '通貨',
      impactCol: '重要度',
      eventCol: '指標名',
      actualCol: '結果',
      forecastCol: '予想',
      previousCol: '前回',
      feedActive: 'ForexFactory 経済指標ライブフィード稼働中 • 5分毎自動同期',
      dataSource: '情報源:',
      time: '時間:',
    },
    bulletin: {
      badgeTitle: 'リアルタイム取引速報',
      badgeSubtitle: '実盤約定ライブフィード',
      liveExecution: '実盤約定',
      takeProfit: '利確達成',
      pipsSurge: 'Pips急増',
      newTop10: 'TOP10入り',
      verifiedBridge: '検証済みブリッジ',
      scalpWin: 'スキャル勝利',
      goldRush: 'ゴールドラッシュ',
      londonBreakout: 'ロンドンブレイク',
      swingPullback: 'スイング押し目',
      verifiedDeal: '実盤検証約定',
      weeklyHigh: '週間高値ブレイク',
      tournamentLead: '大会首位',
      m15Pullback: 'M15戻り売り',
      justNow: 'たった今',
      pips: 'pips',
    },
    marketTicker: {
      badgeTitle: 'リアルタイム市場レート',
      badgeSubtitle: '主要取引通貨ペア',
      realApiLive: '● 実APIレート配信中',
      liveEngine: '● リアルタイムエンジン稼働',
      topTradingPairs: '主要取引銘柄',
      spread: 'スプレッド:',
      bid: 'BID(売)',
      ask: 'ASK(買)',
      tagMostTraded: '#1 最多取引銘柄',
      tagAlltick: 'AllTickフィード',
      tagHighMomentum: '高モメンタム',
      tagTopVolatility: '最高利益ボラティリティ',
      tagOanda: 'OANDA / NYMEX実況',
      tagCrypto: '24/7 暗号資産アルファ',
      tagAsiaPac: 'アジア・パシフィック',
      tagCommodityFx: 'コモディティFX',
      tagUsSession: '米国セッション出来高',
    },
    customStudio: {
      modalTitle: 'カスタムインジケーター スタジオ',
      sandboxBadge: 'TradingView サンドボックス',
      modalSubtitle: '独自のPine / JavaScript取引インジケーターを作成・調整・バックテスト',
      tabTemplates: 'プリセットテンプレート',
      tabEditor: 'Pine / JS エディター',
      tabLibrary: 'マイライブラリ',
      tabDocs: 'APIリファレンス & 早見表',
      newIndicatorBtn: '+ 新規インジケーター',
      chooseTemplateTitle: '即座に使える TradingView テンプレートを選択',
      chooseTemplateDesc: '検証済みのモメンタムオシレーター、ボラティリティバンド、スキャルリボンから選択して調整できます。',
      useTemplate: 'テンプレートを使用',
      activeOnChart: 'チャートで有効',
      indicatorName: 'インジケーター名',
      shortLabel: '略称 / コード (例: RSI14)',
      description: '説明',
      chartPane: '描画ペイン',
      mainOverlay: 'メインチャート重ね合わせ',
      subPanel: '個別サブパネル',
      visualStyle: 'プロット形状',
      plotLine: '連続ライン',
      plotHistogram: 'ヒストグラム棒',
      plotDots: 'ドット点',
      colorTheme: 'カラーアクセント',
      lineWidth: '線の太さ',
      parametersTitle: '設定パラメータ',
      addParam: '+ パラメータ追加',
      sourceCodeTitle: 'Pine / JavaScript 実行ロジック',
      testRunBtn: '▶ 診断テスト実行',
      saveApplyBtn: '保存してチャートに適用',
      testPassed: 'コンパイルおよび診断テストに合格しました',
      testFailed: '計算エラーが検出されました',
      dataPoints: '処理データ数',
      range: '出力範囲',
      deleteConfirm: 'インジケーターを削除',
    },
    app: {
      heroSubheading: '複数ブローカー実盤検証済みのFX・コモディティ・暗号資産対戦アリーナ',
      syncing: '同期中...',
      sslVault: '256ビットSSL隔離金庫',
    },
    footer: {
      poweredBy: '運営・提供:',
      companyName: 'Libralytic Co.,Ltd',
      allRightsReserved: '無断転載を禁じます',
      riskDisclaimer: 'FX、コモディティ、暗号資産の取引には重大な元本損失リスクが伴います。TraderRankは100%閲覧専用の実盤検証サービスです。',
      privacyPolicy: 'プライバシーポリシー',
      termsOfService: '利用規約',
      apiDocs: 'API ドキュメント',
      systemStatus: '全システム正常稼働中',
    },
  },

  zh: {
    nav: {
      terminal: '实盘终端',
      landing: '交易之岛',
      overview: '总览看板',
      dailyIntel: '每日交易情报',
      liveCharts: '实时图表 & SMC',
      rankings: '全球排行榜',
      tournaments: '锦标竞技场',
      rewards: '勋章与奖励',
      community: '实盘动态',
      positions: '持仓监控',
      securityVault: '零写入金库',
      connectAccount: '绑定经纪商',
      proLeague: '职业竞技联赛',
      proSubscriber: 'PRO 会员生效中',
      unlockPro: '解锁 Pro 权限 ($9/月)',
      proPlanActive: 'PRO 全功能畅享',
      viewOnlyBadge: '物理只读・不可篡改',
      wsConnected: '实时WS数据流已连接',
      wsConnecting: '正在连接WS数据流...',
      refreshRates: '刷新实时汇率',
      switchView: '切换视图',
      fastConnect: '快捷连接',
    },
    landing: {
      badge: '官方认证多经纪商实盘竞技场',
      heroTitlePrefix: '全球顶尖 ',
      heroTitleAccent: '实盘外汇高手竞技殿堂',
      heroTitleSuffix: '',
      heroSubtitle: '通过 100% 只读投资人密码安全连接 XM、Exness、Axiory、Vantage 及 IC Markets。以纯净点数争夺巅峰排位，角逐实盘奖金锦标赛，解锁每日机构级行情研报。',
      enterArenaBtn: '进入职业竞技场',
      connectBrokerBtn: '绑定经纪商实盘账户',
      exploreChartsBtn: 'SMC 机构图表',
      verifiedPnlBadge: '零写入实盘战绩验真',
      zeroWriteGuarantee: '100% 只读 • 绝无任何资金划转权限的安全承诺',
      liveBrokersCount: '已接入经纪商',
      activeTradersCount: '全球参赛交易员',
      volume24h: '日均标准化交易量',
      topPerformersTitle: '全球实盘权威排行榜',
      topPerformersSubtitle: '通过净点数收割力、胜率稳定性与最大回撤控制，算法标准化跨经纪商真实战绩。',
      tabPips: '净点数收割榜',
      tabProfit: '实盘净收益榜',
      tabWinRate: '高胜率稳健榜',
      rankCol: '排位',
      traderCol: '交易员 & 段位',
      brokerCol: '经纪商行情源',
      gainCol: '点数增益',
      winRateCol: '胜率',
      actionCol: '操作',
      viewProfile: '查看详细战绩',
      feature1Title: '零写入不可篡改安全架构',
      feature1Desc: 'TraderRank 仅需投资人（只读）密码。下单与出金等危险操作在系统底层被物理彻底阻断。',
      feature2Title: '多经纪商标准化算法',
      feature2Desc: '自动消除5位小数报价、不同点差体系与品种命名的差异，打造绝对公平的实盘竞技环境。',
      feature3Title: '机构级每日交易情报 ($9/月)',
      feature3Desc: '每日提供 1:3、1:5、1:7 高盈亏比实盘策略、ForexFactory 重磅新闻深度剖析及机构 SMC 订单块矩阵。',
      feature4Title: '职业级实盘电子竞技锦标赛',
      feature4Desc: '参加5日冲刺赛与30日大师锦标赛，赢取丰厚保底奖金池、赛季经验值 (XP) 与至高荣誉勋章。',
      ctaHeading: '准备好在全球实盘舞台上证明您的顶尖实力了吗？',
      ctaSubtitle: '使用 MT4/MT5 投资人密码 60 秒内极速安全连接。资金绝对零风险。',
      ctaButton: '立即开启实盘竞技场 →',
    },
    intel: {
      title: '每日交易情报决策中心',
      subtitle: '宏观基本面大势、ForexFactory 财经日历深度剖析、机构 SMC 订单块及多周期定制策略研报。',
      todayMarketSummary: '今日市场综述',
      separateFromChart: '独立于实时图表',
      proUnlocked: 'PRO 权限已解锁 ($9/月)',
      unlockProBtn: '以 $9/月 解锁 Pro 权限',
      marketRegime: '今日市场大势',
      headline: '宏观行情研判',
      macroSentimentIndex: '宏观情绪指数',
      sentimentGreed: '极度贪婪 (风险偏好主导)',
      sentimentFear: '极度恐慌 (避险情绪升温)',
      sentimentNeutral: '多空博弈均衡 (区间震荡)',
      forexFactoryNews: 'ForexFactory 重磅财经事件',
      customTimeframeEngine: '定制化时间周期与策略生成器',
      customTimeframeDesc: '选择您偏好的交易时间周期 (1分钟~周线) 与交易模型，即时生成高胜率战术卡。',
      confluenceEngineBadge: 'AI 多周期共振分析引擎',
      assetFocus: '关注资产',
      symbolSelect: '选择交易品种',
      timeframeSelect: '策略时间周期',
      strategicTimeframe: '策略时间周期',
      tradingStyle: '交易风格',
      strategyModel: '策略模型',
      strategyType: '交易策略模型',
      riskRewardTarget: '目标盈亏比 (R:R)',
      rr1_3: '1:3 R:R (标准超短线与日内交易)',
      rr1_5: '1:5 R:R (高确定性 SMC 趋势波段)',
      rr1_7: '1:7 R:R (最大非对称机构级长线波段)',
      sessionWindow: '交易时段',
      sessionFocus: '主攻交易时段',
      accountSizeLabel: '账户净值 ($)',
      accountSize: '1% 风险计算资金规模:',
      generateAnalysis: '生成专属策略方案',
      generateCustomStrategy: '生成每日定制交易策略',
      analyzing: '正在深度整合盘口与 SMC 订单流...',
      synthesizingConfluence: '正在计算多周期共振信号...',
      tradeQualification: '交易准入判定指令',
      tradeSetupQualified: '交易机会合格 • 目标 {targetRR} R:R 验证通过',
      directiveQualified: '准予执行 — 高确定性交易机会',
      directiveDisqualified: '严厉指令: 禁止入场交易',
      doNotEnterTrade: '[HOLD] 暂缓入场交易 • 目标 {targetRR} R:R 盈亏比不足',
      rrTargetsLabel: '盈亏比目标: 1:3 • 1:5 • 1:7',
      findOtherPairs: '寻找具备更高盈亏比共振的其他品种',
      findAnotherPair: '探索其他高共振交易机会 (推荐优选):',
      alternativePairs: '具备更高盈亏比潜力的推荐替代品种:',
      switchScan: '切换并即时扫描',
      confluenceScore: '共振置信度:',
      recommendedAction: '战术执行建议',
      entryZone: '最佳入场区间',
      optimalEntryZone: '最佳入场区间',
      stopLoss: '止损防线 (SL)',
      takeProfit1: '止盈目标 1 (1:3 R:R)',
      takeProfit2: '止盈目标 2 (1:5 R:R)',
      takeProfit3: '止盈目标 3 (1:7 趋势奔跑)',
      riskRewardLots: '盈亏比 & 推荐仓位手数',
      marketStructureContext: '市场结构上下文分析',
      entryTriggerRule: '入场触发前置条件',
      strictInvalidationScenario: '严格结构失效止损场景',
      optimalSessionExecution: '最佳战术执行时段',
      preExecutionChecklist: '交易员入场前必备清单:',
      unlockGeneratorModalTitle: '解锁定制时间周期策略生成器',
      unlockGeneratorModalDesc: '订阅 TraderRank Pro ($9/月) 即可为全部时间周期 (1分、5分、15分、1小时、4小时、日线、周线) 实时生成精确入场区间、止损位与止盈目标。',
      unlockBtn: '以 $9/月 立即解锁',
      forexFactoryReleasesTitle: '今日 ForexFactory 宏观发布与资讯精粹',
      highImpactReleasesToday: '今日共有 {count} 场重磅高影响发布',
      forecast: '预测值:',
      previous: '前值:',
      dailyBreakdownTitle: '每日技术面与基本面品种深度拆解',
      dailyBreakdownDesc: '选择品种以审视机构订单块 (Order Block)、枢轴点及宏观催化剂。',
      liveAnchor: '实时锚定价格:',
      volatility: '波动率预估:',
      technicalMarketStructure: '技术市场结构',
      fundamentalDrivers: '基本面核心驱动',
      institutionalDemandBlock: '机构需求订单块 (SMC 买方区)',
      institutionalSupplyBlock: '机构供给订单块 (阻力卖方区)',
      pivotLevels: '枢轴点水平 (S1 / Pivot / R1)',
      smcKeyLevels: 'SMC 关键水平与订单块',
      orderBlock: '机构订单块 (OB)',
      demandZone: '核心需求区',
      supplyZone: '核心供给区',
      institutionalBias: '机构多空倾向',
      unlockProPrompt: '仅需 $9/月 即可全面解锁每日交易情报研报与全周期定制策略分析。',
      pricePerMonth: '$9 / 月',
      refreshReport: '刷新每日情报',
      macroRegimeTitle: '宏观市场大势',
      highImpactNews: '重磅财经日历',
      riskTolerance: '风险偏好',
      optimalSession: '最佳交易窗口',
      calculatedLotSize: '1% 风险计算仓位手数',
      confluenceFactors: '多因子共振要素',
      invalidationPrice: '结构失效价格',
    },
    chart: {
      liveFeed: '实时市场行情流 (AllTick / OANDA)',
      candlestickStream: '高频 Tick 级数据流',
      selectPair: '选择交易品种',
      timeframe: '时间周期',
      indicators: '技术指标',
      customIndicators: '自定义指标工作室',
      smcOverlay: 'SMC 机构订单流图层',
      bosDetected: 'BOS (结构突破)',
      chocDetected: 'CHoCH (性质转换信号)',
      fairValueGap: 'FVG (合理价值缺口)',
      highPrecision: '5位高精度外汇实盘行情源',
      bid: '买入价 (BID)',
      ask: '卖出价 (ASK)',
      spread: '点差',
      volume: '成交量',
      realtimeTick: '实时跳动',
      aiAnalysisBtn: 'AI智能深度剖析',
      lastPrice: '最新价',
      change24h: '24小时涨跌',
      high24h: '24小时最高',
      low24h: '24小时最低',
      quickIndicators: '快捷指标:',
      createCustomIndicator: '+ 创建自定义指标',
      pineScriptStudio: 'TradingView Pine Script 指标工作室',
      smcSectionTitle: 'Smart Money Concepts (SMC 机构订单流)',
      demandSupplyLabel: '供需区间 (Demand & Supply)',
      demandSupplyDesc: '机构未被消耗的优质订单块 (Order Block)',
      bosLabel: '结构突破 (BOS / CHoCH)',
      bosDesc: '波段摆动分形与结构演变转折点',
      myCustomIndicators: '我的专属指标',
      oscillatorSubPanel: '副图震荡指标面板',
      hideSub: '隐藏副图',
      smcQuickBtn: 'SMC (BOS • 供需区)',
      pineScriptQuickBtn: '+ Pine Script',
      aiMultiTfQuickBtn: 'AI 多周期分析 (15m • 4h • 1D • 1W)',
      forexFactoryQuickBtn: 'ForexFactory 财经日历',
      allTickLiveBadge: 'AllTick 实时行情流连接中 (7天有效凭证)',
      refreshCandles: '刷新K线图表',
      aiLevelsActive: 'AI 关键位 (显示中)',
      aiKeyLevels: 'AI 关键位',
      newsCalendar: '财经日历',
      loadingKLine: '正在加载 AllTick K线数据流...',
      closeSubPanel: '关闭副图面板',
      liveStreamActive: 'MetaApi 经纪商数据流: 实时外汇与黄金行情已连接',
      tokenTrial: 'MetaApi 云经纪商交易账本 (实时)',
      overlayIndicators: '主图叠加指标',
    },
    subscription: {
      modalTitle: 'TraderRank Pro — 每日交易情报全功能特权',
      modalSubtitle: '每日获取机构级实盘策略、1:3 / 1:5 / 1:7 盈亏比判定、SMC 核心订单块及多周期 AI 定制策略。',
      monthlyTier: 'Pro 月度计划',
      monthlyPrice: '$9.00',
      annualTier: 'Pro 年度计划',
      annualPrice: '$79.00',
      annualSavings: '立省 27%',
      perMonth: '/ 月',
      billedAnnually: '按年结算 $79/年 (折合 $6.58/月)',
      billedMonthly: '按月结算 $9/月 (可随时取消)',
      selectPlan: '选择会员级别',
      currentPlan: '当前计划',
      mostPopular: '最受欢迎',
      save27: '立省 27%',
      monthlyDesc: '畅享每日全部市场情报与定制策略生成器。可随时一键退订。',
      annualDesc: '包含全部 Pro 特权，额外获赠优先 Alpha Discord 频道及历史策略档案馆访问权。',
      paymentMethodsTitle: '选择支付方式',
      selectPaymentGateway: '选择支付渠道:',
      creditCard: '信用卡 / 借记卡',
      appleGooglePay: 'Apple / Google Pay',
      cryptoUsdt: '加密货币 (USDT)',
      cardNumber: '卡号',
      cardExpiry: '有效期 (MM/YY)',
      cardCvc: '安全码 (CVC)',
      cardholderName: '持卡人姓名',
      country: '国家 / 地区',
      applePayDesc: '通过您的 Apple Wallet 或 Google Pay 绑定的账户极速安全扣款。',
      payWithAppleGpay: '使用 Pay / GPay 支付 {amount}',
      oneClickCheckout: '一键极速安全结账',
      cryptoNetwork: '选择转账网络',
      sendExactly: '应付准确金额:',
      rateExpiresIn: '汇率锁定剩余时间:',
      depositAddress: '充值接收地址',
      copyAddress: '复制',
      copied: '已复制',
      timerRemaining: '汇率锁定倒计时',
      subtotal: '小计',
      estimatedTax: '预估税费 / VAT (0%)',
      totalDueToday: '今日实付总额',
      sslEncrypted: '256-Bit SSL 银行级加密',
      instantActivationBadge: 'Pro 特权秒级即时生效',
      moneyBackGuarantee: '14 天无理由全额退款保障',
      confirmAndUnlock: '完成支付并立即解锁 Pro 特权',
      processingPayment: '正在处理支付请求...',
      congratsTitle: '欢迎加入 TraderRank Pro',
      congratsSubtitle: '您的 Pro 每日交易情报与多周期定制策略生成器特权已成功激活并完成验真。',
      paymentConfirmedBadge: '支付确认成功 • PRO 特权已激活',
      licenseId: '会员许可密匙 ID',
      subscriptionPlan: '订阅计划:',
      memberLicenseId: '会员许可 ID:',
      nextAutoRenewal: '下次自动续费日期:',
      downloadReceipt: '下载正式发票凭据 (PDF)',
      receiptSaved: '发票凭据已保存！',
      downloadInvoice: '下载账单发票',
      launchIntelBtn: '进入每日交易情报中心',
      openDailyIntelBtn: '打开每日交易情报中心',
      membershipActiveBadge: 'PRO 会员权限生效中',
      membershipActiveDesc: '您已拥有每日交易情报研报、宏观深度剖析与定制策略生成器的完整机构级使用权限。',
      billingRate: '计费费率',
      activationDate: '激活生效时间',
      renewalExpiryDate: '下次续订 / 到期日',
      unlockedFeaturesTitle: '您当前已解锁的尊享功能:',
      resetToFreeMode: '恢复为免费预览模式',
      guaranteeText: '即时激活 • 14 天退款保证 • 随时一键取消。',
      instantActivation: '256-Bit SSL 即时安全激活',
    },
    connector: {
      modalTitle: '选择实盘经纪商',
      modalSubtitle: '选择托管您交易账户的经纪商，系统将自动路由至最佳接入通道。',
      selectBroker: '选择经纪商',
      selectBrokerDesc: '选择托管您交易账户的经纪商，系统将自动路由至最佳接入通道。',
      routeTitle: '{broker} 的接入路径',
      routeDesc: '根据 TraderRank PRD §5.3 路由规范，选择最佳连接通道。',
      exnessNativeTitle: 'Exness 官方原生 API (强烈推荐)',
      exnessNativeDesc: '直连官方 REST & WebSocket 数据流。网关延迟极低，绝无第三方转接费用。',
      mtGatewayTitle: 'MT4/MT5 网关 (备用通道)',
      mtGatewayDesc: '适用于未开通 API 权限的 Exness MT4/MT5 账户标准接入。',
      brokerAgnosticTitle: '多经纪商通用 MT4/MT5 网关',
      brokerAgnosticDesc: '通过云端只读投资人密码桥接，全面支持 {broker}。',
      credentialsTitle: '输入只读凭证信息',
      securityCalloutTitle: '资金绝对安全承诺:',
      securityCalloutDesc: 'TraderRank 严格仅需只读权限。投资人（只读）密码在底层无法进行任何下单或平仓操作。凭证经由 AES-256-GCM 隔离加密存储。',
      platform: '交易平台',
      brokerServer: '服务器名称',
      brokerServerName: '经纪商服务器名称',
      popularServers: 'IC Markets / IC Trading 热门服务器:',
      findIcServer: '查询 IC Markets 服务器 / 开启 Raw 点差账户 (ic.com) →',
      loginId: '账户登录账号',
      accountLoginNumber: '账户账号 / 登录 ID',
      passwordLabel: '投资人密码 (只读)',
      investorPassword: '投资人 (只读) 密码',
      investorPasswordHint: '切勿输入主交易密码。投资人密码保证 100% 只读监控，绝无任何下单权限。',
      neverMasterPassword: '切勿输入主交易密码。请仅提供只读投资人密码。',
      exnessAccountId: 'Exness 账户 ID (选填)',
      exnessApiKey: 'Exness API Key',
      exnessApiSecret: 'Exness Secret Key',
      exnessApiHint: '在 Exness 个人中心完成 KYC Tier-2 认证后，于设置 > API 访问中生成。',
      accountNickname: '账户备注名称',
      diagnosticsTitle: '连接连通性诊断',
      diagnosticsDesc: '在存入数据库前，严格执行同步安全只读测试调用。',
      pingingBroker: '正在探测经纪商服务器并校验只读权限...',
      preflightPassedTitle: '预检连接测试通过',
      connectionFailedTitle: '连接失败',
      brokerLabel: '经纪商:',
      integrationLabel: '接入通道:',
      accountLabel: '账户账号:',
      balanceLabel: '账户余额:',
      equityLabel: '账户净值:',
      leverageLabel: '杠杆比例:',
      editCredentials: '修改凭证',
      confirmIngestTrades: '确认并同步历史战绩',
      persistingToVault: '正在加密存入安全金库...',
      connectBtn: '验证并连接账户',
      connecting: '正在建立安全云端桥接...',
      connectedSuccess: '实盘账户连接成功！',
      zeroWriteTitle: '零写入不可篡改安全保障',
      zeroWriteDesc: 'TraderRank 严格作为只读观察者运作。下单、修改订单及出金指令在系统底层已被物理彻底阻断。',
      readOnlyAudited: '零写入安全架构通过权威验真',
      disconnectAccount: '解除账户绑定并彻底销毁凭证',
      activePositionsCount: '当前持仓笔数',
      accountBalance: '账户余额',
      accountEquity: '实时净值',
      runPreflight: '执行安全预检诊断',
      preflightChecking: '正在校验只读权限...',
      preflightPassed: '预检通过 — 只读权限验真成功',
      stepBroker: '1. 选择经纪商',
      stepCredentials: '2. 填写凭证',
      stepVerification: '3. 预检测试',
      stepComplete: '4. 完成绑定',
      nextStep: '下一步: 填写凭证 →',
      backStep: '返回',
    },
    dailyBest: {
      spotlight: '每日点数之星・实盘焦点',
      window: '24小时跨经纪商实盘窗口',
      traderOfTheDay: '今日最佳交易员',
      subtitle: '今日在 XM、Axiory、Exness 与 Vantage 全网斩获最高净点数的冠军交易员',
      rollover: '距离日结算:',
      hideHallOfFame: '收起名人堂',
      dailyChampions: '历届日冠',
      dailyCrown: '日冠桂冠',
      platformsTraded: '实盘交易平台:',
      winRate: '胜率:',
      trades: '笔交易',
      todayNetGain: '今日实盘净点数',
      pips: 'pips',
      closed: '已平仓:',
      float: '浮动盈亏:',
      noTrades: '今日交易时段暂未记录到有效实盘点数。',
      totalPipsGenerated: '全网交易员今日累计收获点数:',
      activeCompeting: '今日活跃参赛交易员:',
      hallOfFameTitle: '荣誉殿堂 — 历届日度最佳交易员',
    },
    arena: {
      tournamentsTitle: '实盘电子竞技锦标赛',
      tournamentsSubtitle: '与全球验证的 MT4/MT5 实盘交易员角逐大奖、至高声誉与真实业绩记录。',
      liveContests: '正在进行的竞技场',
      upcomingContests: '即将开赛的锦标赛',
      prizePool: '奖金池',
      participants: '参赛选手',
      timeLeft: '剩余时间',
      joinArena: '进入锦标赛竞技场',
      registered: '已报名参赛',
      dailyChampionTitle: '每日点数之王',
      dailyChampionPips: '单日净点数',
      badgesTitle: '成就勋章与段位荣耀',
      communityFeedTitle: '全球实盘动态流',
      liveTradeFeed: '实时成交快讯',
      weeklySprint: '每周 FX 极速冲刺联赛',
      weeklySprintTag: '周度冲刺赛',
      weeklySprintDesc: '面向EUR、GBP及黄金交易者的5天极速冲刺赛。前3名可获得美元奖金与等级提升。',
      sprintDays: '周一 – 周五',
      monthlyChampionship: '每月 Apex 职业大师锦标赛',
      monthlyChampionshipTag: '月度冠军锦标赛',
      monthlyChampionshipDesc: '旗舰级耐力排位大赛。结合净点数与夏普比率稳定性的多维度量化评分。',
      monthlyDuration: '30天耐力排位赛',
      globalGoldRushTitle: '全球淘金大师锦标赛',
      globalGoldRushSubtitle: '专注XAUUSD黄金与贵金属的高精度竞技排位赛',
      tokyoLondonOverlapTitle: '东京-伦敦重叠时段极速赛',
      tokyoLondonOverlapSubtitle: '针对GBP与EUR货币对的8小时紧凑时段排位赛',
      maxDailyLoss: '每日最大允许亏损',
      maxTrailingDD: '最大动态回撤',
      minTradesReq: '资格认证最低交易笔数',
      freeEntry: '免费参赛',
      liveBattleBadge: '激烈对决中',
      antiGamblingRules: '杜绝赌徒机制的机构级风控准则',
      maxDailyLossDesc: '净值单日亏损',
      maxTrailingDDDesc: '峰值动态回撤',
      minTradesDesc: '笔成交即可参评',
      scoringSystem: '评分机制',
      scoringFormula: '标准化净点数 × 胜率',
      scoringSystemDesc: '标准化净点数 × 胜率',
      tradesToQualify: '达标交易次数',
      peakDD: '峰值动态回撤',
      equityLoss: '净值亏损',
      standingsTitle: '实时排位表与奖金名次',
      disqualifiedBadge: '风控违规失格',
      enteredTracking: '已参赛 (数据追踪中)',
      enterTournament: '报名参加锦标赛',
      battleEndsIn: '距离赛事结束:',
      estimatedPrize: '预估奖励',
      netPips: '净点数',
    },
    rewards: {
      title: '交易员段位、经验值 (XP) 与荣誉勋章',
      subtitle: '通过严格风控、超高胜率与锦标赛领奖台排名，解锁官方实盘验证成就勋章。',
      currentTier: '市场老将',
      levelTrader: 'LEVEL 3 交易员',
      currentXp: '当前累计经验值',
      progressTo: '距离升级至 Level 4: Apex Predator',
      xpRemaining: '升级尚需经验值',
      dailyStreakTitle: '连续实盘打卡奖励',
      streakActive: '已连续保持 4 天活跃',
      claimBtn: '领取 +200 XP',
      claimed: '已领取',
      active: '当前活跃',
      locked: '未解锁',
      verified: '已验证',
      seasonal: '赛季专属',
      mysteryBadge: '神秘宝箱徽章',
      dayLabel: '第天',
      honorBadgesTitle: '实盘荣誉勋章与成就',
      honorBadgesSubtitle: '通过低回撤、严谨执行力及锦标赛夺冠赢取荣誉勋章',
      unlockedCount: '已解锁勋章',
      rarityCommon: '普通',
      rarityRare: '稀有',
      rarityEpic: '史诗',
      rarityLegendary: '传奇',
      badgeModalTitle: '勋章详情与解锁要求',
      howToUnlock: '解锁方式',
      rewardBonus: '奖励加成',
      closeBtn: '关闭',
      toastClaimed: '打卡奖励领取成功！+200 XP 已存入。',
      exploreRewardsBtn: '查看勋章中心',
      badgeRiskGuardianName: '风险守护者',
      badgeRiskGuardianDesc: '以低于2.0%的最大回撤完赛5天锦标赛。',
      badgeRiskGuardianCriteria: '经认证在5天交易中最大追踪回撤严格控制在2.00%以内。',
      badgePrecisionSniperName: '精准狙击手',
      badgePrecisionSniperDesc: '在至少10笔已平仓交易中实现70%以上的胜率。',
      badgePrecisionSniperCriteria: '在实盘认证数据中完成10笔以上交易且胜率超过70.0%。',
      badgeCenturyClubName: '百点俱乐部',
      badgeCenturyClubDesc: '在单周交易内累计斩获100点以上的标准化净点数。',
      badgeCenturyClubCriteria: '在周一00:00至周五23:59 UTC之间累计斩获100.0点以上标准化净点数。',
      badgePodiumMasterName: '领奖台大师',
      badgePodiumMasterDesc: '在官方认证的交易锦标赛中斩获前3名。',
      badgePodiumMasterCriteria: '在任意专业竞技场大赛最终排行榜中获得第1、2或3名。',
      badgeHallOfFameName: '名人堂泰坦',
      badgeHallOfFameDesc: '荣登历史传奇排行榜并加冕赛季总冠军。',
      badgeHallOfFameCriteria: '在为期90天的竞技交易赛季结算时荣登全球第1名。',
      badgeIronDisciplineName: '钢铁纪律',
      badgeIronDisciplineDesc: '连续30笔交易零违规（严格执行止损、杜绝报复性交易且单笔风险≤2%）。',
      badgeIronDisciplineCriteria: '连续30笔交易强制设置止损、拒绝情绪化交易且单笔风险上限2%。',
      tierNovice: '新手交易员',
      tierProSwing: '专业波段交易员',
      tierMarketVeteran: '市场老将',
      tierApexPredator: 'Apex 顶级掠食者',
      tierHallOfFame: '名人堂泰坦',
      prestigeBadge: '声望勋章',
      yesterday: '昨天',
      daysAgo: '3天前',
      lastWeek: '上周',
      clickToInspect: '点击查看解锁条件',
    },
    leaderboard: {
      title: '全球实盘权威排行榜',
      subtitle: '基于纯粹交易技能与标准化点数的跨经纪商实盘英雄榜',
      allTimeTab: '历史传奇',
      todayTab: '每日冲刺',
      weekTab: '每周联赛',
      dailySprint: '每日冲刺',
      weeklyLeague: '每周联赛',
      allTimeLegends: '历史传奇',
      filterAll: '全部经纪商',
      filterProp: 'Prop 挑战账户',
      filterEcn: 'True ECN 原生点差',
      rankingMetric: '排序维度:',
      winningPips: '盈利净点数',
      profitAmount: '盈利金额 ($)',
      profitRate: '收益率 (%)',
      searchPlaceholder: '搜索交易员...',
      allBrokers: '全部经纪商',
      rankCol: '排位',
      traderCol: '交易员 & 段位',
      brokerCol: '经纪商行情源',
      netPipsCol: '净点数',
      winRateCol: '胜率',
      tradesCol: '交易笔数',
      drawdownCol: '最大回撤',
      actionCol: '操作',
      viewAnalytics: '查看详细分析',
      liveVerified: '官方验真',
      following: '已关注',
      follow: '关注交易员',
      dailyChampion: '今日最佳交易员',
      totalDailyPips: '全网累计点数',
      activeTradersToday: '今日活跃交易员',
      goldChampion: '金牌冠军',
      silverContender: '银牌强者',
      bronzeMaster: '铜牌大师',
      trades: '笔交易',
      estProfit: '预估收益',
      winRate: '胜率:',
      xp: 'XP:',
      netPips: '净点数',
      profit: '收益 ($)',
      rate: '收益率',
    },
    community: {
      title: '全球实盘动态流',
      subtitle: '全网实盘平仓、排位跃升及荣誉勋章解锁的实时动态',
      challengeTitle: '5,000 点数全球联合收割挑战',
      challengeDesc: '全员交易员集结: 本周全网合力收割 5,000 净点数，为所有参赛者解锁 +500 赛季奖励 XP！',
      coopChallengeTitle: '社区联合收割挑战',
      collectiveHarvest: '全网累计收割进度',
      completed: '完成度',
      endsInDays: '距离结束尚有 {days} 天',
      liveBulletinTitle: '实时成交快讯与喝彩',
      liveBulletinDesc: '经纪商实盘成交、排位攀升及勋章解锁的实时动态流',
      postPlaceholder: '分享您对当前行情的实盘洞见...',
      postBtn: '发布',
      allFeed: '全部动态',
      liveTradesOnly: '仅看盈利平仓',
      filterAll: '全部动态',
      filterWins: '盈利平仓',
      filterBadges: '勋章与晋升',
      filterTournaments: '锦标赛事',
      closedTradeText: '成功平仓',
      withPips: '斩获点数:',
      unlockedBadgeText: '成功解锁荣誉勋章:',
      climbedRankText: '每日排行榜排位晋升至:',
      enlistedTournamentText: '报名参赛:',
      cheerBtn: '喝彩',
      cheersBullish: '看涨 [BULL]',
      cheersRocket: '强势突破 [EXP]',
      cheersKing: '领航 [LEAD]',
      cheersShield: '防守大师 [DEF]',
      justNow: '刚刚',
      verifiedExecution: '官方实盘验真',
    },
    accounts: {
      title: '已连接实盘账户',
      connectedAccounts: '已连接实盘账户',
      activeAccounts: '{count} 个活跃',
      addAccount: '+ 绑定新账户',
      noAccounts: '暂未绑定任何实盘账户。',
      noAccountsDesc: '支持连接 XM、Axiory、Exness 及 Vantage',
      activeFeed: '活跃数据流',
      accountLabel: '账户账号:',
      serverLabel: '服务器:',
      leverageLabel: '杠杆比例:',
      equityBalance: '净值 / 余额',
      vaultSecretRef: '安全金库引用标识',
      disconnectTitle: '解除账户绑定',
      balance: '账户余额',
      equity: '实时净值',
      openPnl: '持仓浮动盈亏',
      viewOnly: '只读数据流',
      syncing: '同步中...',
      disconnectConfirm: '确认从 TraderRank 解除此账户绑定？',
    },
    positions: {
      title: '实时持仓监控流',
      liveIngestionFeed: '实时持仓监控流',
      subSecondStream: '亚秒级实时推送',
      netFloatingPnl: '总持仓浮动盈亏:',
      noPositionsTitle: '已连接账户当前无任何未平仓订单。',
      openTradesCount: '当前未平仓订单',
      ticketCol: '订单号',
      instrumentCol: '交易品种',
      sideCol: '方向',
      volumeCol: '手数',
      openPriceCol: '开仓价',
      livePriceCol: '最新价',
      normalizedPipsCol: '标准化点数',
      profitUsdCol: '浮动盈亏 (USD)',
      symbol: '交易品种',
      type: '方向',
      lots: '手数',
      openPrice: '开仓价',
      currentPrice: '最新价',
      pips: '浮动点数',
      pnl: '浮动盈亏 ($)',
      noPositions: '暂无未平仓订单。',
      noPositionsDesc: '当您在 MT4/MT5 账户开仓时，最新持仓将通过亚秒级 WebSocket 自动在此呈现。',
      readOnlyStream: '物理只读数据流',
    },
    vault: {
      title: '安全金库与审计日志',
      subtitle: 'TraderRank 将所有投资人密码与 Exness API 密钥隔离存储于专用 AES-256-GCM 安全金库中。',
      vaultTitle: '安全金库与审计日志',
      aesBadge: 'AES-256-GCM',
      collapseLogs: '收起审计日志',
      viewLiveTrail: '查看实时金库审计日志 ({count})',
      vaultDesc: 'TraderRank 将所有投资人密码与 Exness API 密钥隔离存储于专用 AES-256-GCM 安全金库中。绝无任何明文密码会被记录、存入数据库或泄露给下游服务。',
      noLogsYet: '暂无任何审计日志记录。',
      blockedStatus: '已被拦截',
      okStatus: '正常',
      architectureTitle: '零写入安全架构',
      immutableNotice: '物理阻断所有下单指令',
      physicalBlockTitle: '物理阻断交易执行指令',
      physicalBlockDesc: '网关代理层已彻底剥离 POST /trade/order 等所有写入端点，仅开放只读数据抓取。',
      aesEncryptionTitle: 'AES-256-GCM 独立金库隔离',
      aesEncryptionDesc: '所有凭据均采用独立 KMS 密钥进行静态与内存双重加密。',
      auditedStatus: '零写入安全架构通过严格验真',
      downloadAuditReport: '下载安全审计报告 (PDF)',
    },
    profile: {
      title: '官方验真实盘档案',
      overview: '战绩全景总览',
      globalRankingBadge: '全球排位 #{rank}',
      followingBtn: '已关注',
      followBtn: '关注交易员',
      recentVerifiedExecutions: '近期验证成交记录',
      verifiedSinceLabel: '验真起始时间: {date}',
      levelLabel: 'Level {level}',
      netWinningPips: '净盈利点数',
      winRate: '胜率',
      profitFactor: '盈利因子 (PF)',
      maxDrawdown: '最大回撤',
      totalTrades: '总交易笔数',
      bestTrade: '单笔最佳盈利',
      avgHoldingTime: '平均持仓时间',
      verifiedSince: '实盘认证时间',
      followTrader: '关注交易员',
      following: '已关注',
      copyDisabledNotice: 'TraderRank 为纯粹的竞技与战绩展示平台。为确保资金绝对零风险，跟单功能已在底层被物理禁用。',
    },
    aiModal: {
      title: 'AI 多周期图表智能剖析',
      subtitle: '实时算法综合扫描机构订单流、波段摆动结构与动量多重共振',
      multiTfTitle: 'AI 多周期图表智能剖析',
      multiTfSubtitle: '实时算法综合扫描机构订单流、波段摆动结构与动量多重共振',
      reScanAi: '重新执行 AI 扫描',
      scanningAsset: '正在综合分析 {symbol} 的 15分、4小时、日线及周线市场结构...',
      primaryAiBias: '主要 AI 多空倾向',
      confluenceScoreLabel: '共振置信度',
      highProbAgreement: '在全部 4 个时间周期维度均达成高概率共识',
      riskRewardRatioLabel: '盈亏比 (R:R)',
      swingTargetTp2: '按波段目标位 (TP2) 计算',
      plotOnChartBtn: '在图表上标绘 AI 关键位',
      plottedOnChartBtn: '已在图表上标绘 AI 关键位',
      multiTfStructureBreakdown: '多周期结构深度拆解',
      tacticalBlueprintTitle: '战术执行蓝图方案',
      keyLevelsMatrixTitle: '多周期核心点位矩阵',
      institutionalCommentaryTitle: '机构级 AI 市场研判述评',
      riskFactorsTitle: '风险因素与宏观催化剂',
      analyzingChart: '正在深度计算多周期共振信号...',
      confidenceScore: '共振置信度',
      marketStructure: '市场结构上下文',
      trendConfluence: '趋势共振度',
      keyLevels: '机构级关键点位',
      tradeSetup: '战术方案蓝图',
      entry: '最佳入场区间',
      sl: '止损防线 (SL)',
      tp: '止盈目标 (TP)',
      disclaimer: 'AI 研报仅供学习研究与战略建模参考，请务必严格做好自身风控管理。',
    },
    forexCalendar: {
      title: '今日 ForexFactory 宏观发布与资讯精粹',
      subtitle: '驱动行情走势的重磅财经事件与央行发布。',
      filterCurrency: '货币筛选',
      filterImpact: '影响级别',
      hidePassed: '隐藏已结束事件',
      highImpactOnly: '仅看重磅 (红色文件夹)',
      redFolders: '红色文件夹',
      refreshCalendar: '刷新日历数据',
      timeUntil: '距离发布',
      actual: '今值',
      forecast: '预测',
      previous: '前值',
      noEvents: '未查询到符合筛选条件的财经事件。',
      impactHigh: '重磅事件',
      impactMed: '中度影响',
      impactLow: '低度影响',
      impactHoliday: '银行休市',
      modalTitle: 'ForexFactory 财经日历',
      liveRedFolderFeed: '重磅红标实时速递',
      subtitleDetailed: '实时宏观经济事件、央行利率决议、通胀与非农就业数据',
      nextHighImpact: '下一重磅事件',
      allEvents: '全部事件',
      highImpact: '重磅影响',
      mediumImpact: '中度影响',
      lowImpact: '低度影响',
      hidePast: '隐藏已发布事件',
      currency: '货币筛选:',
      impact: '影响等级:',
      ingesting: '正在接入 ForexFactory 财经日历...',
      noEventsMatching: '暂无符合筛选条件的财经事件。',
      eventsCount: '项事件',
      timeCol: '时间',
      curCol: '货币',
      impactCol: '影响',
      eventCol: '事件内容',
      actualCol: '今值',
      forecastCol: '预测',
      previousCol: '前值',
      feedActive: 'ForexFactory 实时财经数据流在线 • 5分钟自动同步',
      dataSource: '数据源:',
      time: '时间:',
    },
    bulletin: {
      badgeTitle: '实时成交快讯',
      badgeSubtitle: '实盘平仓数据流',
      liveExecution: '实盘成交',
      takeProfit: '止盈平仓',
      pipsSurge: '点数暴增',
      newTop10: '跻身前十',
      verifiedBridge: '验真数据桥',
      scalpWin: '超短胜利',
      goldRush: '淘金狂潮',
      londonBreakout: '伦敦突破',
      swingPullback: '波段回撤入场',
      verifiedDeal: '实盘验真成交',
      weeklyHigh: '突破周度新高',
      tournamentLead: '联赛领跑',
      m15Pullback: 'M15回调做空',
      justNow: '刚刚',
      pips: '点',
    },
    marketTicker: {
      badgeTitle: '市场实时报价',
      badgeSubtitle: '热门交易品种',
      realApiLive: '● 真实 API 实时汇率',
      liveEngine: '● 实时行情引擎运作中',
      topTradingPairs: '热门交易品种',
      spread: '点差:',
      bid: '买价(BID)',
      ask: '卖价(ASK)',
      tagMostTraded: '#1 最热门交易品种',
      tagAlltick: 'AllTick 实时源',
      tagHighMomentum: '强劲动量',
      tagTopVolatility: '最高盈利波动',
      tagOanda: 'OANDA / NYMEX 实况',
      tagCrypto: '24/7 加密 Alpha',
      tagAsiaPac: '亚太锚点品种',
      tagCommodityFx: '商品外汇',
      tagUsSession: '美盘主力成交量',
    },
    customStudio: {
      modalTitle: '自定义指标工作室',
      sandboxBadge: 'TradingView 沙盒',
      modalSubtitle: '编写、调试并回测专属 Pine / JavaScript 交易指标',
      tabTemplates: '预设模板库',
      tabEditor: 'Pine / JS 编辑器',
      tabLibrary: '我的指标库',
      tabDocs: 'API 文档与参考速查',
      newIndicatorBtn: '+ 新建指标',
      chooseTemplateTitle: '选择开箱即用的 TradingView 模板',
      chooseTemplateDesc: '从经过实盘检验的动量震荡、波动通道和剥头皮色带模板中自由选择与定制。',
      useTemplate: '应用此模板',
      activeOnChart: '图表已启用',
      indicatorName: '指标名称',
      shortLabel: '简短标识 (如 RSI14)',
      description: '描述说明',
      chartPane: '绘图窗格',
      mainOverlay: '主图叠加',
      subPanel: '独立副图',
      visualStyle: '绘图样式',
      plotLine: '平滑曲线',
      plotHistogram: '柱状图',
      plotDots: '散点图',
      colorTheme: '配色方案',
      lineWidth: '线条粗细',
      parametersTitle: '可配置输入参数',
      addParam: '+ 添加参数',
      sourceCodeTitle: 'Pine / JavaScript 执行逻辑',
      testRunBtn: '▶ 运行诊断测试',
      saveApplyBtn: '保存并应用至图表',
      testPassed: '编译与诊断测试通过',
      testFailed: '检测到计算异常',
      dataPoints: '处理数据点数',
      range: '输出范围',
      deleteConfirm: '删除指标',
    },
    app: {
      heroSubheading: '支持多经纪商实盘验真的外汇、大宗商品及加密竞技排位殿堂',
      syncing: '正在同步...',
      sslVault: '256位 SSL 隔离金库',
    },
    footer: {
      poweredBy: '运营与技术支持:',
      companyName: 'Libralytic Co.,Ltd',
      allRightsReserved: '保留所有权利',
      riskDisclaimer: '外汇、大宗商品及加密资产交易存在重大本金损失风险。TraderRank 仅提供 100% 只读实盘验真服务。',
      privacyPolicy: '隐私权政策',
      termsOfService: '服务条款',
      apiDocs: 'API 接口文档',
      systemStatus: '全系统 100% 正常运转',
    },
  },
};
