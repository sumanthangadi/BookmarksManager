import React, { useState, useEffect, useRef } from 'react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { Save } from 'lucide-react';

export default function SaveSessionModal({ isOpen, onClose, onSave, loading }) {
  const [name, setName] = useState('');
  const inputRef = useRef(null);

  // Pre-fill with a readable date/time each time the modal opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const formatted = now.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      setName(`Session — ${formatted}`);
      // Focus the input after a tick so the modal has rendered
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Current Session">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="session-name-input"
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Session Name
          </label>
          <input
            ref={inputRef}
            id="session-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Work Research, Shopping..."
            className="glass-input w-full px-4 py-3 text-sm"
            maxLength={100}
            autoFocus
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={Save}
            loading={loading}
            disabled={!name.trim() || loading}
          >
            Save Session
          </Button>
        </div>
      </form>
    </Modal>
  );
}
