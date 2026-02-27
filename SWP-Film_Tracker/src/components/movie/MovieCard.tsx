import React, { useState } from 'react';
import { Star, Plus, Play, Check } from 'lucide-react';
import { Movie } from '../../types';
import { Card, Badge } from '../ui';
import { useWatchlistStore } from '../../store';

interface MovieCardProps {
  movie: Movie;
  onSelect: (movie: Movie) => void;
  isInWatchlist?: boolean;
  userRating?: number;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelect,
  isInWatchlist = false,
  userRating,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { items, addToWatchlist, removeFromWatchlist } = useWatchlistStore();

  const tmdbCandidate = movie.tmdbId || Number(movie.id);
  const matchedWatchlistItem = items.find((item) => {
    if (item.movieId === movie.id) {
      return true;
    }

    if (!Number.isFinite(tmdbCandidate)) {
      return false;
    }

    return item.movie?.tmdbId === tmdbCandidate;
  });

  const isCurrentlyInWatchlist = isInWatchlist || Boolean(matchedWatchlistItem);

  const handleToggleWatchlist = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (matchedWatchlistItem) {
      await removeFromWatchlist(matchedWatchlistItem.movieId);
      return;
    }

    await addToWatchlist(String(movie.tmdbId || movie.id), 'medium');
  };

  return (
    <Card
      variant="hover"
      className="relative h-80 w-60 overflow-hidden group/card flex-shrink-0 shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(movie)}
    >
      {/* Poster Image as background to avoid <img> loading quirks */}
      <div
        className="absolute inset-0 bg-center bg-cover transition-transform duration-300 bg-gray-800"
        style={{ backgroundImage: `url("${encodeURI(movie.poster)}")` }}
        role="img"
        aria-label={movie.title}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent opacity-60 group-hover/card:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      {isHovered && (
        <div className="absolute inset-0 flex flex-col justify-end p-4 z-10">
          {/* Title */}
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
            {movie.title}
          </h3>

          {/* Info */}
          <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
            <span className="flex items-center gap-1">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              {movie.rating.toFixed(1)}
            </span>
            <span>•</span>
            <span>{movie.releaseDate.toString().split('T')[0]}</span>
            <span>•</span>
            <span className="capitalize">
              {movie.type === 'movie' ? 'Film' : 'Serie'}
            </span>
          </div>

          {/* Genres */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {movie.genres && movie.genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>

          {/* (platforms removed from card - displayed in modal) */}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(movie);
              }}
            >
              <Play size={16} />
              Watch
            </button>
            <button
              className={`flex-1 border border-white/30 text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                isCurrentlyInWatchlist
                  ? 'bg-red-600/20 border-red-600'
                  : 'hover:bg-white/10'
              }`}
              onClick={handleToggleWatchlist}
            >
              {isCurrentlyInWatchlist ? (
                <>
                  <Check size={16} />
                  Added
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Rating Badge (top-left) */}
      {userRating && (
        <div className="absolute top-2 left-2 bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-sm z-20">
          {userRating}
        </div>
      )}

      {/* Type Badge (top-right) */}
      <div className="absolute top-2 right-2 z-20">
        <Badge variant="default" className="text-xs">
          {movie.type === 'movie' ? 'Film' : 'Serie'}
        </Badge>
      </div>

      {/* Title (default view) */}
      {!isHovered && (
        <div className="absolute bottom-0 inset-x-0 p-3 z-5 bg-gradient-to-t from-black/60 to-transparent">
          <h3 className="text-sm font-semibold text-white line-clamp-2">
            {movie.title}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {movie.genres && movie.genres[0]} • {movie.releaseDate ? movie.releaseDate.toString().split('T')[0] : ''}
          </p>

          {/* streaming platforms intentionally omitted here; see extended view */}
        </div>
      )}
    </Card>
  );
};
