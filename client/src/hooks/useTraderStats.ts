/**
 * TraderRank Shared Canonical Stats Hook (Single Source of Truth)
 * Shares one singleton fetch + WebSocket subscription across LandingPage,
 * LiveLeaderboard, DailyBestTraderCard, TraderProfileModal, and AccountsList
 * so every dashboard displays the exact same numbers simultaneously.
 */

import { useEffect, useState, useCallback } from 'react';
import type { CanonicalTraderStats } from '../../../shared/src/types';

export interface CanonicalStatsSnapshot {
  traders: CanonicalTraderStats[];
  platformTotals: {
    totalTrades: number;
    totalWinningPips: number;
    activeTraders: number;
  } | null;
  usdJpyRate: number;
  generatedAt: string | null;
}

let cachedSnapshot: CanonicalStatsSnapshot = {
  traders: [],
  platformTotals: null,
  usdJpyRate: 154.5,
  generatedAt: null,
};

let inFlightPromise: Promise<CanonicalStatsSnapshot> | null = null;
const listeners = new Set<(snapshot: CanonicalStatsSnapshot) => void>();
let pollTimer: ReturnType<typeof setInterval> | null = null;

function notifyAll() {
  for (const listener of listeners) {
    listener(cachedSnapshot);
  }
}

export function publishCanonicalStatsSnapshot(data: Partial<CanonicalStatsSnapshot>) {
  cachedSnapshot = {
    traders: Array.isArray(data.traders) ? data.traders : cachedSnapshot.traders,
    platformTotals: data.platformTotals ?? cachedSnapshot.platformTotals,
    usdJpyRate: typeof data.usdJpyRate === 'number' ? data.usdJpyRate : cachedSnapshot.usdJpyRate,
    generatedAt: data.generatedAt ?? new Date().toISOString(),
  };
  notifyAll();
}

export async function fetchCanonicalStats(force = false): Promise<CanonicalStatsSnapshot> {
  if (!force && inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const res = await fetch('/api/traders/canonical');
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.traders)) {
          publishCanonicalStatsSnapshot({
            traders: json.traders,
            platformTotals: json.platformTotals || null,
            usdJpyRate: json.usdJpyRate || 154.5,
            generatedAt: json.generatedAt || new Date().toISOString(),
          });
        }
      }
    } catch {
      // Keep last cached snapshot on transient network error
    } finally {
      inFlightPromise = null;
    }
    return cachedSnapshot;
  })();

  return inFlightPromise;
}

function ensurePollingStarted() {
  if (!pollTimer) {
    pollTimer = setInterval(() => {
      if (listeners.size > 0) {
        fetchCanonicalStats(true);
      } else if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }, 15000);
  }
}

export function findCanonicalTrader(
  traders: CanonicalTraderStats[],
  query: { accountNumber?: string | null; userId?: string | null; username?: string | null }
): CanonicalTraderStats | undefined {
  const cleanAcc = query.accountNumber
    ? String(query.accountNumber).replace(/^TraderRank-/i, '').trim()
    : '';
  const uid = (query.userId || '').trim();
  const uname = (query.username || '').trim().toLowerCase();

  if (cleanAcc) {
    const byAcc = traders.find(t => t.accountNumber === cleanAcc);
    if (byAcc) return byAcc;
  }
  if (uid && uid !== 'usr_live_meta') {
    const byUid = traders.find(t => t.userId === uid);
    if (byUid) return byUid;
  }
  if (uname) {
    const byName = traders.find(
      t => t.username.toLowerCase() === uname || t.profileName.toLowerCase() === uname
    );
    if (byName) return byName;
  }
  return undefined;
}

export function useTraderStats() {
  const [snapshot, setSnapshot] = useState<CanonicalStatsSnapshot>(cachedSnapshot);

  useEffect(() => {
    listeners.add(setSnapshot);
    if (cachedSnapshot.traders.length === 0) {
      fetchCanonicalStats();
    }
    ensurePollingStarted();

    return () => {
      listeners.delete(setSnapshot);
    };
  }, []);

  const refresh = useCallback(async () => {
    await fetchCanonicalStats(true);
  }, []);

  const getTraderStats = useCallback(
    (query: { accountNumber?: string | null; userId?: string | null; username?: string | null }) =>
      findCanonicalTrader(snapshot.traders, query),
    [snapshot.traders]
  );

  return {
    traders: snapshot.traders,
    platformTotals: snapshot.platformTotals,
    usdJpyRate: snapshot.usdJpyRate,
    generatedAt: snapshot.generatedAt,
    getTraderStats,
    refresh,
  };
}
