import React, { useState, useEffect } from 'react';
import { FolderPlus, Hash, Save } from 'lucide-react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';

export default function SectionForm({ isOpen, onClose, onSave, section = null }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Folder');

  useEffect(() => {
    if (section) {
      setName(section.name || '');
      setIcon(section.icon || 'Folder');
    } else {
      setName('');
      setIcon('Folder');
    }
  }, [section, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={section ? 'Edit Section' : 'Create New Section'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Hash size={14} className="text-brand-400" />
              Section Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Work, Research, Social"
              className="glass-input w-full py-3 px-4 text-sm"
              autoFocus
            />
          </div>

          <div className="p-4 rounded-xl bg-brand-600/5 border border-brand-600/10 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-brand-600/20 text-brand-400">
              <FolderPlus size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-300 font-medium mb-1">Organization Tip</p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Use specific names to keep your dashboard organized. You can move bookmarks between sections anytime by dragging them.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="flex-1 py-2.5"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1 py-2.5"
            icon={Save}
            disabled={!name.trim()}
          >
            {section ? 'Save Changes' : 'Create Section'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
