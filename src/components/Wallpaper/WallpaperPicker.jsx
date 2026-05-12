import React, { useRef } from 'react';
import { Upload, Check, Search, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PRESET_WALLPAPERS } from '../../utils/constants';
import { fetchPexelsWallpapers } from '../../services/pexels';

export default function WallpaperPicker() {
  const { state, setWallpaper, updateSettings } = useApp();
  const fileInputRef = useRef(null);
  const [pexelsPhotos, setPexelsPhotos] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [query, setQuery] = React.useState(state.settings.pexelsQuery || 'nature');

  const activeId = state.settings.wallpaperId;

  // Load initial pexels photos if in pexels mode
  React.useEffect(() => {
    if (activeId === 'pexels' && pexelsPhotos.length === 0) {
      handleSearch();
    }
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    const photos = await fetchPexelsWallpapers(query, 12);
    setPexelsPhotos(photos);
    setIsSearching(false);
    updateSettings({ pexelsQuery: query });
  };

  const handleSelectPreset = (wallpaper) => {
    setWallpaper({
      wallpaperId: wallpaper.id,
      customWallpaper: null,
      pexelsData: null,
    });
  };

  const handleSelectPexels = (photo) => {
    setWallpaper({
      wallpaperId: 'pexels',
      customWallpaper: null,
      pexelsData: photo,
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
        pexelsData: null,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* ───── Pexels Wallpapers ───── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <ImageIcon size={16} className="text-brand-400" />
            Dynamic Pexels Wallpapers
          </h4>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Pexels..."
                className="glass-input py-1.5 pl-3 pr-8 text-xs w-40"
              />
              <Search size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="p-2 rounded-lg bg-brand-600/20 text-brand-400 hover:bg-brand-600/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSearching ? 'animate-spin' : ''} />
            </button>
          </form>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {pexelsPhotos.map((photo) => {
            const isActive = activeId === 'pexels' && state.settings.pexelsData?.id === photo.id;
            return (
              <button
                key={photo.id}
                onClick={() => handleSelectPexels(photo)}
                className={`
                  relative aspect-video rounded-xl overflow-hidden border-2 transition-all duration-200
                  hover:scale-105 hover:shadow-lg group
                  ${isActive
                    ? 'border-brand-500 shadow-brand-900/30 shadow-lg'
                    : 'border-white/10 hover:border-white/20'
                  }
                `}
              >
                <img
                  src={photo.preview}
                  alt={`By ${photo.photographer}`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/60 translate-y-full group-hover:translate-y-0 transition-transform">
                   <p className="text-[8px] text-white truncate">Photo by {photo.photographer}</p>
                </div>
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Check size={16} className="text-brand-400" />
                  </div>
                )}
              </button>
            );
          })}
          {pexelsPhotos.length === 0 && !isSearching && (
             <div className="col-span-4 py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                <p className="text-xs text-gray-600 italic">Enter a keyword and click refresh to find wallpapers</p>
             </div>
          )}
          {isSearching && pexelsPhotos.length === 0 && (
            <div className="col-span-4 py-8 flex justify-center">
               <RefreshCw size={24} className="text-brand-500 animate-spin" />
            </div>
          )}
        </div>
      </section>

      <hr className="border-white/5" />

      {/* ───── Presets ───── */}
      <section className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Preset Gradients</h4>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_WALLPAPERS.map((wp) => {
            const isActive = activeId === wp.id;
            return (
              <button
                key={wp.id}
                onClick={() => handleSelectPreset(wp)}
                className={`
                  relative aspect-video rounded-xl overflow-hidden border-2 transition-all duration-200
                  hover:scale-105 hover:shadow-lg
                  ${isActive
                    ? 'border-brand-500 shadow-brand-900/30 shadow-lg'
                    : 'border-white/10 hover:border-white/20'
                  }
                `}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: wp.thumbnail }}
                />
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Check size={16} className="text-brand-400" />
                  </div>
                )}
                <span className="absolute bottom-0.5 left-1 text-[8px] text-white/50 font-medium">
                  {wp.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <hr className="border-white/5" />

      {/* ───── Custom upload ───── */}
      <section className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">Custom Upload</h4>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/15 hover:border-brand-600/30 text-gray-400 hover:text-brand-300 transition-all text-sm"
          >
            <Upload size={16} />
            Upload File
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
        <p className="text-[11px] text-gray-600 text-center">
          Max 5MB. Stored locally.
        </p>
      </section>
    </div>
  );
}
