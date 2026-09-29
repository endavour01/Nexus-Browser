import { useEffect, useState, useCallback } from 'react';
import type { BrowserSettings, ModeTelemetry, NexusBrowserMode } from '@shared/types';

export function applyBrowserMode(mode: NexusBrowserMode): void {
  const root = document.documentElement;
  root.dataset.mode = mode;
}

export function applyDistractionReduction(enabled: boolean): void {
  const root = document.documentElement;
  root.dataset.distractionReduction = enabled ? 'true' : 'false';
}

export function useBrowserMode(
  settingsMode: NexusBrowserMode | undefined,
  onUpdateSettings: (settings: Partial<BrowserSettings>) => void
) {
  const activeMode: NexusBrowserMode = settingsMode || 'default';
  const [telemetry, setTelemetry] = useState<ModeTelemetry | null>(null);

  // Apply to DOM attribute
  useEffect(() => {
    applyBrowserMode(activeMode);
    if (window.nexusAPI?.setBrowserMode) {
      window.nexusAPI.setBrowserMode(activeMode).catch(() => {});
    }
  }, [activeMode]);

  // Subscribe to main process telemetry & mode changes
  useEffect(() => {
    if (!window.nexusAPI) return;

    // Initial telemetry fetch
    if (window.nexusAPI.getModeTelemetry) {
      window.nexusAPI.getModeTelemetry().then((t) => setTelemetry(t)).catch(() => {});
    }

    const unsubMode = window.nexusAPI.onModeChanged?.((mode) => {
      if (mode !== activeMode) {
        onUpdateSettings({ mode });
      }
    });

    const unsubTelemetry = window.nexusAPI.onTelemetryUpdated?.((t) => {
      setTelemetry(t);
    });

    return () => {
      unsubMode?.();
      unsubTelemetry?.();
    };
  }, [activeMode, onUpdateSettings]);

  const setMode = useCallback(
    (newMode: NexusBrowserMode) => {
      applyBrowserMode(newMode);
      onUpdateSettings({ mode: newMode });
      if (window.nexusAPI?.setBrowserMode) {
        window.nexusAPI.setBrowserMode(newMode).catch(() => {});
      }
    },
    [onUpdateSettings]
  );

  const optimizeMemory = useCallback(async () => {
    if (window.nexusAPI?.optimizeMemory) {
      const res = await window.nexusAPI.optimizeMemory();
      if (window.nexusAPI.getModeTelemetry) {
        const updated = await window.nexusAPI.getModeTelemetry();
        setTelemetry(updated);
      }
      return res;
    }
    return { freedMemoryMB: 0, suspendedCount: 0 };
  }, []);

  const suspendTab = useCallback(async (tabId: string) => {
    if (window.nexusAPI?.suspendTab) {
      return await window.nexusAPI.suspendTab(tabId);
    }
    return false;
  }, []);

  const wakeTab = useCallback(async (tabId: string) => {
    if (window.nexusAPI?.wakeTab) {
      return await window.nexusAPI.wakeTab(tabId);
    }
    return false;
  }, []);

  const updateModeConfig = useCallback(async (config: Partial<import('@shared/types').ModeBehaviorConfig>) => {
    if (window.nexusAPI?.updateModeConfig) {
      await window.nexusAPI.updateModeConfig(config);
      if (window.nexusAPI.getModeTelemetry) {
        const updated = await window.nexusAPI.getModeTelemetry();
        setTelemetry(updated);
      }
    }
  }, []);

  const restoreDefaults = useCallback(async () => {
    if (window.nexusAPI?.restoreModeDefaults) {
      await window.nexusAPI.restoreModeDefaults();
      if (window.nexusAPI.getModeTelemetry) {
        const updated = await window.nexusAPI.getModeTelemetry();
        setTelemetry(updated);
      }
    }
    applyBrowserMode('default');
    onUpdateSettings({
      mode: 'default',
      performanceTabDiscardTimeout: 180000,
      performanceAutoSuspend: true,
      performanceBackgroundThrottling: true,
      performanceSuspendPinned: false,
      performanceLightweightUI: true,
      balancedDistractionReduction: false,
      balancedMinimalToolbar: false,
    });
  }, [onUpdateSettings]);

  return {
    mode: activeMode,
    setMode,
    telemetry,
    optimizeMemory,
    suspendTab,
    wakeTab,
    updateModeConfig,
    restoreDefaults,
  };
}
