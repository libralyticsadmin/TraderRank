import React from 'react';
import { Broker } from '../../../shared/src/types.ts';
import { Landmark, ShieldCheck, Zap, Gauge, Globe, Award } from 'lucide-react';

interface BrokerSymbolProps {
  broker: Broker;
  size?: number;
}

export const BrokerSymbol: React.FC<BrokerSymbolProps> = ({ broker, size = 18 }) => {
  switch (broker) {
    case 'IC_MARKETS':
      return <Award size={size} color="#0abab5" />;
    case 'XM':
      return <Landmark size={size} color="#f59e0b" />;
    case 'XMTrading':
      return <Landmark size={size} color="#ef4444" />;
    case 'Exness':
      return <ShieldCheck size={size} color="#81d8d0" />;
    case 'Axiory':
      return <Zap size={size} color="#0abab5" />;
    case 'Vantage':
      return <Gauge size={size} color="#8b5cf6" />;
    case 'Vanguard':
      return <Award size={size} color="#38bdf8" />;
    default:
      return <Globe size={size} color="#94a3b8" />;
  }
};
