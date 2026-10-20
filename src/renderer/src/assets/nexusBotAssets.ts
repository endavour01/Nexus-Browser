import { NexusBrowserMode } from '@shared/types';
import defaultBotImg from './icon3_obsidian_violet_1024.png';
import balancedBotImg from './icon3_black_amber_gold_1024.png';
import performanceBotImg from './icon3_black_crimson_red_1024.png';

/**
 * Mode-to-Image asset mappings for NEXUS Bot
 */
export const NEXUS_BOT_IMAGES: Record<NexusBrowserMode, string> = {
  default: defaultBotImg,
  balanced: balancedBotImg,
  performance: performanceBotImg,
};

/**
 * Mode subtitle / status labels as specified
 */
export const NEXUS_MODE_LABELS: Record<NexusBrowserMode, string> = {
  default: 'DEFAULT · EVERYDAY',
  balanced: 'BALANCED · PRODUCTIVITY',
  performance: 'PERFORMANCE · SPEED',
};

/**
 * Mode accent colors aligned with NEXUS theme design tokens
 */
export const NEXUS_MODE_ACCENTS: Record<NexusBrowserMode, string> = {
  default: '#A78BFA',
  balanced: '#F5C542',
  performance: '#F02D43',
};

/**
 * Mode descriptions for UI tooltips and companion details
 */
export const NEXUS_MODE_SUBTITLES: Record<NexusBrowserMode, string> = {
  default: 'Obsidian Black & Violet theme · Fluid multitasking',
  balanced: 'Black & Amber Gold theme · Focus & reduced eye strain',
  performance: 'Black & Crimson Red theme · Low-latency & memory optimizer',
};

/**
 * Safely retrieve the NEXUS Bot image URL for a given mode with fallback to 'default'
 */
export function getNexusBotImage(mode?: NexusBrowserMode | string | null): string {
  if (mode && mode in NEXUS_BOT_IMAGES) {
    return NEXUS_BOT_IMAGES[mode as NexusBrowserMode];
  }
  return NEXUS_BOT_IMAGES.default;
}

/**
 * Safely retrieve the mode label for a given mode with fallback to 'default'
 */
export function getNexusModeLabel(mode?: NexusBrowserMode | string | null): string {
  if (mode && mode in NEXUS_MODE_LABELS) {
    return NEXUS_MODE_LABELS[mode as NexusBrowserMode];
  }
  return NEXUS_MODE_LABELS.default;
}

/**
 * Safely retrieve the mode accent color with fallback to 'default'
 */
export function getNexusModeAccent(mode?: NexusBrowserMode | string | null): string {
  if (mode && mode in NEXUS_MODE_ACCENTS) {
    return NEXUS_MODE_ACCENTS[mode as NexusBrowserMode];
  }
  return NEXUS_MODE_ACCENTS.default;
}

/**
 * Safely retrieve the mode description subtitle with fallback to 'default'
 */
export function getNexusModeSubtitle(mode?: NexusBrowserMode | string | null): string {
  if (mode && mode in NEXUS_MODE_SUBTITLES) {
    return NEXUS_MODE_SUBTITLES[mode as NexusBrowserMode];
  }
  return NEXUS_MODE_SUBTITLES.default;
}

