const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;
const BASE_URL = 'https://api.pexels.com/v1';

/**
 * Fetch wallpapers from Pexels based on a query.
 * @param {string} query - Search query for wallpapers
 * @param {number} perPage - Number of results to fetch
 * @returns {Promise<Array>} List of wallpaper objects
 */
export const fetchPexelsWallpapers = async (query = 'wallpaper', perPage = 10) => {
  if (!PEXELS_API_KEY) {
    console.warn('Pexels API Key is missing');
    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=${perPage}`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.photos.map((photo) => ({
      id: photo.id,
      url: photo.src.original,
      preview: photo.src.large,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      pexelsUrl: photo.url,
    }));
  } catch (error) {
    console.error('Failed to fetch Pexels wallpapers:', error);
    return [];
  }
};
