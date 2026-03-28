import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Film, MapPin, Search } from 'lucide-react';

import { MovieModal } from '../components/movie';
import { moviesAPI } from '../services/tmdb';
import { ActorProfile as ActorProfileType, Movie } from '../types';
import { getPosterFallbackUrl, resolvePosterUrl } from '../utils/media';

export const ActorProfile: React.FC = () => {
  const navigate = useNavigate();
  const { actorId } = useParams<{ actorId: string }>();

  const [profile, setProfile] = useState<ActorProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  const [loadingMovieId, setLoadingMovieId] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    let active = true;

    if (!actorId) {
      setError('Actor not found.');
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await moviesAPI.getActorProfile(actorId);
        if (!active) {
          return;
        }
        setProfile(response.data);
      } catch {
        if (!active) {
          return;
        }
        setError('Failed to load actor profile.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [actorId]);

  const handleOpenMovie = async (movie: Movie) => {
    const targetId = String(movie.tmdbId || movie.id);
    setLoadingMovieId(targetId);
    try {
      const detail = await moviesAPI.getById(targetId);
      setSelectedMovie(detail.data);
      setIsMovieModalOpen(true);
    } catch {
      setSelectedMovie(movie);
      setIsMovieModalOpen(true);
    } finally {
      setLoadingMovieId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-inner flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page-container">
        <div className="page-inner py-14">
          <p className="text-red-400">{error || 'Actor not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-inner">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 px-3 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-sm hover:bg-white/[0.1] transition-colors"
        >
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 mb-8">
          <div className="rounded-3xl overflow-hidden border border-white/[0.1] bg-white/[0.03] shadow-xl">
            <img
              src={profile.profilePath || 'https://placehold.co/300x450/1f2937/e5e7eb?text=Actor'}
              alt={profile.name}
              className="w-full aspect-[2/3] object-cover"
            />
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/[0.1] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 md:p-6">
              <h1 className="text-3xl md:text-4xl font-bold text-white">{profile.name}</h1>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <div className="rounded-2xl border border-white/[0.1] bg-black/25 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Department</p>
                  <p className="text-sm text-white font-semibold mt-1 line-clamp-1">{profile.knownForDepartment || 'Acting'}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.1] bg-black/25 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Birth Date</p>
                  <p className="text-sm text-white font-semibold mt-1 line-clamp-1">{profile.birthday || 'Unknown'}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.1] bg-black/25 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Movies Listed</p>
                  <p className="text-sm text-white font-semibold mt-1">{profile.movies.length}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-300 mt-4">
                {profile.knownForDepartment && (
                  <div className="inline-flex items-center gap-2">
                    <Film size={14} className="text-red-400" />
                    <span>{profile.knownForDepartment}</span>
                  </div>
                )}
                {profile.birthday && (
                  <div className="inline-flex items-center gap-2">
                    <Calendar size={14} className="text-red-400" />
                    <span>{profile.birthday}</span>
                  </div>
                )}
                {profile.placeOfBirth && (
                  <div className="inline-flex items-center gap-2">
                    <MapPin size={14} className="text-red-400" />
                    <span>{profile.placeOfBirth}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/[0.1] bg-white/[0.03] p-5 md:p-6">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-xl font-semibold text-white">Biography</h2>
                <button
                  type="button"
                  onClick={() => setBioExpanded((current) => !current)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.06] border border-white/[0.12] text-white hover:bg-white/[0.12]"
                >
                  {bioExpanded ? 'Show less' : 'Show more'}
                </button>
              </div>
              <p className={`text-gray-200 leading-relaxed whitespace-pre-line ${bioExpanded ? '' : 'line-clamp-6'}`}>
                {profile.biography || 'No biography available.'}
              </p>
            </div>
          </div>
        </div>

        {profile.movies.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-3">Top Credits</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {profile.movies.slice(0, 12).map((movie) => {
                const id = String(movie.tmdbId || movie.id);
                const isLoadingMovie = loadingMovieId === id;

                return (
                  <button
                    key={`top-${id}`}
                    type="button"
                    onClick={() => handleOpenMovie(movie)}
                    className="group min-w-[150px] w-[150px] text-left"
                    disabled={isLoadingMovie}
                  >
                    <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.03]">
                      <img
                        src={resolvePosterUrl(movie.poster || '')}
                        onError={(event) => {
                          event.currentTarget.src = getPosterFallbackUrl();
                        }}
                        alt={movie.title}
                        className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                        <p className="text-xs text-white font-semibold line-clamp-2">{movie.title}</p>
                        <p className="text-[10px] text-gray-300 mt-0.5">{new Date(movie.releaseDate).getFullYear() || 'N/A'}</p>
                      </div>
                      {isLoadingMovie && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Filmography</h2>
          <p className="text-sm text-gray-400">{profile.movies.length} movies</p>
        </div>

        {profile.movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {profile.movies.map((movie) => {
              const id = String(movie.tmdbId || movie.id);
              const isLoadingMovie = loadingMovieId === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleOpenMovie(movie)}
                  className="text-left group"
                  disabled={isLoadingMovie}
                >
                  <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.03] shadow-lg">
                    <img
                      src={resolvePosterUrl(movie.poster || '')}
                      onError={(event) => {
                        event.currentTarget.src = getPosterFallbackUrl();
                      }}
                      alt={movie.title}
                      className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {isLoadingMovie && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <p className="text-white text-sm font-semibold mt-2 line-clamp-2">{movie.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(movie.releaseDate).getFullYear() || 'N/A'}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-8 text-center">
            <Search className="mx-auto text-gray-500" size={24} />
            <p className="text-gray-300 mt-3">No movie credits available.</p>
          </div>
        )}
      </div>

      <MovieModal
        movie={selectedMovie}
        isOpen={isMovieModalOpen}
        onClose={() => {
          setIsMovieModalOpen(false);
          setSelectedMovie(null);
        }}
      />
    </div>
  );
};

export default ActorProfile;
