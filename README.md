# TraderRank — Broker & Trading Platform Ingestion Infrastructure

[![Status: Production-Ready](https://img.shields.io/badge/Status-Production--Ready-emerald.svg)](.)
[![Architecture: Event--Driven](https://img.shields.io/badge/Architecture-Event--Driven-cyan.svg)](.)
[![Security: AES--256--GCM](https://img.shields.io/badge/Security-AES--256--GCM%20Vault-blue.svg)](.)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-purple.svg)](.)

Compliant with **PRD v1** and **Infrastructure Design v1** for TraderRank.

---

## 1. Overview & Core Features

TraderRank ranks and gamifies trader performance across four target brokers: **XM, Axiory, Exness, Vantage** (plus generic MT4/MT5 servers).

- **Broker-Agnostic Core:** Downstream consumers (Leaderboard, XP/Badges, Tournaments, Analytics) consume canonical normalized trade records.
- **Dual Latency Tiers:**
  - *Sub-Second Tier (< 500ms):* Ingestion workers $\rightarrow$ Redis Streams $\rightarrow$ Normalizer $\rightarrow$ Redis Sorted Sets $\rightarrow$ WebSocket Gateway for live floating pip leaderboards.
  - *Durable Tier:* Settled trades (`trade.closed`) $\rightarrow$ PostgreSQL $\rightarrow$ XP calculation, level progression, badge rewards, and tournament leaderboards.
- **Secrets Vault Isolation:** Master/trading passwords are NEVER requested. Investor (read-only) passwords and Exness API keys are stored encrypted at rest via AES-256-GCM in an isolated vault with an immutable access audit trail.
- **Multi-Asset Pip Engine:** Standardized point math for 5-digit Forex (0.0001), JPY pairs (0.01), Spot Gold XAUUSD ($0.10/pip), Silver, Indices, and Crypto.
- **Dual-Mode Connectors:** Production adapters for MetaApi.cloud and Exness REST/WebSocket APIs, with zero-dependency simulated market streams for instant local development and testing.

---

## 2. System Architecture

```
                          ┌─────────────────────────────────────┐
                          │   TraderRank Trading Terminal (UI)  │
                          └──────────────────┬──────────────────┘
                                             │ HTTP REST + WS
                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   TraderRank Core Backend                                      │
│                                                                                                │
│   ┌────────────────────┐     ┌───────────────────────┐     ┌────────────────────────────────┐  │
│   │ API Gateway (REST) │────▶│ Account Connector     │────▶│ Secrets Vault (AES-256-GCM)    │  │
│   └────────────────────┘     └───────────┬───────────┘     └───────────────┬────────────────┘  │
│                                          │ provisions                      │ (vault refs)      │
│                                          ▼                                 ▼                   │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ Ingestion Workers (Sharded by account_id)                                              │   │
│   │   • MTGatewayWorker (MetaApi: XM, Axiory, Vantage, Generic MT4/MT5)                   │   │
│   │   • ExnessWorker (Official REST + WebSocket price stream)                              │   │
│   └──────────────────────────────────────┬─────────────────────────────────────────────────┘   │
│                                          │ emits raw events                                    │
│                                          ▼                                                     │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ Event Bus (Redis Streams: stream:position.raw, stream:trade.closed.raw)                │   │
│   └──────────────────────────────────────┬─────────────────────────────────────────────────┘   │
│                                          │ consumes & normalizes                               │
│                                          ▼                                                     │
│   ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ Trade Normalization & Multi-Asset Pip Calculator                                       │   │
│   └───────────────┬──────────────────────────────┬─────────────────────────────────────────┘   │
│                   │ writes settled trades        │ publishes normalized stream                 │
│                   ▼                              ▼                                             │
│   ┌───────────────────────────────┐     ┌──────────────────────────────────────────────────┐   │
│   │ PostgreSQL (Relational Store) │     │ Redis Sorted Sets & Live Leaderboard Service     │   │
│   │ - Accounts metadata           │     │ - Sub-second latency sorted rankings             │   │
│   │ - Settled closed trades       │     │ - Real-time pip aggregation                      │   │
│   │ - XP, Badges, Tournaments     │     └────────────────────────┬─────────────────────────┘   │
│   └───────────────────────────────┘                              │                             │
│                                                                  ▼                             │
│                                         ┌──────────────────────────────────────────────────┐   │
│                                         │ WebSocket Gateway (/ws)                          │   │
│                                         │ Streaming ticks, open positions, leaderboard     │   │
│                                         └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Getting Started

### Prerequisites
- Node.js v20+ or v24+
- npm v10+

### Quick Start
```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Run automated test suite
npm --prefix server test

# 3. Start development servers
# In terminal 1 (Backend API & WebSocket on port 4000):
npm --prefix server run dev

# In terminal 2 (Frontend Trading Terminal on port 3000):
npm --prefix client run dev
```

Open `http://localhost:3000` to launch the **TraderRank Terminal**.

---

## 4. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health, service status, and active WebSocket connection count |
| `POST` | `/api/connector/validate` | Synchronous pre-flight connection verification (PRD §6 step 4) |
| `POST` | `/api/connector/connect` | Onboard account: encrypts in vault, saves metadata, begins backfill |
| `GET` | `/api/accounts` | List connected accounts with balance, equity, and sync status |
| `GET` | `/api/accounts/:id/positions` | Get active positions normalized with live calculated pips |
| `GET` | `/api/accounts/:id/trades` | Get settled historical trades for XP and tournament scoring |
| `DELETE` | `/api/accounts/:id` | Disconnect account, revoke secret from vault, and stop streams |
| `GET` | `/api/leaderboard` | Real-time leaderboard ranked by total pips |
| `GET` | `/api/vault/audit` | Live Secrets Vault audit trail (AES-256-GCM transparency) |
| `WS` | `/ws` | Streaming updates for leaderboard and open positions |

---

## 5. Security Architecture

1. **Investor-Password-Only:** TraderRank never asks for or stores master trading passwords. Read-only investor passwords eliminate unauthorized trade execution risks.
2. **Dedicated Secrets Vault:** Credentials are encrypted using AES-256-GCM.
3. **Reference-Only DB Records:** Application databases and logs hold only random reference pointers (`vault_sec_...`).
4. **Audit Logging:** Every read, store, or revocation event is logged with timestamp, caller service, and success status. Downstream services (e.g. Leaderboard, Analytics) are explicitly blocked at the vault perimeter.
