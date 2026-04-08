const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const isAgeRestrictedTrailer = (video: any): boolean => {
  const text = `${video?.name || ''} ${video?.type || ''}`.toLowerCase();
  return (
    text.includes('red band') ||
    text.includes('redband') ||
    text.includes('restricted') ||
    text.includes(' uncensored') ||
    text.includes('18+') ||
    text.includes('nsfw')
  );
};

function tmdbKey(): string {
  return process.env.TMDB_API_KEY || '';
}

type TMDBMediaPath = 'movie' | 'tv';

export async function fetchMovieDetails(tmdbId: number, preferredMediaPath?: TMDBMediaPath) {
  if (!tmdbKey()) throw new Error('TMDB API key not configured');

  let data: any;
  let mediaPath: TMDBMediaPath = preferredMediaPath || 'movie';

  const tryOrder: TMDBMediaPath[] = preferredMediaPath
    ? [preferredMediaPath, preferredMediaPath === 'movie' ? 'tv' : 'movie']
    : ['movie', 'tv'];

  let lastError: Error | null = null;
  for (const path of tryOrder) {
    try {
      const resp = await fetch(`${TMDB_BASE}/${path}/${tmdbId}?api_key=${tmdbKey()}&append_to_response=credits`);
      if (!resp.ok) throw new Error(`TMDB ${path} fetch failed: ${resp.status}`);
      data = await resp.json();
      mediaPath = path;
      lastError = null;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('TMDB detail fetch failed');
    }
  }

  if (!data) {
    throw lastError || new Error('TMDB detail fetch failed');
  }

  const genres = (data.genres || []).map((g: any) => g.name);
  const director =
    (data.credits?.crew || []).find((c: any) => c.job === 'Director')?.name ||
    data.created_by?.[0]?.name ||
    null;
  const cast = (data.credits?.cast || []).slice(0, 6).map((c: any) => c.name);

  // fetch watch/providers
  let streamingPlatforms: any[] = [];
  try {
    const provResp = await fetch(`${TMDB_BASE}/${mediaPath}/${tmdbId}/watch/providers?api_key=${tmdbKey()}`);
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
        url: `https://www.themoviedb.org/${mediaPath}/${tmdbId}/watch`,
      }));
    }
  } catch (e) {
    // ignore provider errors
  }

  // fetch trailer/videos
  let trailerUrl: string | null = null;
  try {
    const videoResp = await fetch(`${TMDB_BASE}/${mediaPath}/${tmdbId}/videos?api_key=${tmdbKey()}`);
    if (videoResp.ok) {
      const videoData = await videoResp.json();
      const videos = videoData.results || [];

      const trailer =
        videos.find((video: any) => video.site === 'YouTube' && video.type === 'Trailer' && video.official && !isAgeRestrictedTrailer(video)) ||
        videos.find((video: any) => video.site === 'YouTube' && video.type === 'Trailer' && !isAgeRestrictedTrailer(video)) ||
        videos.find((video: any) => video.site === 'YouTube' && video.type === 'Teaser' && !isAgeRestrictedTrailer(video));

      if (trailer?.key) {
        trailerUrl = `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${trailer.key}&iv_load_policy=3&cc_load_policy=0&fs=0&disablekb=1`;
      }
    }
  } catch (e) {
    // ignore trailer errors
  }

  return {
    tmdbId: data.id,
    title: data.title || data.original_title || data.name || data.original_name,
    description: data.overview || '',
    releaseDate: data.release_date || data.first_air_date ? new Date(data.release_date || data.first_air_date) : new Date(),
    type: mediaPath === 'tv' ? 'series' : 'movie',
    genres,
    director: director || null,
    cast,
    poster: data.poster_path ? IMAGE_BASE + data.poster_path : '',
    backdrop: data.backdrop_path ? IMAGE_BASE + data.backdrop_path : '',
    runtime: data.runtime || data.episode_run_time?.[0] || null,
    rating: typeof data.vote_average === 'number' ? data.vote_average : 0,
    streamingPlatforms,
    trailerUrl,
    seasonCount: typeof data.number_of_seasons === 'number' ? data.number_of_seasons : undefined,
    episodeCount: typeof data.number_of_episodes === 'number' ? data.number_of_episodes : undefined,
    seriesStatus: data.status || undefined,
    seasons: Array.isArray(data.seasons)
      ? data.seasons
          .filter((season: any) => typeof season.season_number === 'number')
          .map((season: any) => ({
            id: season.id,
            seasonNumber: season.season_number,
            name: season.name || `Season ${season.season_number}`,
            episodeCount: season.episode_count || 0,
            airDate: season.air_date || null,
            poster: season.poster_path ? IMAGE_BASE + season.poster_path : '',
            overview: season.overview || '',
          }))
      : undefined,
  };
}

export async function searchTMDB(query: string, page = 1) {
  if (!tmdbKey()) throw new Error('TMDB API key not configured');
  const url = `${TMDB_BASE}/search/multi?api_key=${tmdbKey()}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
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

export async function discoverSeries(page = 1, withGenres?: string[], sortBy = 'popularity.desc') {
  if (!tmdbKey()) throw new Error('TMDB API key not configured');
  const params = new URLSearchParams();
  params.set('api_key', tmdbKey());
  params.set('page', String(page));
  params.set('sort_by', sortBy);
  if (withGenres && withGenres.length > 0) {
    params.set('with_genres', withGenres.join(','));
  }

  const url = `${TMDB_BASE}/discover/tv?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`TMDB tv discover failed: ${resp.status}`);
  return resp.json();
}

export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'week', page = 1) {
  if (!tmdbKey()) throw new Error('TMDB API key not configured');
  const url = `${TMDB_BASE}/trending/movie/${timeWindow}?api_key=${tmdbKey()}&page=${page}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`TMDB trending failed: ${resp.status}`);
  return resp.json();
}

export async function getTrendingSeries(timeWindow: 'day' | 'week' = 'week', page = 1) {
  if (!tmdbKey()) throw new Error('TMDB API key not configured');
  const url = `${TMDB_BASE}/trending/tv/${timeWindow}?api_key=${tmdbKey()}&page=${page}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`TMDB trending tv failed: ${resp.status}`);
  return resp.json();
}

export async function getNewReleases(page = 1) {
  // Use discover sorted by release date
  return discoverMovies(page, undefined, 'release_date.desc');
}

export async function getNewSeries(page = 1) {
  // Use discover sorted by first air date
  return discoverSeries(page, undefined, 'first_air_date.desc');
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

export async function discoverSeriesByGenreName(genreName: string, page = 1) {
  const map = await getGenreMap();
  const id = map[genreName.toLowerCase()];
  if (!id) return { results: [] };
  return discoverSeries(page, [String(id)]);
}

export interface TMDBActor {
  id: number;
  name: string;
  character?: string;
  profilePath: string;
  knownForDepartment?: string;
}

export async function fetchSeriesSeason(tmdbId: number, seasonNumber: number) {
  if (!tmdbKey()) throw new Error('TMDB API key not configured');

  const url = `${TMDB_BASE}/tv/${tmdbId}/season/${seasonNumber}?api_key=${tmdbKey()}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`TMDB season fetch failed: ${resp.status}`);

  const data = await resp.json();
  const episodes = Array.isArray(data.episodes) ? data.episodes : [];

  return episodes.map((episode: any) => ({
    id: episode.id,
    episodeNumber: episode.episode_number,
    name: episode.name || `Episode ${episode.episode_number}`,
    runtime: episode.runtime || null,
    airDate: episode.air_date || null,
    overview: episode.overview || '',
    stillPath: episode.still_path ? IMAGE_BASE + episode.still_path : '',
  }));
}

export interface TMDBActorProfile {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  placeOfBirth: string | null;
  knownForDepartment: string | null;
  popularity: number;
  profilePath: string;
  movies: Array<{
    id: string;
    tmdbId: number;
    title: string;
    description: string;
    releaseDate: Date;
    type: 'movie' | 'series';
    genres: string[];
    director?: string;
    cast: string[];
    poster: string;
    backdrop: string;
    runtime?: number;
    rating: number;
    trailerUrl?: string | null;
    streamingPlatforms: any[];
    character?: string;
  }>;
}

function mapCreditToMovieSummary(credit: any) {
  return {
    id: String(credit.id),
    tmdbId: credit.id,
    title: credit.title || credit.original_title || 'Unknown title',
    description: credit.overview || '',
    releaseDate: credit.release_date ? new Date(credit.release_date) : new Date(),
    type: 'movie' as const,
    genres: [],
    director: undefined,
    cast: [],
    poster: credit.poster_path ? IMAGE_BASE + credit.poster_path : '',
    backdrop: credit.backdrop_path ? IMAGE_BASE + credit.backdrop_path : '',
    runtime: undefined,
    rating: typeof credit.vote_average === 'number' ? credit.vote_average : 0,
    trailerUrl: null,
    streamingPlatforms: [],
    character: credit.character || undefined,
  };
}

export async function fetchMovieCast(tmdbId: number, limit = 20, preferredMediaPath?: TMDBMediaPath): Promise<TMDBActor[]> {
  if (!tmdbKey()) throw new Error('TMDB API key not configured');

  let data: any;

  const tryOrder: TMDBMediaPath[] = preferredMediaPath
    ? [preferredMediaPath, preferredMediaPath === 'movie' ? 'tv' : 'movie']
    : ['movie', 'tv'];

  let lastError: Error | null = null;
  for (const path of tryOrder) {
    try {
      const resp = await fetch(`${TMDB_BASE}/${path}/${tmdbId}/credits?api_key=${tmdbKey()}`);
      if (!resp.ok) throw new Error(`TMDB ${path} cast fetch failed: ${resp.status}`);
      data = await resp.json();
      lastError = null;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('TMDB cast fetch failed');
    }
  }

  if (!data) {
    throw lastError || new Error('TMDB cast fetch failed');
  }

  const cast = Array.isArray(data.cast) ? data.cast : [];

  return cast.slice(0, limit).map((member: any) => ({
    id: member.id,
    name: member.name,
    character: member.character || undefined,
    profilePath: member.profile_path ? IMAGE_BASE + member.profile_path : '',
    knownForDepartment: member.known_for_department || undefined,
  }));
}

export async function searchActorsTMDB(query: string, page = 1) {
  if (!tmdbKey()) throw new Error('TMDB API key not configured');

  const url = `${TMDB_BASE}/search/person?api_key=${tmdbKey()}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`TMDB actor search failed: ${resp.status}`);

  const data = await resp.json();
  const results = Array.isArray(data.results) ? data.results : [];

  return {
    page: data.page || 1,
    total_results: data.total_results || results.length,
    results: results.map((actor: any) => ({
      id: actor.id,
      name: actor.name,
      character: undefined,
      profilePath: actor.profile_path ? IMAGE_BASE + actor.profile_path : '',
      knownForDepartment: actor.known_for_department || undefined,
    })),
  };
}

export async function fetchActorProfile(tmdbActorId: number): Promise<TMDBActorProfile> {
  if (!tmdbKey()) throw new Error('TMDB API key not configured');

  const url = `${TMDB_BASE}/person/${tmdbActorId}?api_key=${tmdbKey()}&append_to_response=movie_credits`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`TMDB actor profile fetch failed: ${resp.status}`);

  const data = await resp.json();
  const castCredits = Array.isArray(data.movie_credits?.cast) ? data.movie_credits.cast : [];

  const deduped = new Map<number, any>();
  castCredits.forEach((credit: any) => {
    if (!deduped.has(credit.id)) {
      deduped.set(credit.id, credit);
    }
  });

  const movies = [...deduped.values()]
    .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 60)
    .map(mapCreditToMovieSummary);

  return {
    id: data.id,
    name: data.name,
    biography: data.biography || '',
    birthday: data.birthday || null,
    placeOfBirth: data.place_of_birth || null,
    knownForDepartment: data.known_for_department || null,
    popularity: typeof data.popularity === 'number' ? data.popularity : 0,
    profilePath: data.profile_path ? IMAGE_BASE + data.profile_path : '',
    movies,
  };
}
