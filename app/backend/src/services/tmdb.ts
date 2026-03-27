const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

function tmdbKey(): string {
  return process.env.TMDB_API_KEY || '';
}

export async function fetchMovieDetails(tmdbId: number) {
  if (!tmdbKey()) throw new Error('TMDB API key not configured');

  const url = `${TMDB_BASE}/movie/${tmdbId}?api_key=${tmdbKey()}&append_to_response=credits`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`TMDB fetch failed: ${resp.status}`);
  const data = await resp.json();

  const genres = (data.genres || []).map((g: any) => g.name);
  const director = (data.credits?.crew || []).find((c: any) => c.job === 'Director')?.name;
  const cast = (data.credits?.cast || []).slice(0, 6).map((c: any) => c.name);

  // fetch watch/providers
  let streamingPlatforms: any[] = [];
  try {
    const provResp = await fetch(`${TMDB_BASE}/movie/${tmdbId}/watch/providers?api_key=${tmdbKey()}`);
    if (provResp.ok) {
      const provData = await provResp.json();
      const country = provData.results?.US || provData.results?.DE || provData.results?.GB || provData.results?.KR || provData.results?.IN;
      const providers = country?.flatrate || country?.rent || country?.buy || [];
      const mapName = (name: string) => {
        if (!name) return 'Other';
        const n = name.toLowerCase();
        if (n.includes('netflix')) return 'Netflix';
        if (n.includes('prime') || n.includes('amazon')) return 'Prime Video';
        if (n.includes('disney')) return "Disney+'";
        if (n.includes('apple')) return "Apple TV+'";
        if (n.includes('hbo')) return 'HBO Max';
        if (n.includes('hulu')) return 'Hulu';
        return name;
      };

      streamingPlatforms = (providers || []).map((p: any) => ({
        platform: mapName(p.provider_name),
        url: `https://www.themoviedb.org/movie/${tmdbId}/watch`,
      }));
    }
  } catch (e) {
    // ignore provider errors
  }

  // fetch trailer/videos
  let trailerUrl: string | null = null;
  try {
    const videoResp = await fetch(`${TMDB_BASE}/movie/${tmdbId}/videos?api_key=${tmdbKey()}`);
    if (videoResp.ok) {
      const videoData = await videoResp.json();
      const videos = videoData.results || [];

      const trailer =
        videos.find((video: any) => video.site === 'YouTube' && video.type === 'Trailer' && video.official) ||
        videos.find((video: any) => video.site === 'YouTube' && video.type === 'Trailer') ||
        videos.find((video: any) => video.site === 'YouTube' && video.type === 'Teaser');

      if (trailer?.key) {
        trailerUrl = `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${trailer.key}&iv_load_policy=3&cc_load_policy=0&fs=0&disablekb=1`;
      }
    }
  } catch (e) {
    // ignore trailer errors
  }

  return {
    tmdbId: data.id,
    title: data.title || data.original_title,
    description: data.overview || '',
    releaseDate: data.release_date ? new Date(data.release_date) : new Date(),
    type: data.media_type || 'movie',
    genres,
    director: director || null,
    cast,
    poster: data.poster_path ? IMAGE_BASE + data.poster_path : '',
    backdrop: data.backdrop_path ? IMAGE_BASE + data.backdrop_path : '',
    runtime: data.runtime || null,
    rating: typeof data.vote_average === 'number' ? data.vote_average : 0,
    streamingPlatforms,
    trailerUrl,
  };
}

export async function searchTMDB(query: string, page = 1) {
  if (!tmdbKey()) throw new Error('TMDB API key not configured');
  const url = `${TMDB_BASE}/search/movie?api_key=${tmdbKey()}&query=${encodeURIComponent(query)}&page=${page}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`TMDB search failed: ${resp.status}`);
  return resp.json();
}

// Discover movies (supports sort, page, filters)
export async function discoverMovies(page = 1, withGenres?: string[], sortBy = 'popularity.desc') {
  if (!tmdbKey()) throw new Error('TMDB API key not configured');
  const params = new URLSearchParams();
  params.set('api_key', tmdbKey());
  params.set('page', String(page));
  params.set('sort_by', sortBy);
  if (withGenres && withGenres.length > 0) {
    // withGenres expects comma separated genre ids
    params.set('with_genres', withGenres.join(','));
  }

  const url = `${TMDB_BASE}/discover/movie?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`TMDB discover failed: ${resp.status}`);
  return resp.json();
}

export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page = 1) {
  if (!tmdbKey()) throw new Error('TMDB API key not configured');
  const url = `${TMDB_BASE}/trending/movie/${timeWindow}?api_key=${tmdbKey()}&page=${page}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`TMDB trending failed: ${resp.status}`);
  return resp.json();
}

export async function getNewReleases(page = 1) {
  // Use discover sorted by release date
  return discoverMovies(page, undefined, 'release_date.desc');
}

let genresCache: Record<string, number> | null = null;
export async function getGenreMap(): Promise<Record<string, number>> {
  if (genresCache) return genresCache;
  if (!tmdbKey()) throw new Error('TMDB API key not configured');
  const url = `${TMDB_BASE}/genre/movie/list?api_key=${tmdbKey()}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`TMDB genre list failed: ${resp.status}`);
  const data = await resp.json();
  const map: Record<string, number> = {};
  (data.genres || []).forEach((g: any) => {
    map[g.name.toLowerCase()] = g.id;
  });
  genresCache = map;
  return map;
}

export async function discoverByGenreName(genreName: string, page = 1) {
  const map = await getGenreMap();
  const id = map[genreName.toLowerCase()];
  if (!id) return { results: [] };
  return discoverMovies(page, [String(id)]);
}
