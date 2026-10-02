import React, { useState } from 'react';
import { Smartphone, Tablet, Monitor, RotateCcw, X, Check } from 'lucide-react';
import { DevicePreset } from '../../../shared/types';

interface ResponsiveDeviceBarProps {
  activeTabId: string | null;
  onClose: () => void;
}

const PRESETS: DevicePreset[] = [
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    width: 393,
    height: 852,
    deviceScaleFactor: 3,
    mobile: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  },
  {
    id: 'pixel-7',
    name: 'Pixel 7',
    width: 412,
    height: 915,
    deviceScaleFactor: 2.6,
    mobile: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
  },
  {
    id: 'ipad-mini',
    name: 'iPad Mini',
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    mobile: true,
  },
  {
    id: 'ipad-pro',
    name: 'iPad Pro 11"',
    width: 834,
    height: 1194,
    deviceScaleFactor: 2,
    mobile: true,
  },
  {
    id: 'laptop',
    name: 'Laptop (1366x768)',
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false,
  },
  {
    id: 'desktop-fhd',
    name: 'Full HD (1920x1080)',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  },
];

export const ResponsiveDeviceBar: React.FC<ResponsiveDeviceBarProps> = ({ activeTabId, onClose }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('iphone-14-pro');
  const [width, setWidth] = useState<number>(393);
  const [height, setHeight] = useState<number>(852);
  const [scaleFactor, setScaleFactor] = useState<number>(3);
  const [isMobile, setIsMobile] = useState<boolean>(true);

  const api = window.nexusAPI;

  const applyPreset = async (preset: DevicePreset) => {
    if (!api || !activeTabId) return;
    setSelectedPresetId(preset.id);
    setWidth(preset.width);
    setHeight(preset.height);
    setScaleFactor(preset.deviceScaleFactor);
    setIsMobile(preset.mobile);
    await api.setDeviceEmulation(activeTabId, preset);
  };

  const applyCustomDimensions = async (w: number, h: number) => {
    if (!api || !activeTabId) return;
    setWidth(w);
    setHeight(h);
    const customPreset: DevicePreset = {
      id: 'custom',
      name: 'Custom',
      width: w,
      height: h,
      deviceScaleFactor: scaleFactor,
      mobile: isMobile,
    };
    await api.setDeviceEmulation(activeTabId, customPreset);
  };

  const handleRotate = async () => {
    const newWidth = height;
    const newHeight = width;
    await applyCustomDimensions(newWidth, newHeight);
  };

  const handleExit = async () => {
    if (api && activeTabId) {
      await api.setDeviceEmulation(activeTabId, null);
    }
    onClose();
  };

  return (
    <div className="responsive-device-bar bg-[#12151D] border border-[#272C3D] text-[#F4F4F5] shadow-2xl rounded-lg px-4 py-2 flex items-center gap-3">
      <div className="responsive-bar-left flex items-center gap-2.5">
        <span className="responsive-tag flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#8B5CF6]/15 text-[#A78BFA] text-xs font-semibold border border-[#8B5CF6]/30">
          <Smartphone size={13} />
          <span>Device Emulation</span>
        </span>

        <select
          className="responsive-select bg-[#0B0D12] text-[#F4F4F5] border border-[#1C202C] hover:border-[#272C3D] px-2.5 py-1 rounded text-xs outline-none cursor-pointer"
          value={selectedPresetId}
          onChange={(e) => {
            const preset = PRESETS.find((p) => p.id === e.target.value);
            if (preset) applyPreset(preset);
          }}
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id} className="bg-[#0B0D12] text-[#F4F4F5]">
              {p.name} ({p.width} × {p.height})
            </option>
          ))}
        </select>
      </div>

      <div className="responsive-bar-center flex items-center gap-2.5">
        <div className="dimension-inputs flex items-center gap-1.5 bg-[#0B0D12] border border-[#1C202C] px-2 py-1 rounded">
          <input
            type="number"
            className="dimension-num bg-transparent text-[#F4F4F5] text-xs text-center w-12 font-mono outline-none"
            value={width}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 320;
              applyCustomDimensions(val, height);
            }}
          />
          <span className="dimension-x text-[#575D6E] text-xs">×</span>
          <input
            type="number"
            className="dimension-num bg-transparent text-[#F4F4F5] text-xs text-center w-12 font-mono outline-none"
            value={height}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 480;
              applyCustomDimensions(width, val);
            }}
          />
          <span className="dimension-unit text-[#575D6E] text-[10px]">px</span>
        </div>

        <button
          type="button"
          className="responsive-action-btn flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#191D28] hover:bg-[#222838] text-[#F4F4F5] border border-[#272C3D] text-xs font-medium cursor-pointer transition-colors"
          onClick={handleRotate}
          title="Rotate Orientation"
        >
          <RotateCcw size={13} />
          <span>Rotate</span>
        </button>
      </div>

      <div className="responsive-bar-right flex items-center gap-2.5">
        <span className="scale-indicator px-2 py-1 rounded bg-[#0B0D12] text-[#9298A8] border border-[#1C202C] text-xs font-mono">
          {scaleFactor}x DPR
        </span>
        <button
          type="button"
          className="responsive-close-btn flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-semibold cursor-pointer transition-colors"
          onClick={handleExit}
          title="Exit Responsive Mode"
        >
          <X size={14} />
          <span>Exit</span>
        </button>
      </div>
    </div>
  );
};
