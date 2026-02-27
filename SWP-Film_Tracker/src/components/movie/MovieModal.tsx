import React, { useState, useEffect } from 'react';
import { X, Star, Plus, Check, Share2, Heart, ExternalLink } from 'lucide-react';
import { Movie, Rating } from '../../types';
import { Modal, Button, Badge } from '../ui';
import { useRatingStore, useWatchlistStore } from '../../store';
import { moviesAPI } from '../../services/api';

interface MovieModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MovieModal: React.FC<MovieModalProps> = ({
  movie,
  isOpen,
  onClose,
}) => {
  const { createRating } = useRatingStore();
  const { items: watchlistItems, fetchWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlistStore();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');
  const [platforms, setPlatforms] = useState(movie?.streamingPlatforms || []);
  const [loadingPlatforms, setLoadingPlatforms] = useState(false);

  const tmdbCandidate = movie ? movie.tmdbId || Number(movie.id) : NaN;
  const matchedWatchlistItem = movie
    ? watchlistItems.find((item) => {
        if (item.movieId === movie.id) {
          return true;
        }

        if (!Number.isFinite(tmdbCandidate)) {
          return false;
        }

        return item.movie?.tmdbId === tmdbCandidate;
      })
    : undefined;

  const isInWatchlist = Boolean(matchedWatchlistItem);

  useEffect(() => {
    if (!isOpen) {
      setSelectedRating(null);
      setReviewText('');
      return;
    }

    fetchWatchlist();
  }, [isOpen]);

  useEffect(() => {
    let mounted = true;
    // load platforms when modal opens or when movie changes
    if (isOpen && movie) {
      const hasPlatforms = movie.streamingPlatforms && movie.streamingPlatforms.length > 0;
      if (hasPlatforms) {
        setPlatforms(movie.streamingPlatforms);
        return;
      }

      (async () => {
        setLoadingPlatforms(true);
        try {
          const id = String((movie as any).tmdbId || movie.id);
          const resp = await moviesAPI.getById(id);
          if (!mounted) return;
          setPlatforms(resp.data.streamingPlatforms || []);
        } catch (e) {
          // ignore
        } finally {
          if (mounted) setLoadingPlatforms(false);
        }
      })();
    }

    return () => { mounted = false };
  }, [isOpen, movie]);

  if (!movie) return null;

  const handleSubmitRating = async () => {
    if (selectedRating) {
      await createRating(movie.id, selectedRating, reviewText);
      onClose();
    }
  };

  const handleToggleWatchlist = async () => {
    if (matchedWatchlistItem) {
      await removeFromWatchlist(matchedWatchlistItem.movieId);
    } else {
      await addToWatchlist(String(movie.tmdbId || movie.id), 'medium');
    }
  };

  return (

    <Modal isOpen={isOpen} onClose={onClose} size="xxl">
      <div className="relative bg-black/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-6 overflow-hidden">
        <button
          aria-label="Close"
          className="absolute right-3 top-3 z-30 bg-white/20 hover:bg-white/30 rounded-full p-2 text-white backdrop-blur-md"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Poster */}
          <div className="lg:w-80 w-full flex-shrink-0">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full rounded-xl object-cover max-h-[520px] mx-auto shadow-lg border border-white/10"
            />
          </div>
          {/* Content */}
          <div className="flex-1 space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">{movie.title}</h1>
              <div className="flex items-center gap-3 flex-wrap text-lg">
                <span className="text-gray-400">{new Date(movie.releaseDate).getFullYear()}</span>
                <span className="text-gray-400">•</span>
                <div className="flex items-center gap-1">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{movie.rating.toFixed(1)}</span>
                </div>
                {movie.runtime && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-400">{movie.runtime} min</span>
                  </>
                )}
              </div>
            </div>
            {/* Genres */}
            <div className="flex gap-2 flex-wrap">
              {movie.genres.map((genre) => (
                <Badge key={genre} variant="outline">
                  {genre}
                </Badge>
              ))}
            </div>
            {/* Description */}
            <p className="text-gray-200 leading-relaxed text-lg">
              {movie.description}
            </p>
            {/* Where to watch */}
            <div className="mt-2 ">
              <h3 className="text-white font-semibold mb-2 text-xl">Where to watch</h3>
              {loadingPlatforms ? (
                <p className="text-gray-400">Loading platforms…</p>
              ) : platforms && platforms.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 h-15">
                  {platforms.map((p) => (
                    <a
                      key={p.platform}
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-3 bg-white/20 hover:bg-white/30 p-4 rounded-xl transition-colors shadow border border-white/10 backdrop-blur"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-3 h-10 ">
                        {
                          (() => {
                            const base = 'w-9 h-9 flex items-center justify-center rounded-md text-white font-semibold ';
                            const plat = p.platform;
                            const color =
                              plat === 'Netflix' ? 'bg-red-600' :
                              plat === 'Prime Video' ? 'bg-blue-600' :
                              plat === 'Disney+' ? 'bg-sky-500' :
                              plat === "Apple TV+" ? 'bg-neutral-700' :
                              plat === 'HBO Max' ? 'bg-violet-700' : 'bg-gray-600';
                            return <div className={base + color + ' shadow'}>{plat[0]}</div>;
                          })()
                        }
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
            {/* Director & Cast */}
            <div className="space-y-2 text-base">
              {movie.director && (
                <p>
                  <span className="text-gray-400">Director:</span>
                  <span className="text-white ml-2">{movie.director}</span>
                </p>
              )}
              <p>
                <span className="text-gray-400">Cast:</span>
                <span className="text-white ml-2">{movie.cast.join(', ')}</span>
              </p>
            </div>
            {/* Rating Section */}
            <div className="border-t border-white/10 pt-6">
              <p className="text-white font-semibold mb-3 text-lg">Your Rating</p>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedRating(num)}
                    className={`w-10 h-10 rounded-lg font-semibold transition-colors shadow ${
                      selectedRating === num
                        ? 'bg-red-600 text-white'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              {/* Review */}
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write your review (optional)..."
                className="w-full px-3 py-2 rounded-xl bg-white/20 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-red-600 resize-none shadow"
                rows={3}
              />
            </div>
            {/* Actions */}
            <div className="flex gap-3 flex-wrap mt-2">
              <Button
                variant="primary"
                onClick={handleSubmitRating}
                className="flex-1"
                disabled={!selectedRating}
              >
                Save Rating
              </Button>
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
                  navigator.share?.({ title: movie.title, text: movie.description });
                }}
              >
                <Share2 size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default MovieModal;
