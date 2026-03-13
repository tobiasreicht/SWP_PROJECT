import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  ActivitySquare,
  MessageCircle,
  Search,
  UserPlus,
  Sparkles,
  Clock3,
  UserRound,
  Film,
  Star,
} from 'lucide-react';
import { FriendCard, ActivityFeedItem } from '../components/social';
import { Card, Button, Badge, Modal } from '../components/ui';
import { friendsAPI, recommendationsAPI, messagesAPI } from '../services/api';
import { useMessengerStore } from '../store';
import {
  FriendRequest,
  FriendSearchResult,
  JointRecommendation,
  SocialActivityItem,
  SocialFriend,
  SocialFriendProfile,
  SocialMessage,
} from '../types';
import { getPosterFallbackUrl, resolvePosterUrl } from '../utils/media';

type FriendCommonMovie = {
  id: string;
  title: string;
  poster: string;
  genres: string[];
};

export const Social: React.FC = () => {
  const { openMessenger } = useMessengerStore();

  const [friends, setFriends] = useState<SocialFriend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [activityFeed, setActivityFeed] = useState<SocialActivityItem[]>([]);
  const [jointRecs, setJointRecs] = useState<JointRecommendation[]>([]);
  const [inbox, setInbox] = useState<SocialMessage[]>([]);

  const [identifier, setIdentifier] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activePanel, setActivePanel] = useState<'inbox' | 'activity' | 'together'>('inbox');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  const [selectedFriendProfile, setSelectedFriendProfile] = useState<SocialFriendProfile | null>(null);
  const [selectedCommonMovies, setSelectedCommonMovies] = useState<FriendCommonMovie[]>([]);
  const [selectedJointRecs, setSelectedJointRecs] = useState<JointRecommendation[]>([]);
  const posterFallback = getPosterFallbackUrl();

  const selectedFriend = useMemo(
    () => friends.find((friend) => friend.id === selectedFriendId),
    [friends, selectedFriendId]
  );

  const dedupeFriends = (items: SocialFriend[]) => {
    const map = new Map<string, SocialFriend>();
    items.forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => b.tasteMatch - a.tasteMatch || a.name.localeCompare(b.name)
    );
  };

  const loadSocialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [friendsResponse, requestsResponse, activityResponse, inboxResponse] = await Promise.all([
        friendsAPI.getAll(),
        friendsAPI.getRequests(),
        friendsAPI.getActivity(),
        messagesAPI.getInbox(),
      ]);

      const loadedFriends = dedupeFriends((friendsResponse.data || []) as SocialFriend[]);
      setFriends(loadedFriends);
      setRequests((requestsResponse.data || []) as FriendRequest[]);

      setActivityFeed(
        ((activityResponse.data || []) as SocialActivityItem[]).map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
      );
      setInbox((inboxResponse.data || []) as SocialMessage[]);

      if (!selectedFriendId && loadedFriends[0]) {
        setSelectedFriendId(loadedFriends[0].id);
      }

      if (selectedFriendId) {
        try {
          const recsResponse = await recommendationsAPI.getJoint(selectedFriendId);
          setJointRecs((recsResponse.data || []) as JointRecommendation[]);
        } catch {
          setJointRecs([]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load social data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSocialData();
  }, []);

  const openFriendProfileModal = async (friendId: string) => {
    try {
      setIsProfileModalOpen(true);
      setIsProfileLoading(true);
      setSelectedFriendId(friendId);

      const [profileResponse, commonMoviesResponse, recsResponse] = await Promise.all([
        friendsAPI.getProfile(friendId),
        friendsAPI.getCommonMovies(friendId),
        recommendationsAPI.getJoint(friendId),
      ]);

      setSelectedFriendProfile((profileResponse.data || null) as SocialFriendProfile | null);
      setSelectedCommonMovies((commonMoviesResponse.data || []) as FriendCommonMovie[]);
      setSelectedJointRecs((recsResponse.data || []) as JointRecommendation[]);
      setJointRecs((recsResponse.data || []) as JointRecommendation[]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load friend profile');
      setSelectedFriendProfile(null);
      setSelectedCommonMovies([]);
      setSelectedJointRecs([]);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleSearchFriends = async () => {
    if (!identifier.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await friendsAPI.search(identifier.trim());
      setSearchResults((response.data || []) as FriendSearchResult[]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (friendId: string) => {
    try {
      await friendsAPI.add({ friendId });
      setSearchResults((previous) =>
        previous.map((result) =>
          result.id === friendId ? { ...result, relationStatus: 'pending' } : result
        )
      );
      await loadSocialData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendsAPI.acceptRequest(requestId);
      await loadSocialData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not accept friend request');
    }
  };

  const handleMessageFriend = (friendId: string) => {
    openMessenger({ friendId });
  };

  const unreadCount = inbox.filter((item) => !item.readAt).length;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 p-7 mb-8 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.25),rgba(2,132,199,0.12)_45%,rgba(15,23,42,0.6)_100%)]">
          <div className="absolute -top-20 -right-10 w-52 h-52 rounded-full bg-red-500/15 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="relative">
            <p className="text-red-300 text-xs uppercase tracking-[0.25em] mb-2">Community</p>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">Social Lounge</h1>
            <p className="text-gray-300 text-sm mt-2 max-w-2xl">
              Talk movies, discover your crew, and open each friend profile in a cinematic quick-view modal.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              <Card className="p-4 bg-white/5">
                <p className="text-xs text-gray-400">Friends</p>
                <p className="text-2xl font-black text-white">{friends.length}</p>
              </Card>
              <Card className="p-4 bg-white/5">
                <p className="text-xs text-gray-400">Pending Requests</p>
                <p className="text-2xl font-black text-white">{requests.length}</p>
              </Card>
              <Card className="p-4 bg-white/5">
                <p className="text-xs text-gray-400">Unread Inbox</p>
                <p className="text-2xl font-black text-white">{unreadCount}</p>
              </Card>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-4 space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Search size={16} className="text-red-400" />
                <h2 className="text-white font-semibold">Find People</h2>
              </div>
              <div className="flex gap-2">
                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSearchFriends();
                    }
                  }}
                  placeholder="name, username, or email"
                  className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400 text-sm"
                />
                <Button variant="primary" size="sm" onClick={handleSearchFriends}>
                  Search
                </Button>
              </div>

              {isSearching && <p className="text-xs text-gray-400 mt-3">Searching...</p>}

              {!isSearching && searchResults.length > 0 && (
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                  {searchResults.map((result) => (
                    <div key={result.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/5">
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{result.name}</p>
                        <p className="text-xs text-gray-400 truncate">@{result.username}</p>
                      </div>
                      {result.relationStatus === 'none' ? (
                        <Button variant="secondary" size="sm" onClick={() => handleSendFriendRequest(result.id)}>
                          <UserPlus size={14} />
                        </Button>
                      ) : (
                        <Badge variant="outline" className="capitalize text-xs">
                          {result.relationStatus}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {requests.length > 0 && (
              <Card className="p-4">
                <h3 className="text-white font-semibold mb-3">Pending Requests</h3>
                <div className="space-y-2">
                  {requests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/5 p-2.5">
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{request.name}</p>
                        <p className="text-xs text-gray-400 truncate">@{request.username}</p>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => handleAcceptRequest(request.id)}>
                        Accept
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-3">
                <Users size={20} />
                Friends
              </h2>
              <div className="space-y-3 max-h-[640px] overflow-y-auto scrollbar-hide pr-1">
                {friends.length > 0 ? (
                  friends.map((friend) => (
                    <FriendCard
                      key={friend.id}
                      id={friend.id}
                      name={friend.name}
                      username={friend.username}
                      avatar={friend.avatar}
                      tasteMatch={friend.tasteMatch}
                      commonMovies={friend.commonMovies}
                      onSelect={openFriendProfileModal}
                      onViewProfile={openFriendProfileModal}
                      onMessage={handleMessageFriend}
                      isAdded
                      isSelected={friend.id === selectedFriendId && isProfileModalOpen}
                    />
                  ))
                ) : (
                  <Card className="p-6 text-center text-gray-400">
                    No friends yet. Add someone to get started.
                  </Card>
                )}
              </div>
            </div>
          </div>

          <div className="xl:col-span-8">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                <h2 className="text-2xl font-black text-white">Social Stream</h2>
                <div className="flex flex-wrap gap-2">
                  {([
                    { id: 'inbox', label: 'Inbox', icon: MessageCircle },
                    { id: 'activity', label: 'Activity', icon: ActivitySquare },
                    { id: 'together', label: 'Watch Together', icon: Sparkles },
                  ] as const).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActivePanel(id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        activePanel === id
                          ? 'bg-red-600 text-white'
                          : 'text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {activePanel === 'inbox' && (
                <div className="space-y-2 max-h-[620px] overflow-y-auto scrollbar-hide pr-1">
                  {inbox.length === 0 ? (
                    <p className="text-sm text-gray-400">No incoming messages yet.</p>
                  ) : (
                    inbox.map((message) => (
                      <button
                        key={message.id}
                        type="button"
                        onClick={() => openMessenger({ friendId: message.senderId })}
                        className="w-full text-left rounded-xl border border-white/10 p-3.5 bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <p className="text-xs text-gray-400 mb-1">From {message.sender.name}</p>
                        {message.movieTitle && (
                          <p className="text-sm text-red-300 mb-1 flex items-center gap-1">
                            <Film size={14} />
                            {message.movieTitle}
                          </p>
                        )}
                        {message.text && <p className="text-sm text-white">{message.text}</p>}
                        <p className="text-[11px] text-gray-500 mt-2">{new Date(message.createdAt).toLocaleString()}</p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {activePanel === 'activity' && (
                <div className="divide-y divide-white/10">
                  {activityFeed.length > 0 ? (
                    activityFeed.map((item) => (
                      <ActivityFeedItem key={item.id} {...item} timestamp={new Date(item.timestamp)} />
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm py-2">No friend activity yet.</p>
                  )}
                </div>
              )}

              {activePanel === 'together' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {jointRecs.length > 0 ? (
                    jointRecs.map((rec) => (
                      <Card key={rec.movieId} className="p-4 flex gap-4 items-start hover:border-red-500/50">
                        <img
                          src={resolvePosterUrl(rec.poster)}
                          alt={rec.title}
                          className="w-16 h-24 object-cover rounded"
                          onError={(event) => {
                            event.currentTarget.src = posterFallback;
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white mb-1 truncate">{rec.title}</h3>
                          <p className="text-sm text-gray-400 mb-2">{rec.mutualRaters} friends rate it highly</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Compatibility</span>
                            <span className="font-bold text-red-400">{rec.compatibilityScore}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                            <div className="bg-red-600 h-2 rounded-full" style={{ width: `${rec.compatibilityScore}%` }} />
                          </div>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">Open a friend profile to load personalized watch-together picks.</p>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>

        {(isLoading || error) && (
          <div className="mt-6">
            {isLoading && <p className="text-gray-400">Loading social data...</p>}
            {error && <p className="text-red-400">{error}</p>}
          </div>
        )}
      </div>

      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title={selectedFriend ? `${selectedFriend.name} - Public Profile` : 'Friend Profile'}
        size="xxl"
      >
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-hide">
          {isProfileLoading && <p className="text-gray-400">Loading profile...</p>}

          {!isProfileLoading && !selectedFriendProfile && (
            <p className="text-gray-400">Could not load this friend profile.</p>
          )}

          {!isProfileLoading && selectedFriendProfile && (
            <>
              <div className="rounded-2xl border border-white/10 p-5 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.25),rgba(15,23,42,0.25)_60%)]">
                <div className="flex items-start gap-4">
                  {selectedFriendProfile.profile.avatar ? (
                    <img
                      src={selectedFriendProfile.profile.avatar}
                      alt={selectedFriendProfile.profile.displayName}
                      className="w-20 h-20 rounded-xl object-cover ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                      {selectedFriendProfile.profile.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-2xl font-black text-white">{selectedFriendProfile.profile.displayName}</h3>
                    <p className="text-sm text-gray-300">@{selectedFriendProfile.profile.username}</p>
                    <p className="text-sm text-gray-200 mt-2">
                      {selectedFriendProfile.profile.bio || 'No bio available.'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Joined {new Date(selectedFriendProfile.profile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => handleMessageFriend(selectedFriendProfile.profile.id)}
                  >
                    <MessageCircle size={14} />
                    Message
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-3 text-center">
                  <p className="text-xs text-gray-400">Taste Match</p>
                  <p className="text-lg font-black text-white">{selectedFriendProfile.stats.tasteMatch}%</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-xs text-gray-400">Common Movies</p>
                  <p className="text-lg font-black text-white">{selectedFriendProfile.stats.commonMovies}</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-xs text-gray-400">Watchlist</p>
                  <p className="text-lg font-black text-white">{selectedFriendProfile.stats.watchlistCount}</p>
                </Card>
                <Card className="p-3 text-center">
                  <p className="text-xs text-gray-400">Recent Avg</p>
                  <p className="text-lg font-black text-white">{selectedFriendProfile.stats.recentAverageRating}/10</p>
                </Card>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Clock3 size={16} className="text-red-400" />
                  Recent Ratings
                </h4>
                {selectedFriendProfile.recentRatings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedFriendProfile.recentRatings.map((item) => (
                      <Card key={item.id} className="p-3 flex gap-3 items-start">
                        <img
                          src={resolvePosterUrl(item.movie.poster)}
                          alt={item.movie.title}
                          className="w-12 h-16 rounded object-cover"
                          onError={(event) => {
                            event.currentTarget.src = posterFallback;
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.movie.title}</p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Star size={12} className="text-yellow-400" />
                            Rated {item.rating}/10
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No public ratings yet.</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="text-white font-semibold mb-3">Movies You Both Rated</h4>
                  {selectedCommonMovies.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedCommonMovies.slice(0, 9).map((movie) => (
                        <div key={movie.id}>
                          <img
                            src={resolvePosterUrl(movie.poster)}
                            alt={movie.title}
                            className="w-full aspect-[2/3] rounded object-cover"
                            onError={(event) => {
                              event.currentTarget.src = posterFallback;
                            }}
                          />
                          <p className="text-[11px] text-gray-300 mt-1 truncate">{movie.title}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No common titles yet.</p>
                  )}
                </Card>

                <Card className="p-4">
                  <h4 className="text-white font-semibold mb-3">Watch Together Picks</h4>
                  {selectedJointRecs.length > 0 ? (
                    <div className="space-y-2">
                      {selectedJointRecs.slice(0, 4).map((rec) => (
                        <div key={rec.movieId} className="flex items-center gap-3 rounded-lg bg-white/5 p-2">
                          <img
                            src={resolvePosterUrl(rec.poster)}
                            alt={rec.title}
                            className="w-10 h-14 rounded object-cover"
                            onError={(event) => {
                              event.currentTarget.src = posterFallback;
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-white truncate">{rec.title}</p>
                            <p className="text-xs text-gray-400">Compatibility: {rec.compatibilityScore}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No joint recommendations yet.</p>
                  )}
                </Card>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
