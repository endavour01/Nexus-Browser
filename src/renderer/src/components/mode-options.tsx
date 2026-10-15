import React from 'react';
import { NexusBrowserMode } from '@shared/types';
import { Compass, Sun, Zap } from 'lucide-react';

export interface ModeOption {
  id: NexusBrowserMode;
  name: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  palette: string[];
}

export const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'default',
    name: 'Default Mode',
    description: 'Balanced contrast, fluid animations, and standard multitasking.',
    icon: <Compass size={17} style={{ color: '#A78BFA' }} />,
    accentColor: '#A78BFA',
    palette: ['#0B0D12', '#12151D', '#191D28', '#A78BFA'],
  },
  {
    id: 'balanced',
    name: 'Balanced Mode',
    description: 'Warm ambient contrast, reduced eye strain, and focus enhancements.',
    icon: <Sun size={17} style={{ color: '#F5C542' }} />,
    accentColor: '#F5C542',
    palette: ['#090909', '#14120C', '#211B0D', '#F5C542'],
  },
  {
    id: 'performance',
    name: 'Performance Mode',
    description: 'Low-latency UI, background tab throttling, and memory optimization.',
    icon: <Zap size={17} style={{ color: '#F02D43' }} />,
    accentColor: '#F02D43',
    palette: ['#080809', '#121214', '#1C1719', '#F02D43'],
  },
];