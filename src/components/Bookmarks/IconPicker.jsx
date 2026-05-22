import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import Modal from '../UI/Modal';

// A curated list of good icons for bookmark sections
const AVAILABLE_ICONS = [
  'Folder', 'FolderOpen', 'File', 'FileText', 'FileCode', 'FileImage',
  'Code', 'Terminal', 'Database', 'Server', 'Cloud', 'Cpu', 'Monitor', 'Smartphone',
  'Layout', 'LayoutDashboard', 'PenTool', 'Palette', 'Figma', 'Image', 'Video',
  'Briefcase', 'Coffee', 'Book', 'BookOpen', 'Bookmark', 'GraduationCap',
  'Heart', 'Star', 'ThumbsUp', 'Flame', 'Zap', 'Lightbulb', 'Rocket', 'Target',
  'Compass', 'Map', 'Globe', 'Plane', 'ShoppingCart', 'ShoppingBag', 'CreditCard',
  'DollarSign', 'Home', 'Building', 'Inbox', 'Mail', 'MessageSquare', 'Phone',
  'Calendar', 'Clock', 'Activity', 'Music', 'Headphones', 'Camera', 'Play',
  'Link', 'Share2', 'Users', 'User', 'Settings', 'Shield', 'Lock', 'Key'
];

export default function IconPicker({ isOpen, onClose, currentIcon, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIcons = AVAILABLE_ICONS.filter(iconName => 
    iconName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Icon" maxWidth="max-w-md">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search icons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glass-input w-full py-2.5 px-4 text-sm"
          autoFocus
        />

        <div className="grid grid-cols-6 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar p-1">
          {filteredIcons.map((iconName) => {
            const IconComponent = Icons[iconName];
            if (!IconComponent) return null;
            
            const isSelected = currentIcon === iconName;

            return (
              <button
                key={iconName}
                onClick={() => {
                  onSelect(iconName);
                  onClose();
                }}
                className={`p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isSelected 
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                    : 'text-gray-400 hover:text-brand-400 hover:bg-white/5'
                }`}
                title={iconName}
              >
                <IconComponent size={20} strokeWidth={isSelected ? 2.5 : 2} />
              </button>
            );
          })}
        </div>

        {filteredIcons.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No icons found matching "{searchTerm}"
          </div>
        )}
      </div>
    </Modal>
  );
}
