import React, { useState } from 'react';
import { Camera, Mic, MapPin, Bell, Shield, Check, X, ShieldAlert } from 'lucide-react';
import { PermissionPromptRequest, PermissionType } from '@shared/types';

interface SitePermissionPromptModalProps {
  prompt: PermissionPromptRequest | null;
  onRespond: (allow: boolean, remember: boolean) => void;
}

export const SitePermissionPromptModal: React.FC<SitePermissionPromptModalProps> = ({
  prompt,
  onRespond,
}) => {
  const [remember, setRemember] = useState<boolean>(true);

  if (!prompt) return null;

  const getPermissionLabel = (type: PermissionType): { title: string; desc: string; icon: React.ReactNode } => {
    switch (type) {
      case 'camera':
        return {
          title: 'Access your Camera',
          desc: 'This website is requesting video capture capabilities.',
          icon: <Camera size={20} className="prompt-icon-accent" />,
        };
      case 'microphone':
        return {
          title: 'Access your Microphone',
          desc: 'This website is requesting audio recording capabilities.',
          icon: <Mic size={20} className="prompt-icon-accent" />,
        };
      case 'geolocation':
        return {
          title: 'Know your Physical Location',
          desc: 'This website is requesting high-accuracy geographical coordinates.',
          icon: <MapPin size={20} className="prompt-icon-accent" />,
        };
      case 'notifications':
        return {
          title: 'Show System Notifications',
          desc: 'This website is requesting permission to display desktop alerts.',
          icon: <Bell size={20} className="prompt-icon-accent" />,
        };
      default:
        return {
          title: `Access ${type}`,
          desc: `This website is requesting permission for ${type}.`,
          icon: <Shield size={20} className="prompt-icon-accent" />,
        };
    }
  };

  const meta = getPermissionLabel(prompt.permission);

  return (
    <div className="permission-prompt-backdrop">
      <div className="permission-prompt-card">
        <div className="prompt-header">
          <div className="prompt-icon-wrapper">{meta.icon}</div>
          <div className="prompt-text-group">
            <h3 className="prompt-title">{meta.title}</h3>
            <div className="prompt-origin">{prompt.origin}</div>
          </div>
        </div>

        <p className="prompt-desc">{meta.desc}</p>

        <label className="prompt-remember-label">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="prompt-checkbox"
          />
          <span>Remember this decision for this site</span>
        </label>

        <div className="prompt-actions">
          <button
            className="nexus-btn-ghost prompt-btn deny"
            onClick={() => onRespond(false, remember)}
          >
            <X size={14} />
            <span>Block</span>
          </button>
          <button
            className="nexus-btn-primary prompt-btn allow"
            onClick={() => onRespond(true, remember)}
          >
            <Check size={14} />
            <span>Allow</span>
          </button>
        </div>
      </div>
    </div>
  );
};
