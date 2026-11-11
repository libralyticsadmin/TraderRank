import React, { useState } from 'react';
import { TradingAccount } from '../../../shared/src/types.ts';
import { Shield, Trash2, Server, Zap, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { useTranslation } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface AccountsListProps {
  accounts: TradingAccount[];
  onDisconnect: (id: string) => void;
  onOpenWizard: () => void;
  onSyncAccount?: (id: string) => Promise<void> | void;
  onOpenSecurityVault?: () => void;
}

export const AccountsList: React.FC<AccountsListProps> = ({ accounts, onDisconnect, onOpenWizard, onSyncAccount, onOpenSecurityVault }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncedId, setSyncedId] = useState<string | null>(null);

  // Multi-tenant privacy safeguard: each player only sees their own accounts
  const visibleAccounts = accounts.filter(acc => {
    if (!user) return false;
    const uid = (user.id || '').toLowerCase();
    const accUid = (acc.userId || '').toLowerCase();
    const uEmail = (user.email || '').toLowerCase();
    const uName = (user.username || '').toLowerCase();
    const accProfile = (acc.profileUsername || '').toLowerCase();
    return (
      accUid === uid ||
      accUid === `u_${uid.replace(/^u_/, '')}` ||
      `u_${accUid.replace(/^u_/, '')}` === uid ||
      (accProfile && uName && accProfile === uName) ||
      (accUid && uName && (accUid.includes(uName) || accUid.includes(uid))) ||
      (uEmail && (accUid === uEmail || accUid === `u_${uEmail.replace(/[^a-z0-9]/g, '_')}`))
    );
  });

  const handleSyncClick = async (id: string) => {
    if (!onSyncAccount || syncingId) return;
    setSyncingId(id);
    try {
      await onSyncAccount(id);
      setSyncedId(id);
      setTimeout(() => setSyncedId(null), 3000);
    } finally {
      setSyncingId(null);
    }
  };

  const formatAccountCurrency = (amount: number, currency?: string) => {
    const cur = (currency || 'USD').toUpperCase();
    if (cur === 'JPY') {
      return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
    }
    if (cur === 'EUR') {
      return `€${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (cur === 'GBP') {
      return `£${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="card-panel">
      <div className="panel-header">
        <h3 className="panel-title">
          <Server size={18} color="#81d8d0" />
          {t.accounts.connectedAccounts}
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
            ({visibleAccounts.length} {t.accounts.activeAccounts})
          </span>
          <span style={{ fontSize: '11px', color: '#0abab5', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(10, 186, 181, 0.12)', border: '1px solid rgba(10, 186, 181, 0.25)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
            <Lock size={10} /> Isolated & Private
          </span>
        </h3>
        <button className="btn-secondary" onClick={onOpenWizard} style={{ padding: '6px 12px', fontSize: '13px' }}>
          + {t.accounts.addAccount}
        </button>
      </div>

      {visibleAccounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '12px', fontSize: '14px' }}>
            {user
              ? `No broker accounts connected for ${user.username}. Connect your MT4/MT5 or Exness account to start competing securely.`
              : t.accounts.noAccountsDesc}
          </p>
          <div style={{ fontSize: '12px', color: '#848E9C', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Shield size={13} color="#0abab5" />
            <span>Strict privacy: Each player only sees their own connected accounts and encrypted credentials.</span>
          </div>
          <button className="btn-primary" onClick={onOpenWizard}>
            {t.connector.selectBroker} (IC Markets, XM, Axiory, Exness, Vantage)
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {visibleAccounts.map(acc => (
            <div
              key={acc.id}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <BrokerSymbol broker={acc.broker} size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '15px' }}>{acc.broker}</strong>
                    <span className="brand-badge" style={{ fontSize: '10px' }}>
                      {acc.integrationType === 'exness_native' ? 'Exness Native API' : `MT Gateway (${acc.platform})`}
                    </span>
                    {acc.metaApiAccountId && (
                      <span className="brand-badge" style={{ fontSize: '10px', background: 'rgba(10,186,181,0.15)', color: '#0abab5', border: '1px solid rgba(10,186,181,0.35)' }}>
                        <Zap size={11} style={{ marginRight: '3px' }} /> MetaApi Cloud
                      </span>
                    )}
                    <span className="status-pill status-connected">
                      <span className="status-dot"></span> {t.accounts.activeFeed}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>{t.accounts.accountLabel}: <strong className="tabular" style={{ color: '#fff' }}>TraderRank-{acc.accountNumber}</strong></span>
                    <span>Public Username: <strong style={{ color: '#00f0ff' }}>{acc.profileUsername || user?.username}</strong></span>
                    {acc.accountHolderName && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '1px 7px',
                          borderRadius: '5px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          color: '#fbbf24',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                        title="Strictly private to your account — never shown on public leaderboards"
                      >
                        <Lock size={10} /> Private Holder: {acc.accountHolderName}
                      </span>
                    )}
                    {acc.serverName && <span>{t.accounts.serverLabel}: <strong style={{ color: '#fff' }}>{acc.serverName}</strong></span>}
                    <span>{t.accounts.leverageLabel}: <strong className="tabular" style={{ color: '#fff' }}>1:{acc.leverage}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t.accounts.equityBalance}</div>
                  <div className="tabular" style={{ fontSize: '15px', fontWeight: 700 }}>
                    {formatAccountCurrency(acc.equity, acc.currency)}
                  </div>
                  {acc.currency && acc.currency !== 'USD' && (
                    <div style={{ fontSize: '10px', color: '#0abab5', fontWeight: 600 }}>{acc.currency}</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {onSyncAccount && (
                    <button
                      className="btn-secondary"
                      title={syncingId === acc.id ? 'Syncing...' : 'Sync with MetaApi Cloud'}
                      onClick={() => handleSyncClick(acc.id)}
                      disabled={syncingId === acc.id}
                      style={{
                        padding: '8px',
                        color: syncedId === acc.id ? '#10b981' : '#0abab5',
                        background: syncedId === acc.id ? 'rgba(16, 185, 129, 0.15)' : undefined,
                        border: syncedId === acc.id ? '1px solid rgba(16, 185, 129, 0.4)' : undefined,
                      }}
                    >
                      {syncedId === acc.id ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <RefreshCw
                          size={16}
                          style={{
                            animation: syncingId === acc.id ? 'spin 1s linear infinite' : 'none',
                          }}
                        />
                      )}
                    </button>
                  )}
                  <button
                    className="btn-secondary"
                    title={t.accounts.vaultSecretRef}
                    onClick={() => onOpenSecurityVault?.()}
                    style={{ padding: '8px', color: 'var(--accent-cyan)', cursor: 'pointer' }}
                  >
                    <Shield size={16} />
                  </button>
                  <button
                    className="btn-secondary"
                    title={t.accounts.disconnectTitle}
                    onClick={() => onDisconnect(acc.id)}
                    style={{ padding: '8px', color: 'var(--accent-red)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
