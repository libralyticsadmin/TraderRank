import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const revsPath = path.join(__dirname, 'user_revisions.json');
const revs = JSON.parse(fs.readFileSync(revsPath, 'utf8'));

// High quality non-yellow revisions from user's sheet
revs['intel.tradingStyle'] = { ja: 'トレードスタイル' };
revs['intel.unlockGeneratorModalTitle'] = { ja: 'カスタム時間軸戦略ジェネレーターを解除' };
revs['positions.noPositionsDesc'] = { ja: 'MT4/MT5口座で新たに開始された取引は、1秒未満の高速WebSocket通信を介して、ここに自動的にリアルタイム配信されます。' };
revs['subscription.congratsSubtitle'] = { ja: 'Pro 日次インテリジェンスおよびマルチタイムフレーム戦略ジェネレーターが有効化されました。' };
revs['rewards.currentTier'] = { ja: 'マーケット ・ ベテラン' };

// Professional emoji formatting
if (revs['intel.doNotEnterTrade']) {
  revs['intel.doNotEnterTrade'].ja = '[警告] エントリー禁止 • リスクリワード比 • 目標 {targetRR} R:R 不足';
}
if (revs['community.cheersKing']) {
  revs['community.cheersKing'].ja = '超過リターン [LEAD]';
}
if (revs['community.cheersShield']) {
  revs['community.cheersShield'].ja = 'リスク管理 [DEF]';
}

const translationsFile = path.join(__dirname, '../client/src/i18n/translations.ts');
const code = fs.readFileSync(translationsFile, 'utf8');
const lines = code.split('\n');

let inJa = false;
let currentSection = null;
let replacedCount = 0;
const replacedKeys = [];

const newLines = lines.map((line, idx) => {
  const trimmed = line.trim();
  if (line.startsWith('  ja: {')) {
    inJa = true;
    return line;
  }
  if (inJa && line.startsWith('  zh: {')) {
    inJa = false;
    currentSection = null;
    return line;
  }
  if (!inJa) return line;

  // Section entry e.g. "    nav: {"
  const secMatch = line.match(/^    ([a-zA-Z0-9_]+):\s*\{/);
  if (secMatch) {
    currentSection = secMatch[1];
    return line;
  }
  if (line.startsWith('    },')) {
    currentSection = null;
    return line;
  }

  if (currentSection) {
    // Property line e.g. "      propName: 'val',"
    const propMatch = line.match(/^(\s*)([a-zA-Z0-9_]+):\s*(['"`])([\s\S]*)\3(,?)$/);
    if (propMatch) {
      const indent = propMatch[1];
      const prop = propMatch[2];
      const trailingComma = propMatch[5] || ',';
      const fullKey = `${currentSection}.${prop}`;
      if (revs[fullKey]) {
        replacedCount++;
        replacedKeys.push(fullKey);
        const newVal = revs[fullKey].ja.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        return `${indent}${prop}: '${newVal}'${trailingComma}`;
      }
    }
  }

  return line;
});

console.log(`Replaced ${replacedCount} / ${Object.keys(revs).length} keys in translations.ts`);
const unreplaced = Object.keys(revs).filter(k => !replacedKeys.includes(k));
if (unreplaced.length > 0) {
  console.log('Unreplaced keys:', unreplaced);
} else {
  console.log('All keys matched and replaced successfully!');
}

fs.writeFileSync(translationsFile, newLines.join('\n'), 'utf8');
console.log('Saved updated client/src/i18n/translations.ts');
