import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  callerService: string;
  action: 'STORE' | 'READ' | 'ROTATE' | 'REVOKE';
  secretRef: string;
  success: boolean;
  metadata?: Record<string, unknown>;
}

export const SecurityVaultDrawer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/vault/audit');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.reverse());
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    const interval = setInterval(fetchAuditLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card-panel" style={{ borderTop: '2px solid #06b6d4' }}>
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={20} color="#06b6d4" />
          <h3 className="panel-title" style={{ margin: 0 }}>
            Secrets Vault Security &amp; Audit Log
          </h3>
          <span className="brand-badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
            AES-256-GCM
          </span>
        </div>
        <button
          className="btn-secondary"
          onClick={() => setIsOpen(!isOpen)}
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          {isOpen ? 'Collapse Audit Logs' : `View Live Vault Audit Trail (${logs.length})`}
        </button>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
        TraderRank isolates all Investor Passwords and Exness API Secrets in a dedicated AES-256-GCM Secrets Vault. No plaintext credentials are ever logged, sent to the database, or exposed to downstream services.
      </p>

      {isOpen && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
          padding: '14px',
          maxHeight: '260px',
          overflowY: 'auto',
          fontSize: '12px',
        }}>
          {logs.length === 0 ? (
            <p style={{ color: 'var(--text-faint)' }}>No audit events logged yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.map(log => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: log.success ? 'rgba(255, 255, 255, 0.02)' : 'rgba(244, 63, 94, 0.1)',
                    borderLeft: `3px solid ${log.success ? 'var(--accent-green)' : 'var(--accent-red)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontSize: '10px',
                      background: log.action === 'STORE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(6, 182, 212, 0.2)',
                      color: log.action === 'STORE' ? 'var(--accent-green)' : 'var(--accent-cyan)',
                    }}>
                      {log.action}
                    </span>
                    <strong style={{ color: '#fff' }}>{log.callerService}</strong>
                    <span className="tabular" style={{ color: 'var(--text-muted)' }}>{log.secretRef}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-faint)' }}>
                    <span className="tabular">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    {log.success ? (
                      <span style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle size={12} /> OK
                      </span>
                    ) : (
                      <span style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} /> BLOCKED
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
