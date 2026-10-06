import React, { useState, useEffect } from 'react';
import {
  SubscriptionTier,
  SubscriptionStatus,
} from '../../../shared/src/types.ts';
import { useTranslation } from '../context/LanguageContext.tsx';
import {
  Crown,
  CheckCircle2,
  ShieldCheck,
  Zap,
  CreditCard,
  X,
  ArrowRight,
  Copy,
  Check,
  Clock,
  Lock,
  Download,
  Coins,
  QrCode,
  TrendingUp,
} from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: SubscriptionStatus;
  onSubscriptionChange: (sub: SubscriptionStatus) => void;
  onNavigateToDailyIntel?: () => void;
}

type CryptoNetwork = 'USDT_TRC20' | 'USDT_ERC20' | 'USDT_ARBITRUM' | 'USDT_SOLANA' | 'BTC';

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  subscription,
  onSubscriptionChange,
  onNavigateToDailyIntel,
}) => {
  const { t } = useTranslation();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('PRO_MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'APPLE_PAY' | 'CRYPTO'>('CARD');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoNetwork>('USDT_TRC20');
  
  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const [billingCountry, setBillingCountry] = useState('US');

  // Interactive UI State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [isSuccessCelebration, setIsSuccessCelebration] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [cryptoTimerSeconds, setCryptoTimerSeconds] = useState(900); // 15 minutes
  const [receiptDownloaded, setReceiptDownloaded] = useState(false);

  // Crypto Deposit Addresses Map
  const cryptoWallets: Record<CryptoNetwork, { label: string; network: string; address: string; amount: string }> = {
    USDT_TRC20: {
      label: 'USDT (TRC-20)',
      network: 'Tron TRC-20 (Instant 0% Fee)',
      address: 'TYN8m4KxK1Jz2Q9Z8Xp9wY5mVt3Ls7BaRt',
      amount: selectedTier === 'PRO_ANNUAL' ? '79.00 USDT' : '9.00 USDT',
    },
    USDT_ERC20: {
      label: 'USDT (ERC-20)',
      network: 'Ethereum Mainnet',
      address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      amount: selectedTier === 'PRO_ANNUAL' ? '79.00 USDT' : '9.00 USDT',
    },
    USDT_ARBITRUM: {
      label: 'USDT (Arbitrum One)',
      network: 'Arbitrum L2 (Low Gas)',
      address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      amount: selectedTier === 'PRO_ANNUAL' ? '79.00 USDT' : '9.00 USDT',
    },
    USDT_SOLANA: {
      label: 'USDT (Solana SPL)',
      network: 'Solana High Speed',
      address: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
      amount: selectedTier === 'PRO_ANNUAL' ? '79.00 USDT' : '9.00 USDT',
    },
    BTC: {
      label: 'Bitcoin (BTC)',
      network: 'Bitcoin Native SegWit',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      amount: selectedTier === 'PRO_ANNUAL' ? '0.00084 BTC' : '0.000096 BTC',
    },
  };

  // 15-minute countdown for crypto rates
  useEffect(() => {
    if (!isOpen || paymentMethod !== 'CRYPTO') return;
    const interval = setInterval(() => {
      setCryptoTimerSeconds(prev => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, paymentMethod]);

  if (!isOpen) return null;

  // Format Card Number input with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  // Format Expiry MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2, 4)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  // Copy crypto address to clipboard
  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // Execute Subscription Activation
  const handleCompletePayment = async () => {
    setIsProcessing(true);
    setProcessingStage('Connecting to 256-bit secure gateway...');

    try {
      await new Promise(r => setTimeout(r, 600));
      setProcessingStage('Verifying authorization & issuing Pro license...');
      await new Promise(r => setTimeout(r, 600));
      setProcessingStage('Unlocking Daily Intelligence & AI Multi-Timeframe Engine...');

      const methodLabel =
        paymentMethod === 'CARD'
          ? `Card •••• ${cardNumber.slice(-4) || '4242'}`
          : paymentMethod === 'APPLE_PAY'
          ? 'Apple Pay'
          : `Crypto (${selectedCrypto})`;

      const res = await fetch('/api/subscription/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          paymentMethod: methodLabel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newSub: SubscriptionStatus = data.subscription;
        localStorage.setItem('traderrank_sub_status_v1', JSON.stringify(newSub));
        onSubscriptionChange(newSub);
        setIsProcessing(false);
        setIsSuccessCelebration(true);
      }
    } catch (err) {
      console.error('Subscription error', err);
      setIsProcessing(false);
    }
  };

  // Switch back to Free mode
  const handleCancelSubscription = () => {
    const freeSub: SubscriptionStatus = {
      isActive: false,
      tier: 'FREE',
      planName: 'Free Account',
      priceMonthly: 0,
      startedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      features: ['Standard Leaderboard Viewing', 'Basic Charts'],
    };
    localStorage.setItem('traderrank_sub_status_v1', JSON.stringify(freeSub));
    onSubscriptionChange(freeSub);
    onClose();
  };

  // Download Simulated Receipt / Invoice
  const handleDownloadInvoice = () => {
    const invoiceContent = `=====================================================
TRADERRANK PRO INTELLIGENCE - PAYMENT RECEIPT & INVOICE
=====================================================
Receipt ID:       TR-INV-${Date.now().toString().slice(-8)}
Customer Status:  ACTIVE PRO SUBSCRIBER
Plan:             ${selectedTier === 'PRO_ANNUAL' ? 'Pro Annual ($79.00 / year)' : 'Pro Monthly ($9.00 / month)'}
Amount Paid:      ${selectedTier === 'PRO_ANNUAL' ? '$79.00 USD' : '$9.00 USD'}
Tax / VAT (0%):   $0.00 USD
Payment Method:   ${paymentMethod === 'CARD' ? 'Credit Card' : paymentMethod === 'APPLE_PAY' ? 'Apple Pay' : 'Cryptocurrency TRC20'}
Billing Period:   30 Days Auto-Renewing
Status:           PAID & VERIFIED (256-BIT SSL)

INCLUDED FEATURES:
- Daily Technical & Fundamental Intelligence Highlights
- ForexFactory High-Impact Economic News Breakdown
- Custom Strategic Timeframe Confluence Engine (1m - 1W)
- Smart Money Concepts (SMC) Institutional Order Blocks
- High-Probability Entry Zones, Invalidation SL & TP Targets
- Live Market Feeds (EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CAD, Gold, Oil MCL1!, BTC)

Thank you for subscribing to TraderRank Pro.
Libralytic Co.,Ltd / TraderRank FX Global Trading Platform.
=====================================================`;

    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TraderRank_Pro_Receipt_${Date.now().toString().slice(-6)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setReceiptDownloaded(true);
    setTimeout(() => setReceiptDownloaded(false), 3000);
  };

  // Formatted countdown timer string
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isAnnual = selectedTier === 'PRO_ANNUAL';
  const totalAmount = isAnnual ? '$79.00' : '$9.00';
  const recurringNote = isAnnual ? t.subscription.billedAnnually : t.subscription.billedMonthly;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1000 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '820px',
          width: '95%',
          background: 'linear-gradient(180deg, #111e22 0%, #0d1518 100%)',
          border: '1px solid rgba(10, 186, 181, 0.4)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.85), 0 0 50px rgba(10, 186, 181, 0.2)',
          borderRadius: '18px',
          padding: '28px 32px',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Close Modal"
        >
          <X size={18} />
        </button>

        {/* ======================================================== */}
        {/* VIEW 1: SUCCESS CELEBRATION SCREEN (POST-PURCHASE)       */}
        {/* ======================================================== */}
        {isSuccessCelebration ? (
          <div style={{ textAlign: 'center', padding: '20px 10px' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(10, 186, 181, 0.25) 0%, rgba(129, 216, 208, 0.25) 100%)',
                border: '2px solid var(--accent-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                boxShadow: '0 0 30px rgba(10, 186, 181, 0.4)',
              }}
            >
              <Crown size={40} color="#ffd700" />
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 14px',
                borderRadius: '16px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--accent-green)',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              <CheckCircle2 size={15} />
              <span>{t.subscription.paymentConfirmedBadge}</span>
            </div>

            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', margin: '0 0 10px 0' }}>
              {t.subscription.congratsTitle}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '540px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
              {t.subscription.congratsSubtitle}
            </p>

            {/* Receipt Summary Card */}
            <div
              style={{
                background: 'rgba(0,0,0,0.4)',
                borderRadius: '14px',
                padding: '20px',
                border: '1px solid rgba(10, 186, 181, 0.3)',
                maxWidth: '560px',
                margin: '0 auto 24px auto',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.subscription.subscriptionPlan}</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                  {isAnnual ? 'Pro Annual ($79.00 / yr)' : 'Pro Monthly ($9.00 / mo)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.subscription.memberLicenseId}</span>
                <span style={{ fontSize: '13px', fontFamily: 'monospace', color: '#fff' }}>
                  TR-PRO-{Math.floor(100000 + Math.random() * 900000)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t.subscription.nextAutoRenewal}</span>
                <span style={{ fontSize: '13px', color: '#e2e8f0' }}>
                  {new Date(Date.now() + (isAnnual ? 365 : 30) * 86400000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Unlocked Features Mini Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                  <Check size={14} color="var(--accent-green)" />
                  <span>Custom Strategy Timeframes (1m-1W)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                  <Check size={14} color="var(--accent-green)" />
                  <span>SMC Unmitigated Order Blocks</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                  <Check size={14} color="var(--accent-green)" />
                  <span>Daily ForexFactory News Catalysts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                  <Check size={14} color="var(--accent-green)" />
                  <span>1% Risk Lot Sizing Calculator</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  if (onNavigateToDailyIntel) {
                    onNavigateToDailyIntel();
                  } else {
                    onClose();
                  }
                }}
                style={{
                  padding: '14px 28px',
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
                  boxShadow: '0 4px 25px rgba(10, 186, 181, 0.4)',
                }}
              >
                <span>{t.subscription.launchIntelBtn}</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={handleDownloadInvoice}
                style={{
                  padding: '14px 20px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <Download size={15} />
                <span>{receiptDownloaded ? t.subscription.receiptSaved : t.subscription.downloadReceipt}</span>
              </button>
            </div>
          </div>
        ) : subscription.isActive ? (
          /* ======================================================== */
          /* VIEW 2: ACTIVE SUBSCRIBER MANAGEMENT DASHBOARD           */
          /* ======================================================== */
          <div style={{ padding: '10px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  background: 'rgba(10, 186, 181, 0.15)',
                  border: '1px solid var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '12px',
                }}
              >
                <Crown size={16} color="#ffd700" />
                <span>{t.subscription.membershipActiveBadge}</span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
                {subscription.planName}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                {t.subscription.membershipActiveDesc}
              </p>
            </div>

            {/* Membership Details Card */}
            <div
              style={{
                background: 'rgba(0,0,0,0.35)',
                borderRadius: '14px',
                padding: '20px',
                border: '1px solid rgba(10, 186, 181, 0.25)',
                marginBottom: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t.subscription.billingRate}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  ${subscription.priceMonthly.toFixed(2)} / month
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t.subscription.activationDate}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                  {new Date(subscription.startedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  {t.subscription.renewalExpiryDate}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                  {new Date(subscription.expiresAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Features Enabled List */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                padding: '18px 20px',
                border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: '24px',
              }}
            >
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
                {t.subscription.unlockedFeaturesTitle}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                {subscription.features.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#e2e8f0' }}>
                    <CheckCircle2 size={16} color="var(--accent-green)" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    if (onNavigateToDailyIntel) {
                      onNavigateToDailyIntel();
                    } else {
                      onClose();
                    }
                  }}
                  style={{
                    padding: '12px 22px',
                    borderRadius: '10px',
                    background: 'linear-gradient(90deg, #0ABAB5 0%, #81d8d0 100%)',
                    border: 'none',
                    color: '#081014',
                    fontSize: '14px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <TrendingUp size={16} />
                  <span>{t.subscription.openDailyIntelBtn}</span>
                </button>

                <button
                  onClick={handleDownloadInvoice}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={14} />
                  <span>{receiptDownloaded ? t.subscription.receiptSaved : t.subscription.downloadInvoice}</span>
                </button>
              </div>

              <button
                onClick={handleCancelSubscription}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-faint)',
                  fontSize: '12px',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '8px',
                }}
              >
                {t.subscription.resetToFreeMode}
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* VIEW 3: FULL CHECKOUT & PAYWALL ACTIVATION FORM          */
          /* ======================================================== */
          <div>
            {/* Modal Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  background: 'rgba(10, 186, 181, 0.15)',
                  border: '1px solid rgba(10, 186, 181, 0.3)',
                  color: 'var(--accent-cyan)',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '10px',
                }}
              >
                <Crown size={15} color="#ffd700" />
                <span>TraderRank Pro</span>
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
                {t.subscription.modalTitle}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '560px', margin: '0 auto' }}>
                {t.subscription.modalSubtitle}
              </p>
            </div>

            {/* STEP 1: Pricing Tier Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '14px',
                marginBottom: '20px',
              }}
            >
              {/* Monthly: $9 / mo */}
              <div
                onClick={() => setSelectedTier('PRO_MONTHLY')}
                style={{
                  padding: '16px 18px',
                  borderRadius: '12px',
                  border: `2px solid ${selectedTier === 'PRO_MONTHLY' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                  background: selectedTier === 'PRO_MONTHLY' ? 'rgba(10, 186, 181, 0.1)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{t.subscription.monthlyTier}</span>
                  <span
                    style={{
                      background: 'rgba(10, 186, 181, 0.2)',
                      color: 'var(--accent-cyan)',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '8px',
                    }}
                  >
                    {t.subscription.mostPopular}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-cyan)' }}>$9.00</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t.subscription.perMonth}</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  {t.subscription.monthlyDesc}
                </p>
              </div>

              {/* Annual: $79 / yr */}
              <div
                onClick={() => setSelectedTier('PRO_ANNUAL')}
                style={{
                  padding: '16px 18px',
                  borderRadius: '12px',
                  border: `2px solid ${selectedTier === 'PRO_ANNUAL' ? '#ffd700' : 'rgba(255,255,255,0.1)'}`,
                  background: selectedTier === 'PRO_ANNUAL' ? 'rgba(255, 215, 0, 0.08)' : 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{t.subscription.annualTier}</span>
                  <span
                    style={{
                      background: 'rgba(255, 215, 0, 0.2)',
                      color: '#ffd700',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '8px',
                    }}
                  >
                    {t.subscription.save27}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: '#ffd700' }}>$79.00</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>/ year ($6.58/mo)</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  {t.subscription.annualDesc}
                </p>
              </div>
            </div>

            {/* STEP 2: Payment Method Tabs */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                {t.subscription.selectPaymentGateway}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: paymentMethod === 'CARD' ? 'rgba(10, 186, 181, 0.18)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${paymentMethod === 'CARD' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                    color: paymentMethod === 'CARD' ? '#fff' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <CreditCard size={16} color={paymentMethod === 'CARD' ? 'var(--accent-cyan)' : 'currentColor'} />
                  <span>{t.subscription.creditCard}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('APPLE_PAY')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: paymentMethod === 'APPLE_PAY' ? 'rgba(10, 186, 181, 0.18)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${paymentMethod === 'APPLE_PAY' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                    color: paymentMethod === 'APPLE_PAY' ? '#fff' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <Zap size={16} color={paymentMethod === 'APPLE_PAY' ? '#ffd700' : 'currentColor'} />
                  <span>{t.subscription.appleGooglePay}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CRYPTO')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    background: paymentMethod === 'CRYPTO' ? 'rgba(10, 186, 181, 0.18)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${paymentMethod === 'CRYPTO' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)'}`,
                    color: paymentMethod === 'CRYPTO' ? '#fff' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <Coins size={16} color={paymentMethod === 'CRYPTO' ? 'var(--accent-green)' : 'currentColor'} />
                  <span>{t.subscription.cryptoUsdt}</span>
                </button>
              </div>
            </div>

            {/* STEP 3: Payment Input Forms */}
            {paymentMethod === 'CARD' && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  padding: '18px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  {/* Cardholder Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t.subscription.cardholderName}
                    </label>
                    <input
                      type="text"
                      placeholder="Alex Trader"
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: '#081014',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontSize: '13px',
                      }}
                    />
                  </div>

                  {/* Card Number */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.subscription.cardNumber}</label>
                      <span style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontWeight: 700 }}>VISA / MASTERCARD</span>
                    </div>
                    <input
                      type="text"
                      placeholder="4242 •••• •••• 4242"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: '#081014',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {/* Expiry */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t.subscription.cardExpiry}
                    </label>
                    <input
                      type="text"
                      placeholder="12/28"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: '#081014',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>

                  {/* CVC */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t.subscription.cardCvc}
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="•••"
                      value={cardCvc}
                      onChange={e => setCardCvc(e.target.value.replace(/\D/g, ''))}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: '#081014',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontSize: '13px',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>

                  {/* Country */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {t.subscription.country}
                    </label>
                    <select
                      value={billingCountry}
                      onChange={e => setBillingCountry(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 8px',
                        borderRadius: '8px',
                        background: '#081014',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#fff',
                        fontSize: '13px',
                      }}
                    >
                      <option value="US">🇺🇸 United States</option>
                      <option value="GB">🇬🇧 United Kingdom</option>
                      <option value="CA">🇨🇦 Canada</option>
                      <option value="AU">🇦🇺 Australia</option>
                      <option value="EU">🇪🇺 European Union</option>
                      <option value="SG">🇸🇬 Singapore</option>
                      <option value="JP">🇯🇵 Japan</option>
                      <option value="CN">🇨🇳 China</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'APPLE_PAY' && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  marginBottom: '20px',
                  textAlign: 'center',
                }}
              >
                <div style={{ marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                    {t.subscription.applePayDesc}
                  </span>
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 28px',
                    borderRadius: '10px',
                    background: '#000',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                  }}
                  onClick={handleCompletePayment}
                >
                  <Zap size={16} color="#ffd700" />
                  <span>{t.subscription.payWithAppleGpay.replace('{amount}', totalAmount)}</span>
                </div>
              </div>
            )}

            {paymentMethod === 'CRYPTO' && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  padding: '18px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  marginBottom: '20px',
                }}
              >
                {/* Crypto Network Selector */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  {(['USDT_TRC20', 'USDT_ARBITRUM', 'USDT_SOLANA', 'USDT_ERC20', 'BTC'] as CryptoNetwork[]).map(net => (
                    <button
                      key={net}
                      type="button"
                      onClick={() => setSelectedCrypto(net)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: selectedCrypto === net ? 'rgba(10, 186, 181, 0.2)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${selectedCrypto === net ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)'}`,
                        color: selectedCrypto === net ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      {cryptoWallets[net].label}
                    </button>
                  ))}
                </div>

                {/* Deposit Address Box */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* SVG QR Code */}
                  <div
                    style={{
                      width: '90px',
                      height: '90px',
                      background: '#fff',
                      borderRadius: '8px',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <QrCode size={78} color="#000" />
                  </div>

                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {t.subscription.sendExactly} <strong style={{ color: 'var(--accent-cyan)' }}>{cryptoWallets[selectedCrypto].amount}</strong>
                      </span>
                      <span style={{ fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {t.subscription.rateExpiresIn} {formatTimer(cryptoTimerSeconds)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: '#081014',
                        border: '1px solid rgba(255,255,255,0.12)',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: '#fff',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cryptoWallets[selectedCrypto].address}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyAddress(cryptoWallets[selectedCrypto].address)}
                        style={{
                          background: 'rgba(10, 186, 181, 0.2)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          color: 'var(--accent-cyan)',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginLeft: '8px',
                        }}
                      >
                        {copiedAddress ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedAddress ? t.subscription.copied : t.subscription.copyAddress}</span>
                      </button>
                    </div>

                    <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                      Network: {cryptoWallets[selectedCrypto].network}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary Breakdown Box */}
            <div
              style={{
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '12px',
                padding: '14px 18px',
                border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                <span>{t.subscription.subtotal} ({isAnnual ? t.subscription.annualTier : t.subscription.monthlyTier})</span>
                <span>{totalAmount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span>{t.subscription.estimatedTax}</span>
                <span>$0.00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{t.subscription.totalDueToday}</span>
                <span style={{ fontWeight: 800, fontSize: '20px', color: 'var(--accent-cyan)' }}>{totalAmount}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px' }}>
                {recurringNote}
              </div>
            </div>

            {/* Guarantees Badges */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <ShieldCheck size={14} color="var(--accent-green)" />
                <span>{t.subscription.sslEncrypted}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={14} color="var(--accent-cyan)" />
                <span>{t.subscription.instantActivationBadge}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <Lock size={14} color="#ffd700" />
                <span>{t.subscription.moneyBackGuarantee}</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleCompletePayment}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                background: 'linear-gradient(90deg, #0ABAB5 0%, #81d8d0 100%)',
                border: 'none',
                color: '#081014',
                fontSize: '16px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: isProcessing ? 'wait' : 'pointer',
                boxShadow: '0 4px 25px rgba(10, 186, 181, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              {isProcessing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid #081014', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  <span>{processingStage || t.subscription.processingPayment}</span>
                </div>
              ) : (
                <>
                  <Crown size={18} />
                  <span>{t.subscription.confirmAndUnlock} ({totalAmount})</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
