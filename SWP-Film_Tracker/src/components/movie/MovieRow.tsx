import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../../types';
import { MovieCard } from './MovieCard';

interface MovieRowProps {
  title: string;
  movies: Movie[];
  onMovieSelect: (movie: Movie) => void;
}

export const MovieRow: React.FC<MovieRowProps> = ({ title, movies, onMovieSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 400;
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative group/row mb-8">
      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 px-4 md:px-6 hover:text-red-600 transition-colors cursor-pointer">
        {title}
      </h2>

      {/* Container */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-30 bg-gradient-to-r from-neutral-900 to-transparent hover:from-neutral-900/90 w-24 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronLeft className="text-white" size={32} />
        </button>

        {/* Movies Container */}
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pl-4 md:pl-6 pr-0 pb-4"
          style={{
            scrollBehavior: 'smooth',
            scrollSnapType: 'x mandatory',
          }}
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie} 
              onSelect={onMovieSelect}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-30 bg-gradient-to-l from-neutral-900 to-transparent hover:from-neutral-900/90 w-24 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronRight className="text-white" size={32} />
        </button>
      </div>
    </div>
  );
};
