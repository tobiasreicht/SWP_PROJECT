import React from 'react';
import { Star } from 'lucide-react';

interface RatingSelectorProps {
  value: number | null;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const sizeStyles = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export const RatingSelector: React.FC<RatingSelectorProps> = ({
  value,
  onChange,
  size = 'md',
  interactive = true,
}) => {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
        <button
          key={num}
          onClick={() => interactive && onChange(num)}
          disabled={!interactive}
          className={`
            ${sizeStyles[size]}
            rounded-full font-semibold transition-all
            ${value === num
              ? 'bg-yellow-500 text-neutral-900'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }
            ${!interactive && 'cursor-not-allowed opacity-50'}
          `}
        >
          {num}
        </button>
      ))}
    </div>
  );
};

interface GenreFilterProps {
  genres: string[];
  selectedGenres: string[];
  onGenreChange: (genres: string[]) => void;
}

export const GenreFilter: React.FC<GenreFilterProps> = ({
  genres,
  selectedGenres,
  onGenreChange,
}) => {
  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      onGenreChange(selectedGenres.filter((g) => g !== genre));
    } else {
      onGenreChange([...selectedGenres, genre]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => (
        <button
          key={genre}
          onClick={() => toggleGenre(genre)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedGenres.includes(genre)
              ? 'bg-red-600 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
};
