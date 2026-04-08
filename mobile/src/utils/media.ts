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

export const resolveBackdropUrl = (backdrop?: string | null, poster?: string | null): string => {
  if (backdrop) {
    if (backdrop.startsWith('http://') || backdrop.startsWith('https://') || backdrop.startsWith('data:image/')) {
      return backdrop;
    }

    if (backdrop.startsWith('/')) {
      return `https://image.tmdb.org/t/p/w1280${backdrop}`;
    }

    return `https://image.tmdb.org/t/p/w1280/${backdrop}`;
  }

  return resolvePosterUrl(poster);
};

export const getPosterFallbackUrl = () => POSTER_FALLBACK;