import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, Send, Search, X } from 'lucide-react';
import { MovieModal } from '../movie';
import { Modal, Button } from '../ui';
import { friendsAPI, messagesAPI } from '../../services/api';
import { moviesAPI } from '../../services/tmdb';
import { MessageAttachmentMovie, Movie, SocialFriend, SocialMessage } from '../../types';
import { useAuthStore, useMessengerStore } from '../../store';
import { getPosterFallbackUrl, resolvePosterUrl } from '../../utils/media';

export const ChatWindowModal: React.FC = () => {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const {
    isOpen,
    selectedFriendId,
    sharedMovie,
    closeMessenger,
    setSelectedFriendId,
    setSharedMovie,
  } = useMessengerStore();

  const [friends, setFriends] = useState<SocialFriend[]>([]);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [movieQuery, setMovieQuery] = useState('');
  const [movieResults, setMovieResults] = useState<Movie[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<MessageAttachmentMovie | null>(null);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSearchingMovies, setIsSearchingMovies] = useState(false);
  const [isOpeningMovie, setIsOpeningMovie] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const posterFallback = getPosterFallbackUrl();

  const selectedFriend = useMemo(
    () => friends.find((friend) => friend.id === selectedFriendId),
    [friends, selectedFriendId]
  );

  const loadConversation = async (friendId: string) => {
    try {
      setIsLoadingMessages(true);
      const response = await messagesAPI.getConversation(friendId);
      setMessages((response.data || []) as SocialMessage[]);
      await messagesAPI.markInboxRead({ senderId: friendId });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load conversation');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const loadFriends = async () => {
    try {
      setIsLoadingFriends(true);
      const response = await friendsAPI.getAll();
      const loadedFriends = (response.data || []) as SocialFriend[];
      const uniqueFriends = Array.from(
        new Map(loadedFriends.map((friend) => [friend.id, friend])).values()
      );
      setFriends(uniqueFriends);

      const targetFriendId = selectedFriendId || uniqueFriends[0]?.id;
      if (targetFriendId) {
        setSelectedFriendId(targetFriendId);
        await loadConversation(targetFriendId);
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load friends');
    } finally {
      setIsLoadingFriends(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setMessageText('');
      setMovieQuery('');
      setMovieResults([]);
      setMessages([]);
      setFriends([]);
      setSelectedAttachment(null);
      setError(null);
      return;
    }

    setSelectedAttachment(sharedMovie || null);
    loadFriends();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedFriendId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      loadConversation(selectedFriendId);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isOpen, selectedFriendId]);

  useEffect(() => {
    if (!sharedMovie) {
      return;
    }

    setSelectedAttachment(sharedMovie);
  }, [sharedMovie]);

  const handleSelectFriend = async (friendId: string) => {
    setSelectedFriendId(friendId);
    await loadConversation(friendId);
  };

  const handleSearchMovies = async () => {
    if (!movieQuery.trim()) {
      setMovieResults([]);
      return;
    }

    try {
      setIsSearchingMovies(true);
      const response = await moviesAPI.search(movieQuery.trim());
      setMovieResults((response.data || []) as Movie[]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Movie search failed');
    } finally {
      setIsSearchingMovies(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedFriendId) {
      setError('Select a friend first');
      return;
    }

    const normalizedText = messageText.trim();
    if (!normalizedText && !selectedAttachment) {
      setError('Write a message or attach a movie');
      return;
    }

    try {
      setError(null);
      setIsSending(true);

      const response = await messagesAPI.send(selectedFriendId, {
        text: normalizedText || undefined,
        movieTmdbId: selectedAttachment?.tmdbId,
        movieTitle: selectedAttachment?.title,
        moviePoster: selectedAttachment?.poster,
      });

      setMessageText('');
      setMovieResults([]);
      setMovieQuery('');
      setSelectedAttachment(null);
      setSharedMovie(null);
      await loadConversation(selectedFriendId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenSharedMovie = async (message: SocialMessage) => {
    if (!message.movieTmdbId && !message.movieTitle) {
      return;
    }

    try {
      setError(null);
      setIsOpeningMovie(true);

      let movie: Movie | null = null;

      if (message.movieTmdbId) {
        const response = await moviesAPI.getById(String(message.movieTmdbId));
        movie = response.data as Movie;
      } else if (message.movieTitle) {
        const response = await moviesAPI.search(message.movieTitle);
        const results = (response.data || []) as Movie[];
        movie = results[0] || null;
      }

      if (!movie) {
        setError('Movie details could not be loaded');
        return;
      }

      setSelectedMovie(movie);
      setIsMovieModalOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Movie details could not be loaded');
    } finally {
      setIsOpeningMovie(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={closeMessenger} size="xxl">
        <div className="h-[78vh] min-h-[560px] bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <MessageCircle size={18} />
            Messenger
          </div>
          <button onClick={closeMessenger} className="text-gray-300 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 min-h-0 min-w-0 ">
          <div className="border-r border-white/10 p-3 overflow-y-auto overflow-x-hidden scrollbar-hide min-w-0">
            <p className="text-xs text-gray-400 mb-2">Friends</p>
            {isLoadingFriends ? (
              <p className="text-sm text-gray-400">Loading friends...</p>
            ) : friends.length === 0 ? (
              <p className="text-sm text-gray-400">No friends available.</p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => handleSelectFriend(friend.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedFriendId === friend.id ? 'bg-red-600/20 border border-red-500/40' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-sm text-white font-medium truncate">{friend.name}</p>
                    <p className="text-xs text-gray-400 truncate">@{friend.username}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex flex-col min-h-0 min-w-0">
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-sm text-white font-medium">
                {selectedFriend ? `Chat mit ${selectedFriend.name}` : 'Select a friend'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide p-4 space-y-2 min-w-0">
              {isLoadingMessages && <p className="text-sm text-gray-400">Loading messages...</p>}
              {!isLoadingMessages && messages.length === 0 && (
                <p className="text-sm text-gray-400">No messages yet.</p>
              )}

              {messages.map((message) => {
                const isMine = message.senderId === currentUserId;

                return (
                <div
                  key={message.id}
                  className={`rounded-lg p-3 ${
                    isMine
                      ? 'ml-10 bg-red-600/20 border border-red-500/40'
                      : 'mr-10 bg-white/5 border border-white/10'
                  }`}
                >
                  <p className="text-xs text-gray-400 mb-1">
                    {isMine ? 'You' : message.sender.name}
                  </p>
                  {message.movieTitle && (
                    <button
                      type="button"
                      onClick={() => handleOpenSharedMovie(message)}
                      disabled={isOpeningMovie}
                      className="w-full text-left flex items-center gap-2 p-2 rounded bg-black/20 border border-white/10 mb-2 hover:bg-black/30 transition-colors disabled:opacity-60"
                    >
                      {message.movieTitle ? (
                        <img
                          src={resolvePosterUrl(message.moviePoster)}
                          alt={message.movieTitle}
                          className="w-8 h-12 rounded object-cover"
                          onError={(event) => {
                            event.currentTarget.src = posterFallback;
                          }}
                        />
                      ) : null}
                      <p className="text-sm text-white">🎬 {message.movieTitle}</p>
                    </button>
                  )}
                  {message.text ? <p className="text-sm text-white whitespace-pre-wrap break-words">{message.text}</p> : null}
                  <p className="text-[11px] text-gray-500 mt-2">{new Date(message.createdAt).toLocaleString()}</p>
                </div>
              )})}
            </div>

            <div className="border-t border-white/10 p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={movieQuery}
                  onChange={(event) => setMovieQuery(event.target.value)}
                  placeholder="Movie suchen zum Teilen"
                  className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400 text-sm"
                />
                <Button variant="secondary" size="sm" onClick={handleSearchMovies}>
                  <Search size={14} />
                </Button>
              </div>

              {isSearchingMovies && <p className="text-xs text-gray-400">Searching movies...</p>}

              {!isSearchingMovies && movieResults.length > 0 && (
                <div className="max-h-28 overflow-y-auto overflow-x-hidden scrollbar-hide space-y-1">
                  {movieResults.map((movie) => (
                    <button
                      key={`${movie.id}-${movie.title}`}
                      type="button"
                      onClick={() => {
                        setSelectedAttachment({
                          tmdbId: movie.tmdbId,
                          title: movie.title,
                          poster: movie.poster,
                        });
                        setSharedMovie(null);
                        setMovieResults([]);
                        setMovieQuery('');
                      }}
                      className="w-full text-left p-2 rounded bg-white/5 hover:bg-white/10"
                    >
                      <p className="text-sm text-white">{movie.title}</p>
                    </button>
                  ))}
                </div>
              )}

              {selectedAttachment && (
                <div className="flex items-center justify-between p-2 rounded bg-red-600/10 border border-red-500/30">
                  <p className="text-sm text-white truncate">🎬 {selectedAttachment.title}</p>
                  <button
                    type="button"
                    className="text-xs text-gray-300 hover:text-white"
                    onClick={() => {
                      setSelectedAttachment(null);
                      setSharedMovie(null);
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <textarea
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  rows={2}
                  placeholder="Nachricht schreiben..."
                  className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400 text-sm resize-none"
                />
                <Button variant="primary" size="sm" onClick={handleSendMessage} disabled={isSending}>
                  <Send size={14} />
                </Button>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          </div>
        </div>
        </div>
      </Modal>

      <MovieModal
        movie={selectedMovie}
        isOpen={isMovieModalOpen}
        onClose={() => {
          setIsMovieModalOpen(false);
          setSelectedMovie(null);
        }}
      />
    </>
  );
};

export default ChatWindowModal;
