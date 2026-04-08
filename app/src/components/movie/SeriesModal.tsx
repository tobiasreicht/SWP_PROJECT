import React, { useEffect, useMemo, useState } from 'react';
import { X, Star, Plus, Check, Share2, ExternalLink, Tv } from 'lucide-react';
import { Actor, Movie, SeriesEpisode } from '../../types';
import { Modal, Button, Badge } from '../ui';
import { useMessengerStore, useRatingStore, useWatchlistStore } from '../../store';
import { moviesAPI } from '../../services/tmdb';
import { getPosterFallbackUrl, resolvePosterUrl } from '../../utils/media';
import { useNavigate } from 'react-router-dom';

interface SeriesModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString();
};

export const SeriesModal: React.FC<SeriesModalProps> = ({
  movie,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { ratings, fetchUserRatings } = useRatingStore();
  const { items: watchlistItems, fetchWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlistStore();
  const { openMessenger } = useMessengerStore();

  const [seriesDetails, setSeriesDetails] = useState<Movie | null>(null);
  const [platforms, setPlatforms] = useState(movie?.streamingPlatforms || []);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [castActors, setCastActors] = useState<Actor[]>([]);
  const [loadingCast, setLoadingCast] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [episodesBySeason, setEpisodesBySeason] = useState<Record<number, SeriesEpisode[]>>({});
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const activeSeries = seriesDetails || movie;
  const tmdbCandidate = activeSeries ? activeSeries.tmdbId || Number(activeSeries.id) : NaN;

  const matchedWatchlistItem = activeSeries
    ? watchlistItems.find((item) => {
        if (item.movieId === activeSeries.id) {
          return true;
        }

        if (!Number.isFinite(tmdbCandidate)) {
          return false;
        }

        return item.movie?.tmdbId === tmdbCandidate;
      })
    : undefined;

  const isInWatchlist = Boolean(matchedWatchlistItem);

  const userRating = activeSeries
    ? ratings.find((rating) => {
        if (rating.movieId === activeSeries.id) {
          return true;
        }

        if (matchedWatchlistItem && rating.movieId === matchedWatchlistItem.movieId) {
          return true;
        }

        if (activeSeries.tmdbId && rating.movieId === String(activeSeries.tmdbId)) {
          return true;
        }

        return false;
      })
    : undefined;

  const seasons = useMemo(
    () => (activeSeries?.seasons || []).filter((season) => season.seasonNumber > 0),
    [activeSeries],
  );

  useEffect(() => {
    if (!isOpen || !movie) {
      setSeriesDetails(null);
      setEpisodesBySeason({});
      setSelectedSeason(null);
      return;
    }

    let mounted = true;

    (async () => {
      setLoadingDetails(true);
      try {
        const id = String(movie.tmdbId || movie.id);
        const response = await moviesAPI.getById(id, 'series');
        if (!mounted) return;
        setSeriesDetails(response.data);
        setPlatforms(response.data.streamingPlatforms || []);
      } catch {
        if (!mounted) return;
        setSeriesDetails(movie);
        setPlatforms(movie.streamingPlatforms || []);
      } finally {
        if (mounted) setLoadingDetails(false);
      }
    })();

    fetchWatchlist();
    fetchUserRatings();

    return () => {
      mounted = false;
    };
  }, [isOpen, movie]);

  useEffect(() => {
    const defaultSeason = seasons.length > 0 ? seasons[0].seasonNumber : null;
    setSelectedSeason((prev) => {
      if (prev && seasons.some((season) => season.seasonNumber === prev)) {
        return prev;
      }
      return defaultSeason;
    });
  }, [seasons]);

  useEffect(() => {
    if (!isOpen || !activeSeries) {
      setCastActors([]);
      return;
    }

    let mounted = true;

    (async () => {
      setLoadingCast(true);
      try {
        const id = String(activeSeries.tmdbId || activeSeries.id);
        const response = await moviesAPI.getCast(id, 20, 'series');
        if (!mounted) return;
        setCastActors(Array.isArray(response.data) ? response.data : []);
      } catch {
        if (!mounted) return;
        setCastActors([]);
      } finally {
        if (mounted) setLoadingCast(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isOpen, activeSeries?.id, activeSeries?.tmdbId]);

  useEffect(() => {
    if (!isOpen || !activeSeries || !selectedSeason || episodesBySeason[selectedSeason]) {
      return;
    }

    let mounted = true;

    (async () => {
      setLoadingEpisodes(true);
      try {
        const id = String(activeSeries.tmdbId || activeSeries.id);
        const response = await moviesAPI.getSeriesSeason(id, selectedSeason);
        if (!mounted) return;
        setEpisodesBySeason((prev) => ({ ...prev, [selectedSeason]: response.data || [] }));
      } catch {
        if (!mounted) return;
        setEpisodesBySeason((prev) => ({ ...prev, [selectedSeason]: [] }));
      } finally {
        if (mounted) setLoadingEpisodes(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isOpen, activeSeries?.id, activeSeries?.tmdbId, selectedSeason, episodesBySeason]);

  if (!movie) return null;

  const handleToggleWatchlist = async () => {
    if (!activeSeries) return;

    if (matchedWatchlistItem) {
      await removeFromWatchlist(matchedWatchlistItem.movieId);
    } else {
      await addToWatchlist(String(activeSeries.tmdbId || activeSeries.id), 'medium');
    }
  };

  const posterUrl = resolvePosterUrl(activeSeries?.poster || movie.poster || '');
  const posterFallback = getPosterFallbackUrl();
  const activeSeasonEpisodes = selectedSeason ? episodesBySeason[selectedSeason] || [] : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xxl">
      <div className="relative bg-gradient-to-br from-neutral-900/95 via-black/85 to-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-5 md:p-6 overflow-hidden max-h-[90vh]">
        <button
          aria-label="Close"
          className="absolute right-3 top-3 z-30 bg-white/20 hover:bg-white/30 rounded-full p-2 text-white backdrop-blur-md"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 h-[min(860px,calc(90vh-2.5rem))] overflow-hidden pt-2">
          <div className="lg:w-72 xl:w-80 w-full flex-shrink-0 self-start">
            <img
              src={posterUrl}
              alt={activeSeries?.title || movie.title}
              className="w-full rounded-xl object-cover max-h-[48vh] lg:max-h-[74vh] mx-auto shadow-lg border border-white/10"
              onError={(event) => {
                event.currentTarget.src = posterFallback;
              }}
            />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide pr-1 md:pr-2 space-y-6">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">{activeSeries?.title || movie.title}</h1>
              <div className="flex items-center gap-3 flex-wrap text-lg">
                <span className="text-gray-400">{new Date((activeSeries || movie).releaseDate).getFullYear()}</span>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-1">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{(activeSeries || movie).rating.toFixed(1)}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="inline-flex items-center gap-1 text-indigo-300">
                  <Tv size={16} />
                  Series
                </span>
                {activeSeries?.seasonCount ? (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">{activeSeries.seasonCount} seasons</span>
                  </>
                ) : null}
                {activeSeries?.episodeCount ? (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">{activeSeries.episodeCount} episodes</span>
                  </>
                ) : null}
              </div>
              {loadingDetails && <p className="text-xs text-gray-500 mt-2">Loading series details...</p>}
            </div>

            <div className="flex gap-2 flex-wrap">
              {(activeSeries || movie).genres.map((genre) => (
                <Badge key={genre} variant="outline">
                  {genre}
                </Badge>
              ))}
              {activeSeries?.seriesStatus ? (
                <Badge variant="outline" className="text-indigo-300 border-indigo-500/40 bg-indigo-500/10">
                  {activeSeries.seriesStatus}
                </Badge>
              ) : null}
            </div>

            <p className="text-gray-200 leading-relaxed text-lg">{(activeSeries || movie).description}</p>

            <div>
              <h3 className="text-white font-semibold mb-2 text-xl">Official Ratings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">TMDB</p>
                  <div className="flex items-center gap-2">
                    <Star size={15} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-white font-semibold">{(activeSeries || movie).rating.toFixed(1)}/10</span>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Your Rating</p>
                  {userRating ? (
                    <p className="text-sm text-yellow-300 font-semibold">★ {userRating.rating}/10</p>
                  ) : (
                    <p className="text-sm text-gray-300">Set personal ratings in Watchlist.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2">
              <h3 className="text-white font-semibold mb-2 text-xl">Where to watch</h3>
              {platforms && platforms.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {platforms.map((p) => (
                    <a
                      key={p.platform}
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 bg-white/20 hover:bg-white/30 p-4 rounded-xl transition-colors shadow border border-white/10 backdrop-blur"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3 h-10">
                        <div className="w-9 h-9 flex items-center justify-center rounded-md text-white font-semibold bg-gray-600 shadow">{p.platform[0]}</div>
                        <div>
                          <div className="text-white font-medium">{p.platform}</div>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-gray-300" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No streaming information available.</p>
              )}
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3 text-xl">Season Overview</h3>
              {seasons.length > 0 ? (
                <>
                  <div className="flex gap-2 flex-wrap mb-3">
                    {seasons.map((season) => (
                      <button
                        key={season.id}
                        type="button"
                        onClick={() => setSelectedSeason(season.seasonNumber)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          selectedSeason === season.seasonNumber
                            ? 'bg-indigo-600/30 border-indigo-400/50 text-indigo-200'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        S{season.seasonNumber} • {season.episodeCount} eps
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4 space-y-2">
                    {loadingEpisodes ? (
                      <p className="text-sm text-gray-400">Loading episodes...</p>
                    ) : activeSeasonEpisodes.length > 0 ? (
                      activeSeasonEpisodes.map((episode) => (
                        <div key={episode.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-sm text-white font-semibold">
                            E{episode.episodeNumber}: {episode.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDate(episode.airDate)}
                            {episode.runtime ? ` • ${episode.runtime} min` : ''}
                          </p>
                          {episode.overview ? (
                            <p className="text-xs text-gray-300 mt-1.5 line-clamp-2">{episode.overview}</p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">No episode details available for this season.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-gray-400">No season information available.</p>
              )}
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3 text-xl">Cast</h3>
              {loadingCast ? (
                <p className="text-gray-400">Loading cast...</p>
              ) : castActors.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {castActors.map((actor) => (
                    <button
                      key={String(actor.id)}
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate(`/actors/${actor.id}`);
                      }}
                      className="group relative min-w-[148px] w-[148px] text-left overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.03] shadow-lg hover:border-red-500/40 transition-colors"
                    >
                      <img
                        src={actor.profilePath || 'https://placehold.co/200x300/1f2937/e5e7eb?text=Actor'}
                        alt={actor.name}
                        className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 via-black/55 to-transparent">
                        <p className="text-sm text-white font-semibold line-clamp-2">{actor.name}</p>
                        <p className="text-xs text-gray-300 mt-1 line-clamp-1">{actor.character || actor.knownForDepartment || 'Actor'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No cast data available.</p>
              )}
            </div>

            <div className="flex gap-3 flex-wrap mt-2">
              <Button
                variant="secondary"
                onClick={handleToggleWatchlist}
                className={isInWatchlist ? 'bg-red-600/20' : ''}
              >
                {isInWatchlist ? <Check size={16} /> : <Plus size={16} />}
                {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
              </Button>
              <Button
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  openMessenger({
                    movie: {
                      tmdbId: activeSeries?.tmdbId,
                      title: activeSeries?.title || movie.title,
                      poster: posterUrl,
                    },
                  });
                }}
              >
                <Share2 size={16} />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SeriesModal;
