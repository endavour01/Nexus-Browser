import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lock,
  Info,
  ShieldX,
} from 'lucide-react';
import { ThreatType } from '@shared/types';

interface MaliciousWarningPageProps {
  url: string;
  onNavigate?: (url: string) => void;
  onGoBack?: () => void;
}

export const MaliciousWarningPage: React.FC<MaliciousWarningPageProps> = ({
  url,
  onNavigate,
  onGoBack,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [proceeding, setProceeding] = useState(false);

  const { destinationUrl, threatType, reason, hostname } = useMemo(() => {
    try {
      const parsed = new URL(url);
      const dest = parsed.searchParams.get('url') || '';
      const threat = (parsed.searchParams.get('threat') || 'malware') as ThreatType;
      const r = parsed.searchParams.get('reason') || 'Identified by NEXUS Shield threat intelligence feed';
      let host = dest;
      try {
        host = new URL(dest).hostname;
      } catch {}
      return { destinationUrl: dest, threatType: threat, reason: r, hostname: host };
    } catch {
      return {
        destinationUrl: url,
        threatType: 'malware' as ThreatType,
        reason: 'Identified as suspicious destination',
        hostname: url,
      };
    }
  }, [url]);

  const threatLabel = useMemo(() => {
    switch (threatType) {
      case 'phishing':
        return 'Deceptive Phishing Destination';
      case 'scam':
        return 'Suspected Fraud or Scam Page';
      case 'deceptive':
        return 'Harmful or Deceptive Content';
      case 'malware':
      default:
        return 'Malicious Website Detected';
    }
  }, [threatType]);

  const threatDescription = useMemo(() => {
    switch (threatType) {
      case 'phishing':
        return 'Attackers on this site may attempt to trick you into revealing personal credentials, passwords, or financial details.';
      case 'scam':
        return 'This site has been reported for deceptive financial offers, fake tech support, or fraudulent schemes.';
      case 'deceptive':
        return 'This site may attempt to manipulate your browser settings or inject unauthorized software onto your device.';
      case 'malware':
      default:
        return 'This site may attempt to install malicious programs on your computer that can damage your device or steal private data.';
    }
  }, [threatType]);

  const handleGoBackSafety = () => {
    if (onGoBack) {
      onGoBack();
    } else if (onNavigate) {
      onNavigate('nexus://newtab');
    }
  };

  const handleProceedUnsafe = async () => {
    if (!destinationUrl) return;
    try {
      setProceeding(true);
      await window.nexusAPI.allowThreatBypass(destinationUrl);
      if (onNavigate) {
        onNavigate(destinationUrl);
      }
    } catch (err) {
      console.error('Failed to allow threat bypass:', err);
    } finally {
      setProceeding(false);
    }
  };

  return (
    <div className="warning-page-container">
      <div className="warning-card">
        {/* Warning Icon & Title */}
        <div className="warning-icon-wrap">
          <ShieldAlert size={56} className="warning-icon" />
        </div>

        <h1 className="warning-heading">{threatLabel}</h1>

        <p className="warning-body">
          NEXUS Shield blocked access to{' '}
          <strong className="warning-target-domain">{hostname || destinationUrl}</strong>.
        </p>

        <p className="warning-subtext">{threatDescription}</p>

        {/* Action Buttons */}
        <div className="warning-actions-row">
          <button
            type="button"
            className="warning-btn-safety"
            onClick={handleGoBackSafety}
          >
            <ArrowLeft size={16} />
            <span>Go Back to Safety</span>
          </button>

          <button
            type="button"
            className="warning-btn-details"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span>Advanced Details</span>
            {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {/* Collapsible Advanced Information */}
        {showAdvanced && (
          <div className="warning-advanced-box">
            <div className="advanced-field">
              <span className="field-title">Destination URL:</span>
              <code className="field-code">{destinationUrl || 'Unknown'}</code>
            </div>

            <div className="advanced-field">
              <span className="field-title">Detection Classification:</span>
              <span className="field-value threat-tag">{threatType.toUpperCase()}</span>
            </div>

            <div className="advanced-field">
              <span className="field-title">Detection Reason:</span>
              <span className="field-value">{reason}</span>
            </div>

            <div className="advanced-notice">
              <Lock size={14} className="text-accent" />
              <span>
                Note: Strict SSL/TLS certificate verification cannot be bypassed. If this site has an invalid or
                expired certificate, the connection will remain strictly terminated.
              </span>
            </div>

            <div className="advanced-actions">
              <button
                type="button"
                className="warning-btn-proceed"
                onClick={handleProceedUnsafe}
                disabled={proceeding}
              >
                <ShieldX size={14} />
                <span>
                  {proceeding ? 'Opening destination...' : 'Proceed to Unsafe Site (Not Recommended)'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
