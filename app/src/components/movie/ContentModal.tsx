import React from 'react';
import { Movie } from '../../types';
import { MovieModal } from './MovieModal';
import { SeriesModal } from './SeriesModal';

interface ContentModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContentModal: React.FC<ContentModalProps> = ({ movie, isOpen, onClose }) => {
  if (movie?.type === 'series') {
    return <SeriesModal movie={movie} isOpen={isOpen} onClose={onClose} />;
  }

  return <MovieModal movie={movie} isOpen={isOpen} onClose={onClose} />;
};

export default ContentModal;
