import React from 'react';
import { Broker } from '../../../shared/src/types.ts';
import { Landmark, ShieldCheck, Zap, Gauge, Globe } from 'lucide-react';

interface BrokerSymbolProps {
  broker: Broker;
  size?: number;
}

export const BrokerSymbol: React.FC<BrokerSymbolProps> = ({ broker, size = 18 }) => {
  switch (broker) {
    case 'XM':
      return <Landmark size={size} color="#f59e0b" />;
    case 'Exness':
      return <ShieldCheck size={size} color="#06b6d4" />;
    case 'Axiory':
      return <Zap size={size} color="#10b981" />;
    case 'Vantage':
      return <Gauge size={size} color="#8b5cf6" />;
    default:
      return <Globe size={size} color="#94a3b8" />;
  }
};
