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

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

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

  const labelStyle = { color: 'var(--text-primary)', fontWeight: '600' };
  const sublabelStyle = { color: 'var(--text-secondary)' };

  return (
    <div className="space-y-6">
      {/* ───── Theme Default ───── */}
      <section className="flex items-center justify-between p-3 rounded-2xl border" style={{ borderColor: 'var(--glass-border)', background: 'var(--input-bg)' }}>
        <div>
          <h4 className="text-sm font-semibold" style={labelStyle}>Theme Default</h4>
          <p className="text-xs mt-0.5" style={sublabelStyle}>Use the default background color for current theme</p>
        </div>
        <button
          onClick={() => setWallpaper({ wallpaperId: 'none', customWallpaper: null, pexelsData: null })}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-medium ${
            activeId === 'none' ? 'shadow-lg' : 'hover:scale-105'
          }`}
          style={{ 
            borderColor: activeId === 'none' ? 'var(--accent-color)' : 'var(--glass-border)',
            backgroundColor: activeId === 'none' ? 'var(--accent-color)' : 'transparent',
            color: activeId === 'none' ? '#fff' : 'var(--text-primary)'
          }}
        >
          {activeId === 'none' && <Check size={14} />}
          {activeId === 'none' ? 'Active' : 'Restore Default'}
        </button>
      </section>

      <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.5 }} />

      {/* ───── Pexels Wallpapers ───── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm flex items-center gap-2" style={labelStyle}>
            <ImageIcon size={16} style={{ color: 'var(--accent-color)' }} />
            Dynamic Pexels Wallpapers
          </h4>
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="glass-input py-1.5 pl-3 pr-8 text-xs w-40"
              />
              <Search size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="p-2 rounded-xl transition-colors disabled:opacity-50"
              style={{ background: 'var(--accent-color)', color: '#fff' }}
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
                  relative aspect-video rounded-2xl overflow-hidden border-2 transition-all duration-200
                  hover:scale-105 hover:shadow-lg group
                `}
                style={{ borderColor: isActive ? 'var(--accent-color)' : 'var(--glass-border)' }}
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
                    <Check size={16} style={{ color: 'var(--accent-color)' }} />
                  </div>
                )}
              </button>
            );
          })}
          {pexelsPhotos.length === 0 && !isSearching && (
             <div className="col-span-4 py-8 text-center border-2 border-dashed rounded-[24px]" style={{ borderColor: 'var(--glass-border)' }}>
                <p className="text-xs italic" style={sublabelStyle}>Enter a keyword to find wallpapers</p>
             </div>
          )}
        </div>
      </section>

      <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.5 }} />

      {/* ───── Presets ───── */}
      <section className="space-y-3">
        <h4 className="text-sm" style={labelStyle}>Preset Gradients</h4>
        <div className="grid grid-cols-4 gap-2">
          {PRESET_WALLPAPERS.map((wp) => {
            const isActive = activeId === wp.id;
            return (
              <button
                key={wp.id}
                onClick={() => handleSelectPreset(wp)}
                className={`
                  relative aspect-video rounded-2xl overflow-hidden border-2 transition-all duration-200
                  hover:scale-105 hover:shadow-lg
                `}
                style={{ borderColor: isActive ? 'var(--accent-color)' : 'var(--glass-border)' }}
              >
                <div
                  className="absolute inset-0"
                  style={{ background: wp.thumbnail }}
                />
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Check size={16} style={{ color: 'var(--accent-color)' }} />
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

      <hr style={{ borderColor: 'var(--glass-border)', opacity: 0.5 }} />

      {/* ───── Custom upload ───── */}
      <section className="space-y-3">
        <h4 className="text-sm" style={labelStyle}>Custom Upload</h4>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed transition-all text-sm"
            style={{ borderColor: 'var(--glass-border)', color: 'var(--text-secondary)' }}
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
              className="relative w-16 aspect-video rounded-2xl overflow-hidden border-2 transition-all"
              style={{ borderColor: activeId === 'custom' ? 'var(--accent-color)' : 'var(--glass-border)' }}
            >
              <img
                src={state.settings.customWallpaper}
                alt="Custom"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {activeId === 'custom' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Check size={14} style={{ color: 'var(--accent-color)' }} />
                </div>
              )}
            </div>
          )}
        </div>
        <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
          Max 5MB. Stored locally.
        </p>
      </section>
    </div>
  );
}
