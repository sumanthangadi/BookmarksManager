import React, { useState, useEffect } from 'react';
import { Link, Globe } from 'lucide-react';
import Modal from '../UI/Modal';
import Button from '../UI/Button';
import { getFaviconUrl } from '../../utils/constants';

export default function BookmarkForm({
  isOpen,
  onClose,
  onSave,
  bookmark,
  sections,
  defaultSectionId,
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [error, setError] = useState('');

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      if (bookmark) {
        setTitle(bookmark.title || '');
        setUrl(bookmark.url || '');
        setSectionId(bookmark.sectionId || defaultSectionId || '');
      } else {
        setTitle('');
        setUrl('');
        setSectionId(defaultSectionId || (sections[0]?.id || ''));
      }
      setError('');
    }
  }, [isOpen, bookmark, defaultSectionId, sections]);

  const validateUrl = (urlStr) => {
    try {
      // Add protocol if missing
      const withProtocol = urlStr.match(/^https?:\/\//) ? urlStr : `https://${urlStr}`;
      new URL(withProtocol);
      return withProtocol;
    } catch {
      return null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!url.trim()) {
      setError('URL is required');
      return;
    }

    const validUrl = validateUrl(url.trim());
    if (!validUrl) {
      setError('Please enter a valid URL');
      return;
    }

    if (!sectionId) {
      setError('Please select a section');
      return;
    }

    onSave({
      title: title.trim(),
      url: validUrl,
      sectionId,
    });
  };

  const faviconPreview = url ? getFaviconUrl(validateUrl(url) || url) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={bookmark ? 'Edit Bookmark' : 'Add Bookmark'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Favicon preview */}
        {faviconPreview && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 animate-fade-in">
            <img src={faviconPreview} alt="" className="w-6 h-6 rounded" />
            <span className="text-sm text-gray-400 truncate">
              {url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') || 'Preview'}
            </span>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title
          </label>
          <div className="relative">
            <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Bookmark"
              className="glass-input w-full py-2.5 pl-10 pr-4 text-sm"
              id="bookmark-title-input"
              autoFocus
            />
          </div>
        </div>

        {/* URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            URL
          </label>
          <div className="relative">
            <Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="glass-input w-full py-2.5 pl-10 pr-4 text-sm"
              id="bookmark-url-input"
            />
          </div>
        </div>

        {/* Section */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Section
          </label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="glass-input w-full py-2.5 px-4 text-sm appearance-none cursor-pointer"
            id="bookmark-section-select"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id} className="bg-gray-900 text-white">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm animate-fade-in">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {bookmark ? 'Save Changes' : 'Add Bookmark'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
