import React, { useState } from 'react';
import { Star, Plus, Play, Check } from 'lucide-react';
import { Movie } from '../../types';
import { Card, Badge } from '../ui';

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

  return (
    <Card
      variant="hover"
      className="relative h-80 w-48 overflow-hidden group/card flex-shrink-0"
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
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      {isHovered && (
        <div className="absolute inset-0 flex flex-col justify-end p-4 z-10">
          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
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
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {movie.genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>

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
                isInWatchlist
                  ? 'bg-red-600/20 border-red-600'
                  : 'hover:bg-white/10'
              }`}
            >
              {isInWatchlist ? (
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
        <div className="absolute bottom-0 inset-x-0 p-3 z-5">
          <h3 className="text-sm font-semibold text-white line-clamp-2">
            {movie.title}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {movie.genres[0]} • {movie.releaseDate.toString().split('T')[0]}
          </p>
        </div>
      )}
    </Card>
  );
};
