import React, { useState, useEffect } from 'react';
import { X, Star, Plus, Check, Share2, Heart } from 'lucide-react';
import { Movie, Rating } from '../../types';
import { Modal, Button, Badge } from '../ui';
import { useRatingStore, useWatchlistStore } from '../../store';

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
  const { items: watchlistItems, addToWatchlist, removeFromWatchlist } = useWatchlistStore();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState('');

  const isInWatchlist = movie ? watchlistItems.some((item) => item.movieId === movie.id) : false;

  useEffect(() => {
    if (!isOpen) {
      setSelectedRating(null);
      setReviewText('');
    }
  }, [isOpen]);

  if (!movie) return null;

  const handleSubmitRating = async () => {
    if (selectedRating) {
      await createRating(movie.id, selectedRating, reviewText);
      onClose();
    }
  };

  const handleToggleWatchlist = async () => {
    if (isInWatchlist) {
      await removeFromWatchlist(movie.id);
    } else {
      await addToWatchlist(movie.id, 'medium');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xxl">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Poster */}
        <div className="lg:w-80 w-full flex-shrink-0">
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full rounded-lg object-cover max-h-[520px] mx-auto"
          />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{movie.title}</h1>
            <div className="flex items-center gap-3 flex-wrap">
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
          <p className="text-gray-300 leading-relaxed">
            {movie.description}
          </p>

          {/* Director & Cast */}
          <div className="space-y-2 text-sm">
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
          <div className="border-t border-white/10 pt-4">
            <p className="text-white font-semibold mb-3">Your Rating</p>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedRating(num)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
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
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-red-600 resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
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
    </Modal>
  );
};
