import React from 'react';
import { CanonicalPosition } from '../../../shared/src/types.ts';
import { Activity, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface LivePositionsTickerProps {
  positions: CanonicalPosition[];
}

export const LivePositionsTicker: React.FC<LivePositionsTickerProps> = ({ positions }) => {
  const totalFloatingPips = Number(
    positions.reduce((acc, p) => acc + p.profitPips, 0).toFixed(1)
  );

  return (
    <div className="card-panel">
      <div className="panel-header">
        <h3 className="panel-title">
          <Activity size={18} color="#10b981" />
          Live Position Ingestion Feed
          <span className="status-pill status-connected" style={{ fontSize: '11px' }}>
            <span className="status-dot"></span> Sub-Second Stream
          </span>
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Net Floating PnL:</span>
          <span
            className={`tabular ${totalFloatingPips >= 0 ? 'pip-positive' : 'pip-negative'}`}
            style={{ fontSize: '16px', fontWeight: 800 }}
          >
            {totalFloatingPips >= 0 ? `+${totalFloatingPips}` : totalFloatingPips} pips
          </span>
        </div>
      </div>

      {positions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
          <Clock size={28} style={{ opacity: 0.4, margin: '0 auto 8px auto' }} />
          <p style={{ fontSize: '13px' }}>No open positions currently detected on connected accounts.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-faint)', textAlign: 'left' }}>
                <th style={{ padding: '10px 8px' }}>Ticket</th>
                <th style={{ padding: '10px 8px' }}>Instrument</th>
                <th style={{ padding: '10px 8px' }}>Side</th>
                <th style={{ padding: '10px 8px' }}>Volume</th>
                <th style={{ padding: '10px 8px' }}>Open Price</th>
                <th style={{ padding: '10px 8px' }}>Live Price</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Normalized Pips</th>
                <th style={{ padding: '10px 8px', textAlign: 'right' }}>Profit (USD)</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(pos => {
                const isPositive = pos.profitPips >= 0;
                return (
                  <tr
                    key={pos.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.2s',
                    }}
                  >
                    <td className="tabular" style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                      #{pos.ticket.slice(-6)}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <strong style={{ letterSpacing: '0.5px' }}>{pos.symbol}</strong>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: pos.type === 'BUY' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                          color: pos.type === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)',
                        }}
                      >
                        {pos.type === 'BUY' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {pos.type}
                      </span>
                    </td>
                    <td className="tabular" style={{ padding: '12px 8px' }}>{pos.lotSize.toFixed(2)} lots</td>
                    <td className="tabular" style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                      {pos.openPrice}
                    </td>
                    <td className="tabular" style={{ padding: '12px 8px', fontWeight: 600 }}>
                      {pos.currentPrice}
                    </td>
                    <td className="tabular" style={{ padding: '12px 8px', textAlign: 'right' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 800,
                          background: isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                          color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)',
                          border: `1px solid ${isPositive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                        }}
                      >
                        {isPositive ? `+${pos.profitPips}` : pos.profitPips}
                      </span>
                    </td>
                    <td className="tabular" style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
                      <span className={pos.profitCurrency >= 0 ? 'pip-positive' : 'pip-negative'}>
                        ${pos.profitCurrency.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
