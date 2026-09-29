import React from 'react';

interface NexusTooltipProps {
  label: string;
  shortcut?: string;
  children: React.ReactElement;
}

export const NexusTooltip: React.FC<NexusTooltipProps> = ({ label, shortcut, children }) => {
  const tip = shortcut ? `${label} (${shortcut})` : label;
  return (
    <span className="nexus-tooltip-wrap">
      {React.cloneElement(children, {
        title: tip,
        'aria-label': label,
      })}
      <span className="nexus-tooltip" role="tooltip">
        <span>{label}</span>
        {shortcut ? <kbd className="nexus-tooltip-kbd">{shortcut}</kbd> : null}
      </span>
    </span>
  );
};
