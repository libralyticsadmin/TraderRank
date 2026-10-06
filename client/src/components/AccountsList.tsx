import React from 'react';
import { TradingAccount } from '../../../shared/src/types.ts';
import { Shield, Trash2, Server } from 'lucide-react';
import { BrokerSymbol } from './BrokerSymbol.tsx';
import { useTranslation } from '../context/LanguageContext.tsx';

interface AccountsListProps {
  accounts: TradingAccount[];
  onDisconnect: (id: string) => void;
  onOpenWizard: () => void;
}

export const AccountsList: React.FC<AccountsListProps> = ({ accounts, onDisconnect, onOpenWizard }) => {
  const { t } = useTranslation();

  return (
    <div className="card-panel">
      <div className="panel-header">
        <h3 className="panel-title">
          <Server size={18} color="#81d8d0" />
          {t.accounts.connectedAccounts}
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
            ({accounts.length} {t.accounts.activeAccounts})
          </span>
        </h3>
        <button className="btn-secondary" onClick={onOpenWizard} style={{ padding: '6px 12px', fontSize: '13px' }}>
          + {t.accounts.addAccount}
        </button>
      </div>

      {accounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '12px', fontSize: '14px' }}>{t.accounts.noAccountsDesc}</p>
          <button className="btn-primary" onClick={onOpenWizard}>
            {t.connector.selectBroker} (IC Markets, XM, Axiory, Exness)
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {accounts.map(acc => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '15px' }}>{acc.broker}</strong>
                    <span className="brand-badge" style={{ fontSize: '10px' }}>
                      {acc.integrationType === 'exness_native' ? 'Exness Native API' : `MT Gateway (${acc.platform})`}
                    </span>
                    <span className="status-pill status-connected">
                      <span className="status-dot"></span> {t.accounts.activeFeed}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>{t.accounts.accountLabel}: <strong className="tabular" style={{ color: '#fff' }}>{acc.accountNumber}</strong></span>
                    {acc.serverName && <span>{t.accounts.serverLabel}: <strong style={{ color: '#fff' }}>{acc.serverName}</strong></span>}
                    <span>{t.accounts.leverageLabel}: <strong className="tabular" style={{ color: '#fff' }}>1:{acc.leverage}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t.accounts.equityBalance}</div>
                  <div className="tabular" style={{ fontSize: '15px', fontWeight: 700 }}>
                    ${acc.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn-secondary"
                    title={t.accounts.vaultSecretRef}
                    style={{ padding: '8px', color: 'var(--accent-cyan)' }}
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
