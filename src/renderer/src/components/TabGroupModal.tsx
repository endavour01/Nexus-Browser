import React, { useEffect, useState } from 'react';
import { TAB_GROUP_COLORS, TabGroup } from '@shared/types';
import { Modal } from './ui/Modal/Modal';

interface TabGroupModalProps {
  isOpen: boolean;
  group: TabGroup | null;
  nextColorIndex: number;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}

export const TabGroupModal: React.FC<TabGroupModalProps> = ({
  isOpen,
  group,
  nextColorIndex,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(TAB_GROUP_COLORS[0].value);

  useEffect(() => {
    if (!isOpen) return;
    setName(group?.name || '');
    setColor(group?.color || TAB_GROUP_COLORS[nextColorIndex % TAB_GROUP_COLORS.length].value);
  }, [group, isOpen, nextColorIndex]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) onSave(trimmedName, color);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={group ? 'Edit Tab Group' : 'New Tab Group'}
      size="sm"
      footer={(
        <>
          <button type="button" className="modal-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" form="tab-group-form" className="modal-btn-primary" disabled={!name.trim()}>
            {group ? 'Save Group' : 'Create Group'}
          </button>
        </>
      )}
    >
      <form id="tab-group-form" className="tab-group-editor" onSubmit={handleSubmit}>
        <label className="form-label" htmlFor="tab-group-name">Group name</label>
        <input
          id="tab-group-name"
          className="form-input"
          autoFocus
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Research"
        />
        <fieldset className="tab-group-color-fieldset">
          <legend className="form-label">Group color</legend>
          <div className="tab-group-color-options" role="radiogroup" aria-label="Group color">
            {TAB_GROUP_COLORS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={color === option.value}
                aria-label={option.name}
                title={option.name}
                className={`tab-group-color-swatch ${color === option.value ? 'selected' : ''}`}
                style={{ backgroundColor: option.value }}
                onClick={() => setColor(option.value)}
              />
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
};