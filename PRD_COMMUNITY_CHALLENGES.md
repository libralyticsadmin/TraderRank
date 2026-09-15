# TraderRank PRD v2 — Community & Competitive Challenges Architecture

## 1. Executive Summary & Vision
TraderRank is the competitive arena and social verification platform for retail Forex, Commodity, and Crypto traders across XM, Axiory, Exness, and Vantage.

**Core Vision:** Transform isolated trading into an electrifying, community-driven competitive esport where real trader performance is independently verified via read-only broker connections, evaluated with institutional risk criteria, and celebrated on live leaderboards.

---

## 2. Core Pillars (From Grill-Me Design Alignment)

### Pillar 1: Zero-Friction Real API Ingestion
- **TraderRank Platform Bridge:** TraderRank hosts the centralized MetaApi and Exness OpenAPI infrastructure.
- **Traders Only Input:**
  - Broker & Platform (MT4 / MT5)
  - Server Name
  - Account Number
  - **Read-Only Investor Password** (Zero trade execution permissions, 100% safe)
- Real live exchange rates and institutional spreads stream continuously to all client sessions.

### Pillar 2: Prop-Style Tournaments & Weekly Sprints
- **Sprint Schedule:**
  - *Weekly FX Blitz:* 5-day sprint (Monday 00:00 UTC to Friday 21:00 UTC).
  - *Monthly Prop Challenge:* 30-day endurance gauntlet.
- **Participation:** One-click tournament entry for any connected verified account.
- **Real-time Scoring:** Dynamic sub-second ranking powered by Redis Sorted Sets combining settled closed pips and active floating pips.

### Pillar 3: Institutional Risk Controls & Anti-Gambling Rules
To prevent reckless lot-size gambling and reward disciplined risk-to-reward traders:
- **Max Daily Loss Limit (5.0%):** If equity drops > 5.0% from the start-of-day equity, the account is immediately flagged as **Disqualified (DQ)** from the tournament prize ranking.
- **Max Trailing Drawdown (10.0%):** If equity ever falls > 10.0% below high-water mark, instant DQ.
- **Minimum Trade Requirement:** Minimum of 5 closed trades to qualify for final podium standing.
- **Multi-Factor TraderScore:**
  $$\text{TraderScore} = \text{Net Normalized Pips} \times \left(1 + \frac{\text{Win Rate}}{100}\right) \times \left(\text{Discipline Multiplier}\right)$$

### Pillar 4: Verified Trader Profiles & Live Community Feed
- **Clickable Trader Profiles:**
  - Verified Broker Badge (e.g. `XM Verified`, `Exness Native`)
  - All-time Win Rate & Profit Factor
  - Cumulative Pips Won & Tournaments Participated
  - Honor Badge Showcase
- **Real-Time Achievement Feed:**
  - Live WebSocket broadcast of community milestones:
    - *"Trader @FX_Sniper took #1 on Weekly Blitz (+64.2 pips)!"*
    - *"Trader @AlphaWave unlocked the 'Risk Guardian' Badge!"*
    - *"New Challenger entered the Arena: @GoldBug on XM Global"*

### Pillar 5: TraderRank XP, Honor Badges & Hall of Fame
- **TraderRank Level System:**
  - Level 1: Novice Scalper (0 - 500 XP)
  - Level 2: Pro Swing (501 - 2,000 XP)
  - Level 3: Market Veteran (2,001 - 5,000 XP)
  - Level 4: Apex Predator (5,001+ XP)
- **Honor Badges:**
  - 🛡️ **Risk Guardian:** Completed a 5-day tournament with < 2% maximum drawdown.
  - 🎯 **Sniper:** Achieved a > 70% win-rate with at least 10 trades.
  - 🥇 **Podium Master:** Finished Top 3 in an official community tournament.
  - ⚡ **Century Club:** Gained 100+ normalized pips in a single trading week.
  - 🏆 **Hall of Fame:** Permanent leaderboard showcasing seasonal champions.

---

## 3. Phased Roadmap for Community & Challenges MVP

- **Milestone 1:** Tournament Engine & Risk Governor (`tournamentService.ts`, `riskGovernor.ts`)
- **Milestone 2:** Trader Profile & Honor Badge Progression Model (`traderProfileService.ts`, `badgeEngine.ts`)
- **Milestone 3:** Live Community WebSocket Activity Feed
- **Milestone 4:** Frontend Terminal Tabs for **Tournaments Arena** and **Trader Profile Drawer**
- **Milestone 5:** Comprehensive Unit & E2E Verification Tests
