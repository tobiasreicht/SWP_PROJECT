const POSTER_FALLBACK = 'https://placehold.co/300x450/111827/e5e7eb?text=No+Poster';

export const resolvePosterUrl = (poster?: string | null): string => {
  if (!poster) return POSTER_FALLBACK;

  if (poster.startsWith('http://') || poster.startsWith('https://') || poster.startsWith('data:image/')) {
    return poster;
  }

  if (poster.startsWith('/')) {
    return `https://image.tmdb.org/t/p/w500${poster}`;
  }

  return `https://image.tmdb.org/t/p/w500/${poster}`;
};

export const getPosterFallbackUrl = () => POSTER_FALLBACK;
