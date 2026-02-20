import React from 'react';
import { User, UserPlus, Heart, MessageCircle } from 'lucide-react';
import { Card, Button, Badge } from '../ui';

interface FriendCardProps {
  id: string;
  name: string;
  avatar?: string;
  tasteMatch?: number;
  commonMovies?: number;
  onAddFriend?: () => void;
  isAdded?: boolean;
}

export const FriendCard: React.FC<FriendCardProps> = ({
  id,
  name,
  avatar,
  tasteMatch,
  commonMovies,
  onAddFriend,
  isAdded = false,
}) => {
  return (
    <Card className="p-4 hover:border-red-500/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-purple-600 flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-white">{name}</h3>
            {commonMovies && (
              <p className="text-xs text-gray-400">{commonMovies} common movies</p>
            )}
          </div>
        </div>
        {tasteMatch && (
          <div className="text-right">
            <div className="text-2xl font-bold text-red-600">{tasteMatch}%</div>
            <p className="text-xs text-gray-400">Match</p>
          </div>
        )}
      </div>

      {tasteMatch && (
        <div className="w-full bg-white/10 rounded-full h-2 mb-3">
          <div
            className="bg-gradient-to-r from-red-600 to-purple-600 h-2 rounded-full"
            style={{ width: `${tasteMatch}%` }}
          />
        </div>
      )}

      <div className="flex gap-2">
        {isAdded ? (
          <>
            <Button variant="ghost" size="sm" className="flex-1 flex items-center justify-center gap-1">
              <Heart size={14} className="fill-red-600 text-red-600" />
              Friends
            </Button>
            <Button variant="secondary" size="sm" className="flex-1 flex items-center justify-center gap-1">
              <MessageCircle size={14} />
              Message
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            className="w-full flex items-center justify-center gap-1"
            onClick={onAddFriend}
          >
            <UserPlus size={14} />
            Add Friend
          </Button>
        )}
      </div>
    </Card>
  );
};

interface ActivityFeedItemProps {
  id: string;
  username: string;
  action: 'watched' | 'rated' | 'added_to_watchlist' | 'recommended';
  movieTitle: string;
  moviePoster: string;
  rating?: number;
  timestamp: Date;
}

export const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({
  username,
  action,
  movieTitle,
  moviePoster,
  rating,
  timestamp,
}) => {
  const getActionText = () => {
    switch (action) {
      case 'watched':
        return 'watched';
      case 'rated':
        return `rated ${rating}/10`;
      case 'added_to_watchlist':
        return 'added to watchlist';
      case 'recommended':
        return 'recommended';
      default:
        return '';
    }
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  return (
    <div className="flex gap-4 p-4 border-b border-white/10 hover:bg-white/5 transition-colors">
      <img
        src={moviePoster}
        alt={movieTitle}
        className="w-12 h-16 rounded object-cover flex-shrink-0"
      />
      <div className="flex-1">
        <p className="text-white">
          <span className="font-semibold">{username}</span>
          {' '}
          {getActionText()}
          {' '}
          <span className="font-semibold">{movieTitle}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">{getTimeAgo(timestamp)}</p>
      </div>
    </div>
  );
};
