import React, { useEffect, useRef, useState } from 'react';
import { NexusBrowserMode } from '@shared/types';
import { Check, ShieldCheck, ShieldAlert, MousePointerClick } from 'lucide-react';
import { MODE_OPTIONS } from './mode-options';
import { Button, Modal } from './ui';
import './mode-onboarding.css';

interface ModeOnboardingModalProps {
  isOpen: boolean;
  currentMode: NexusBrowserMode;
  onSelectMode: (mode: NexusBrowserMode) => void;
  onComplete: () => void;
}

const STEP_COUNT = 3;

export const ModeOnboardingModal: React.FC<ModeOnboardingModalProps> = ({
  isOpen,
  currentMode,
  onSelectMode,
  onComplete,
}) => {
  const [step, setStep] = useState(0);
  const [selectedMode, setSelectedMode] = useState(currentMode);
  const modeOptionRefs = useRef<Partial<Record<NexusBrowserMode, HTMLButtonElement | null>>>({});

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setSelectedMode(currentMode);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = document.querySelector<HTMLElement>('.mode-onboarding-dialog');
    const focusable = () => Array.from(
      dialog?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])'
      ) || []
    ).filter((element) => element.getAttribute('aria-hidden') !== 'true');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onComplete();
        return;
      }

      if (event.key === 'Tab') {
        const elements = focusable();
        if (elements.length === 0) return;
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
        return;
      }

      if (event.key === 'Enter' && event.target === dialog) {
        event.preventDefault();
        setStep((current) => Math.min(current + 1, STEP_COUNT - 1));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onComplete, onSelectMode, selectedMode, step]);

  useEffect(() => {
    if (!isOpen) return;
    document.querySelector<HTMLElement>('.mode-onboarding-dialog')
      ?.querySelector<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), [tabindex]:not([tabindex="-1"])')
      ?.focus();
  }, [isOpen]);

  const chooseMode = (mode: NexusBrowserMode) => {
    setSelectedMode(mode);
    onSelectMode(mode);
  };

  const handleModeKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, modeId: NexusBrowserMode) => {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = MODE_OPTIONS.findIndex((mode) => mode.id === (selectedMode || modeId));
    const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    const nextMode = MODE_OPTIONS[(currentIndex + direction + MODE_OPTIONS.length) % MODE_OPTIONS.length].id;
    chooseMode(nextMode);
    modeOptionRefs.current[nextMode]?.focus();
  };

  const goNext = () => {
    if (step === STEP_COUNT - 1) {
      onComplete();
    } else {
      setStep((current) => Math.min(current + 1, STEP_COUNT - 1));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onComplete}
      closeOnEscape={false}
      closeOnBackdrop={false}
      title="Welcome to NEXUS"
      size="lg"
      className="mode-onboarding-dialog"
      footer={(
        <div className="mode-onboarding-footer">
          <Button variant="ghost" size="sm" onClick={onComplete}>Skip</Button>
          <div className="mode-onboarding-navigation">
            <Button variant="secondary" size="sm" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>
              Back
            </Button>
            <Button variant="primary" size="sm" onClick={goNext}>
              {step === STEP_COUNT - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      )}
    >
      <div className="mode-onboarding-content" tabIndex={-1}>
        <div className="mode-onboarding-progress" aria-label={`Step ${step + 1} of ${STEP_COUNT}`}>
          {Array.from({ length: STEP_COUNT }, (_, index) => (
            <span key={index} className={index <= step ? 'is-current' : ''} />
          ))}
          <span className="mode-onboarding-step-label">{step + 1} / {STEP_COUNT}</span>
        </div>

        {step === 0 && (
          <section className="mode-onboarding-step" aria-labelledby="onboarding-modes-title">
            <h3 id="onboarding-modes-title">Choose how NEXUS feels and performs</h3>
            <p className="mode-onboarding-lead">Switch modes any time from the address bar.</p>
            <div className="mode-onboarding-mode-grid">
              {MODE_OPTIONS.map((mode) => (
                <article className="mode-onboarding-mode-card" key={mode.id}>
                  <div className="mode-onboarding-mode-heading">
                    <span className="mode-onboarding-icon">{mode.icon}</span>
                    <h4>{mode.name}</h4>
                  </div>
                  <p>{mode.description}</p>
                  <div className="mode-onboarding-swatches" aria-label={`${mode.name} palette`}>
                    {mode.palette.map((color) => (
                      <span key={color} style={{ backgroundColor: color }} title={color} />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="mode-onboarding-step" aria-labelledby="onboarding-pick-title">
            <h3 id="onboarding-pick-title">Pick a starting mode</h3>
            <p className="mode-onboarding-lead">Your choice applies immediately. You can change it later.</p>
            <div className="mode-onboarding-choice-list" role="radiogroup" aria-label="Choose a NEXUS mode">
              {MODE_OPTIONS.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  role="radio"
                  aria-checked={selectedMode === mode.id}
                  data-mode-option={mode.id}
                  className={`mode-onboarding-choice ${selectedMode === mode.id ? 'is-selected' : ''}`}
                  style={{ '--mode-accent': mode.accentColor } as React.CSSProperties}
                  onClick={() => chooseMode(mode.id)}
                  onKeyDown={(event) => handleModeKeyDown(event, mode.id)}
                  ref={(element) => { modeOptionRefs.current[mode.id] = element; }}
                >
                  <span className="mode-onboarding-icon">{mode.icon}</span>
                  <span className="mode-onboarding-choice-copy">
                    <strong>{mode.name}</strong>
                    <span>{mode.description}</span>
                  </span>
                  <span className="mode-onboarding-choice-check" aria-hidden="true">{selectedMode === mode.id && <Check size={15} />}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="mode-onboarding-step mode-onboarding-shield" aria-labelledby="onboarding-shield-title">
            <span className="mode-onboarding-shield-icon"><ShieldCheck size={28} /></span>
            <h3 id="onboarding-shield-title">NEXUS Shield is on guard</h3>
            <p className="mode-onboarding-lead">
              Shield blocks ads and trackers, blocks pop-ups, and warns you about phishing sites.
            </p>
            <div className="mode-onboarding-shield-hint">
              <ShieldAlert size={16} />
              <span>Open the Shield control beside the address bar to review protection for the current site.</span>
              <MousePointerClick size={15} />
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
};