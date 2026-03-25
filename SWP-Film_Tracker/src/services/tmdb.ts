/**
 * Direct TMDB API service — bypasses the local backend for movie data.
 * Returns objects shaped like { data: Movie[] } so it's a drop-in
 * replacement for the moviesAPI from api.ts.
 */

import type { Movie, StreamingPlatform } from '../types';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';
const TOKEN = import.meta.env.VITE_TMDB_READ_TOKEN as string;

// ── TMDB genre IDs → readable names ──────────────────────────────────────────
const GENRE_ID_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  // TV-only
  10759: 'Action & Adventure',
  10762: 'Kids',
  10765: 'Sci-Fi & Fantasy',
};

// Reverse map: name → TMDB genre ID (for discover queries)
const GENRE_NAME_MAP: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Drama: 18,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Romance: 10749,
  'Sci-Fi': 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
  Documentary: 99,
  Biography: 99,
  Family: 10751,
};

// Streaming provider ID → our StreamingPlatform name
const PROVIDER_MAP: Record<number, StreamingPlatform['platform']> = {
  8: 'Netflix',
  9: 'Prime Video',
  119: 'Prime Video',
  337: 'Disney+',
  2: 'Apple TV+',
  384: 'HBO Max',
  15: 'Hulu',
};

// ── Low-level fetch helper ────────────────────────────────────────────────────
async function tmdbFetch<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('language', 'en-US');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

// ── TMDB result → our Movie type ─────────────────────────────────────────────
function mapItem(item: any, forcedType?: 'movie' | 'tv'): Movie {
  const mediaType: 'movie' | 'tv' =
    forcedType ?? (item.media_type === 'tv' || item.name ? 'tv' : 'movie');

  const genreIds: number[] = item.genre_ids ?? (item.genres?.map((g: any) => g.id) ?? []);

  return {
    id: String(item.id),
    tmdbId: item.id,
    title: item.title ?? item.name ?? 'Unknown',
    description: item.overview ?? '',
    releaseDate: new Date(item.release_date ?? item.first_air_date ?? '2000-01-01'),
    type: mediaType === 'tv' ? 'series' : 'movie',
    genres: genreIds.map(id => GENRE_ID_MAP[id]).filter(Boolean),
    director: item._director,
    cast: item._cast ?? [],
    poster: item.poster_path ? `${TMDB_IMG}/w500${item.poster_path}` : '',
    backdrop: item.backdrop_path ? `${TMDB_IMG}/w1280${item.backdrop_path}` : '',
    runtime: item.runtime ?? item.episode_run_time?.[0],
    rating: item.vote_average ?? 0,
    trailerUrl: item._trailerUrl ?? null,
    streamingPlatforms: item._platforms ?? [],
  };
}

// Filter out items with no poster and very low vote counts
function qualityFilter(items: any[]): any[] {
  return items.filter(i => i.poster_path && (i.vote_count ?? 0) > 20);
}

// ── Public API (same shape as moviesAPI in api.ts) ───────────────────────────

export const moviesAPI = {
  /** Paginated popular movies — replaces getAll */
  getAll: async (page = 1, _limit = 20): Promise<{ data: Movie[] }> => {
    const [movieRes, tvRes] = await Promise.all([
      tmdbFetch<any>('/movie/popular', { page }),
      tmdbFetch<any>('/tv/popular', { page }),
    ]);
    const movies = qualityFilter(movieRes.results ?? []).map(i => mapItem(i, 'movie'));
    const series = qualityFilter(tvRes.results ?? []).map(i => mapItem(i, 'tv'));
    // Interleave: 3 movies + 1 series for variety
    const mixed: Movie[] = [];
    let mi = 0, si = 0;
    while (mi < movies.length || si < series.length) {
      for (let k = 0; k < 3 && mi < movies.length; k++) mixed.push(movies[mi++]);
      if (si < series.length) mixed.push(series[si++]);
    }
    return { data: mixed };
  },

  /** Trending this week (movies + TV) */
  getTrending: async (): Promise<{ data: Movie[] }> => {
    const [movieRes, tvRes] = await Promise.all([
      tmdbFetch<any>('/trending/movie/week'),
      tmdbFetch<any>('/trending/tv/week'),
    ]);
    const movies = qualityFilter(movieRes.results ?? []).map(i => mapItem(i, 'movie'));
    const series = qualityFilter(tvRes.results ?? []).map(i => mapItem(i, 'tv'));
    const mixed: Movie[] = [];
    let mi = 0, si = 0;
    while (mi < movies.length || si < series.length) {
      for (let k = 0; k < 3 && mi < movies.length; k++) mixed.push(movies[mi++]);
      if (si < series.length) mixed.push(series[si++]);
    }
    return { data: mixed };
  },

  /** Now playing in cinemas + currently airing TV */
  getNewReleases: async (): Promise<{ data: Movie[] }> => {
    const [movieRes, tvRes] = await Promise.all([
      tmdbFetch<any>('/movie/now_playing'),
      tmdbFetch<any>('/tv/on_the_air'),
    ]);
    const movies = qualityFilter(movieRes.results ?? []).map(i => mapItem(i, 'movie'));
    const series = qualityFilter(tvRes.results ?? []).map(i => mapItem(i, 'tv'));
    return { data: [...movies, ...series] };
  },

  /** Discover by genre name */
  getByGenre: async (genre: string): Promise<{ data: Movie[] }> => {
    const genreId = GENRE_NAME_MAP[genre];
    if (!genreId) return { data: [] };
    const [movieRes, tvRes] = await Promise.all([
      tmdbFetch<any>('/discover/movie', { with_genres: genreId, sort_by: 'popularity.desc' }),
      tmdbFetch<any>('/discover/tv', { with_genres: genreId, sort_by: 'popularity.desc' }),
    ]);
    const movies = qualityFilter(movieRes.results ?? []).map(i => mapItem(i, 'movie'));
    const series = qualityFilter(tvRes.results ?? []).map(i => mapItem(i, 'tv'));
    return { data: [...movies, ...series] };
  },

  /** Full-text search (movies + TV) */
  search: async (query: string): Promise<{ data: Movie[] }> => {
    const res = await tmdbFetch<any>('/search/multi', { query, include_adult: 'false' });
    const results = (res.results ?? [])
      .filter((i: any) => (i.media_type === 'movie' || i.media_type === 'tv') && i.poster_path)
      .map((i: any) => mapItem(i));
    return { data: results };
  },

  /** Single movie/TV details with cast, trailer, and streaming providers */
  getById: async (id: string): Promise<{ data: Movie }> => {
    // Try movie first, fall back to TV
    let rawItem: any;
    let mediaType: 'movie' | 'tv' = 'movie';
    try {
      rawItem = await tmdbFetch<any>(`/movie/${id}`, { append_to_response: 'credits,videos,watch/providers' });
    } catch {
      rawItem = await tmdbFetch<any>(`/tv/${id}`, { append_to_response: 'credits,videos,watch/providers' });
      mediaType = 'tv';
    }

    // Director / creator
    const crew: any[] = rawItem.credits?.crew ?? [];
    const director =
      crew.find((c: any) => c.job === 'Director')?.name ??
      (rawItem.created_by?.[0]?.name as string | undefined);

    // Top 6 cast members
    const cast: string[] = (rawItem.credits?.cast ?? [])
      .slice(0, 6)
      .map((c: any) => c.name as string);

    // YouTube trailer
    const videos: any[] = rawItem.videos?.results ?? [];
    const trailer = videos.find(
      (v: any) => v.site === 'YouTube' && v.type === 'Trailer'
    );
    const trailerUrl = trailer
      ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&loop=1`
      : null;

    // Streaming platforms — try DE first, then AT, then US
    const providers = rawItem['watch/providers']?.results ?? {};
    const regionData = providers.DE ?? providers.AT ?? providers.US ?? {};
    const flatrate: any[] = regionData.flatrate ?? [];
    const title = encodeURIComponent(rawItem.title ?? rawItem.name ?? '');

    const PLATFORM_URLS: Record<StreamingPlatform['platform'], string> = {
      'Netflix':     `https://www.netflix.com/search?q=${title}`,
      'Prime Video': `https://www.primevideo.com/search/ref=atv_nb_sug_title?phrase=${title}`,
      'Disney+':     `https://www.disneyplus.com/search/${title}`,
      'Apple TV+':   `https://tv.apple.com/search?term=${title}`,
      'HBO Max':     `https://www.max.com/search?q=${title}`,
      'Hulu':        `https://www.hulu.com/search?q=${title}`,
    };

    const streamingPlatforms: StreamingPlatform[] = flatrate
      .filter((p: any) => PROVIDER_MAP[p.provider_id])
      .map((p: any) => {
        const platform = PROVIDER_MAP[p.provider_id];
        return { platform, url: PLATFORM_URLS[platform] };
      })
      // Deduplicate by platform name (e.g. two Prime Video provider IDs)
      .filter((p, i, arr) => arr.findIndex(x => x.platform === p.platform) === i);

    rawItem._director = director;
    rawItem._cast = cast;
    rawItem._trailerUrl = trailerUrl;
    rawItem._platforms = streamingPlatforms;

    return { data: mapItem(rawItem, mediaType) };
  },
};
