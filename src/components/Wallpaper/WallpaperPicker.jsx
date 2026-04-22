import React, { useRef } from 'react';
import { Upload, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PRESET_WALLPAPERS } from '../../utils/constants';

export default function WallpaperPicker() {
  const { state, setWallpaper } = useApp();
  const fileInputRef = useRef(null);

  const activeId = state.settings.customWallpaper ? 'custom' : state.settings.wallpaperId;

  const handleSelectPreset = (wallpaper) => {
    setWallpaper({
      wallpaperId: wallpaper.id,
      customWallpaper: null,
    });
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setWallpaper({
        wallpaperId: 'custom',
        customWallpaper: event.target.result,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-gray-300">Wallpaper</h4>

      {/* Preset grid */}
      <div className="grid grid-cols-4 gap-2">
        {PRESET_WALLPAPERS.map((wp) => (
          <button
            key={wp.id}
            onClick={() => handleSelectPreset(wp)}
            className={`
              relative aspect-video rounded-xl overflow-hidden border-2 transition-all duration-200
              hover:scale-105 hover:shadow-lg
              ${activeId === wp.id
                ? 'border-brand-500 shadow-brand-900/30 shadow-lg'
                : 'border-white/10 hover:border-white/20'
              }
            `}
            aria-label={wp.name}
          >
            <div
              className="absolute inset-0"
              style={{ background: wp.thumbnail }}
            />
            {activeId === wp.id && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Check size={16} className="text-brand-400" />
              </div>
            )}
            <span className="absolute bottom-0.5 left-1 text-[8px] text-white/50 font-medium">
              {wp.name}
            </span>
          </button>
        ))}
      </div>

      {/* Custom upload */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/15 hover:border-brand-600/30 text-gray-400 hover:text-brand-300 transition-all text-sm"
        >
          <Upload size={16} />
          Upload Custom Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />

        {state.settings.customWallpaper && (
          <div
            className={`
              relative w-16 aspect-video rounded-xl overflow-hidden border-2 transition-all
              ${activeId === 'custom' ? 'border-brand-500' : 'border-white/10'}
            `}
          >
            <img
              src={state.settings.customWallpaper}
              alt="Custom wallpaper"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {activeId === 'custom' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Check size={14} className="text-brand-400" />
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-600">
        Max 5MB. Stored locally in your browser.
      </p>
    </div>
  );
}
