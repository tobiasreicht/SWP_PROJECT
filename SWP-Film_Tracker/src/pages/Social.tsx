import React, { useEffect, useMemo, useState } from 'react';
import {
  Users, MessageCircle, Search, UserPlus,
  Sparkles, Clock3, Film, Star, Activity,
} from 'lucide-react';
import { FriendCard, ActivityFeedItem } from '../components/social';
import { Card, Button, Badge, Modal } from '../components/ui';
import { friendsAPI, recommendationsAPI, messagesAPI } from '../services/api';
import { useMessengerStore } from '../store';
import {
  FriendRequest, FriendSearchResult, JointRecommendation,
  SocialActivityItem, SocialFriend, SocialFriendProfile, SocialMessage,
} from '../types';
import { getPosterFallbackUrl, resolvePosterUrl } from '../utils/media';

type FriendCommonMovie = { id: string; title: string; poster: string; genres: string[] };

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
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [selectedFriendProfile, setSelectedFriendProfile] = useState<SocialFriendProfile | null>(null);
  const [selectedCommonMovies, setSelectedCommonMovies] = useState<FriendCommonMovie[]>([]);
  const [selectedJointRecs, setSelectedJointRecs] = useState<JointRecommendation[]>([]);
  const posterFallback = getPosterFallbackUrl();

  const selectedFriend = useMemo(() => friends.find(f => f.id === selectedFriendId), [friends, selectedFriendId]);

  const dedupeFriends = (items: SocialFriend[]) => {
    const map = new Map<string, SocialFriend>();
    items.forEach(f => { if (!map.has(f.id)) map.set(f.id, f); });
    return Array.from(map.values()).sort((a, b) => b.tasteMatch - a.tasteMatch || a.name.localeCompare(b.name));
  };

  const loadSocialData = async () => {
    try {
      setIsLoading(true); setError(null);
      const [fr, rr, ar, ir] = await Promise.all([
        friendsAPI.getAll(), friendsAPI.getRequests(), friendsAPI.getActivity(), messagesAPI.getInbox(),
      ]);
      const loaded = dedupeFriends((fr.data || []) as SocialFriend[]);
      setFriends(loaded);
      setRequests((rr.data || []) as FriendRequest[]);
      setActivityFeed(((ar.data || []) as SocialActivityItem[]).map(i => ({ ...i, timestamp: new Date(i.timestamp) })));
      setInbox((ir.data || []) as SocialMessage[]);
      if (!selectedFriendId && loaded[0]) setSelectedFriendId(loaded[0].id);
      if (selectedFriendId) {
        try { const r = await recommendationsAPI.getJoint(selectedFriendId); setJointRecs((r.data || []) as JointRecommendation[]); }
        catch { setJointRecs([]); }
      }
    } catch (e: any) { setError(e.response?.data?.error || 'Failed to load social data'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadSocialData(); }, []);

  const openFriendProfile = async (friendId: string) => {
    setIsProfileModalOpen(true); setIsProfileLoading(true); setSelectedFriendId(friendId);
    try {
      const [pr, cr, rr] = await Promise.all([
        friendsAPI.getProfile(friendId), friendsAPI.getCommonMovies(friendId), recommendationsAPI.getJoint(friendId),
      ]);
      setSelectedFriendProfile((pr.data || null) as SocialFriendProfile | null);
      setSelectedCommonMovies((cr.data || []) as FriendCommonMovie[]);
      setSelectedJointRecs((rr.data || []) as JointRecommendation[]);
      setJointRecs((rr.data || []) as JointRecommendation[]);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Could not load friend profile');
      setSelectedFriendProfile(null); setSelectedCommonMovies([]); setSelectedJointRecs([]);
    } finally { setIsProfileLoading(false); }
  };

  const handleSearchFriends = async () => {
    if (!identifier.trim()) { setSearchResults([]); return; }
    try {
      setIsSearching(true);
      const res = await friendsAPI.search(identifier.trim());
      setSearchResults((res.data || []) as FriendSearchResult[]);
    } catch (e: any) { setError(e.response?.data?.error || 'Could not search users'); }
    finally { setIsSearching(false); }
  };

  const handleSendRequest = async (friendId: string) => {
    try {
      await friendsAPI.add({ friendId });
      setSearchResults(p => p.map(r => r.id === friendId ? { ...r, relationStatus: 'pending' } : r));
      await loadSocialData();
    } catch (e: any) { setError(e.response?.data?.error || 'Could not send friend request'); }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try { await friendsAPI.acceptRequest(requestId); await loadSocialData(); }
    catch (e: any) { setError(e.response?.data?.error || 'Could not accept request'); }
  };

  const unreadCount = inbox.filter(m => !m.readAt).length;

  const PANELS = [
    { id: 'inbox', label: 'Inbox', icon: MessageCircle },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'together', label: 'Watch Together', icon: Sparkles },
  ] as const;

  return (
    <div className="page-container">
      <div className="page-inner">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Social</h1>
          <p className="text-gray-400 mt-1 text-sm">Friends, messages and watch-together picks</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Friends', value: friends.length },
            { label: 'Requests', value: requests.length },
            { label: 'Unread', value: unreadCount },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 text-center">
              <p className="text-gray-400 text-xs mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Left column */}
          <div className="xl:col-span-4 space-y-4">

            {/* Find people */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Search size={15} className="text-red-400" /> Find People
              </h3>
              <div className="flex gap-2">
                <input
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchFriends()}
                  placeholder="Name, username or email…"
                  className="field flex-1"
                />
                <Button variant="primary" size="sm" onClick={handleSearchFriends}>
                  {isSearching ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : 'Search'}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="mt-3 space-y-1.5 max-h-52 overflow-y-auto scrollbar-hide">
                  {searchResults.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/[0.05]">
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{r.name}</p>
                        <p className="text-xs text-gray-500">@{r.username}</p>
                      </div>
                      {r.relationStatus === 'none' ? (
                        <button onClick={() => handleSendRequest(r.id)} className="p-1.5 rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/25 transition-colors">
                          <UserPlus size={14} />
                        </button>
                      ) : (
                        <Badge variant="outline" className="text-xs capitalize">{r.relationStatus}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending requests */}
            {requests.length > 0 && (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.04] p-4">
                <h3 className="text-white font-semibold mb-3">Pending Requests <span className="ml-1 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">{requests.length}</span></h3>
                <div className="space-y-1.5">
                  {requests.map(r => (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/[0.05]">
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{r.name}</p>
                        <p className="text-xs text-gray-500">@{r.username}</p>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => handleAcceptRequest(r.id)}>Accept</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends list */}
            <div>
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Users size={15} className="text-red-400" /> Friends
                {friends.length > 0 && <span className="text-xs text-gray-500 font-normal">{friends.length}</span>}
              </h2>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl bg-white/[0.04] animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
                  ))}
                </div>
              ) : friends.length > 0 ? (
                <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-hide">
                  {friends.map(f => (
                    <FriendCard
                      key={f.id}
                      id={f.id}
                      name={f.name}
                      username={f.username}
                      avatar={f.avatar}
                      tasteMatch={f.tasteMatch}
                      commonMovies={f.commonMovies}
                      onSelect={openFriendProfile}
                      onViewProfile={openFriendProfile}
                      onMessage={id => openMessenger({ friendId: id })}
                      isAdded
                      isSelected={f.id === selectedFriendId && isProfileModalOpen}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-8 text-center">
                  <Users size={24} className="text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No friends yet</p>
                  <p className="text-gray-600 text-xs mt-1">Search above to connect with others</p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="xl:col-span-8">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] overflow-hidden">

              {/* Panel tabs */}
              <div className="flex items-center gap-1 p-1 border-b border-white/[0.07] bg-white/[0.02]">
                {PANELS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActivePanel(id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all flex-1 justify-center ${
                      activePanel === id ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                    {id === 'inbox' && unreadCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/30 text-red-300 text-[10px] font-bold">{unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activePanel === 'inbox' && (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-hide">
                    {inbox.length === 0 ? (
                      <div className="py-16 text-center">
                        <MessageCircle size={24} className="text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No messages yet</p>
                      </div>
                    ) : inbox.map(msg => (
                      <button
                        key={msg.id}
                        type="button"
                        onClick={() => openMessenger({ friendId: msg.senderId })}
                        className={`w-full text-left rounded-xl p-3.5 transition-colors ${
                          msg.readAt ? 'bg-white/[0.03] hover:bg-white/[0.06]' : 'bg-red-600/[0.1] border border-red-500/20 hover:bg-red-600/[0.16]'
                        }`}
                      >
                        <p className="text-xs font-semibold text-white mb-0.5">{msg.sender.name}</p>
                        {msg.movieTitle && <p className="text-xs text-red-400 mb-0.5 flex items-center gap-1"><Film size={11} />{msg.movieTitle}</p>}
                        {msg.text && <p className="text-sm text-gray-300 line-clamp-2">{msg.text}</p>}
                        <p className="text-[10px] text-gray-500 mt-1.5">{new Date(msg.createdAt).toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                )}

                {activePanel === 'activity' && (
                  <div className="divide-y divide-white/[0.05] max-h-[500px] overflow-y-auto scrollbar-hide">
                    {activityFeed.length > 0 ? (
                      activityFeed.map(item => (
                        <ActivityFeedItem key={item.id} {...item} timestamp={new Date(item.timestamp)} />
                      ))
                    ) : (
                      <div className="py-16 text-center">
                        <Activity size={24} className="text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No friend activity yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activePanel === 'together' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto scrollbar-hide">
                    {jointRecs.length > 0 ? jointRecs.map(rec => (
                      <div key={rec.movieId} className="flex gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.1] transition-colors">
                        <img
                          src={resolvePosterUrl(rec.poster)}
                          alt={rec.title}
                          className="w-14 h-20 object-cover rounded-lg flex-shrink-0"
                          onError={e => { e.currentTarget.src = posterFallback; }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate mb-1">{rec.title}</p>
                          <p className="text-gray-500 text-xs mb-2">{rec.mutualRaters} mutual fans</p>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-400">Match</span>
                            <span className="text-red-400 font-bold">{rec.compatibilityScore}%</span>
                          </div>
                          <div className="h-1 rounded-full bg-white/[0.08]">
                            <div className="h-1 rounded-full bg-red-600" style={{ width: `${rec.compatibilityScore}%` }} />
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="col-span-2 py-16 text-center">
                        <Sparkles size={24} className="text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Open a friend profile to see watch-together picks</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Friend Profile Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title={selectedFriend ? `${selectedFriend.name}` : 'Friend Profile'}
        size="xxl"
      >
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto scrollbar-hide">
          {isProfileLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/[0.04] animate-pulse" />)}
            </div>
          )}

          {!isProfileLoading && !selectedFriendProfile && (
            <p className="text-gray-400 text-sm">Could not load this profile.</p>
          )}

          {!isProfileLoading && selectedFriendProfile && (
            <>
              {/* Profile header */}
              <div className="flex items-start gap-4 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.04]">
                {selectedFriendProfile.profile.avatar ? (
                  <img src={selectedFriendProfile.profile.avatar} alt={selectedFriendProfile.profile.displayName}
                    className="w-16 h-16 rounded-2xl object-cover ring-1 ring-white/[0.1]" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-red-600/20 flex items-center justify-center text-red-400 text-2xl font-bold">
                    {selectedFriendProfile.profile.displayName[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white">{selectedFriendProfile.profile.displayName}</h3>
                  <p className="text-gray-400 text-sm">@{selectedFriendProfile.profile.username}</p>
                  {selectedFriendProfile.profile.bio && (
                    <p className="text-gray-300 text-sm mt-1">{selectedFriendProfile.profile.bio}</p>
                  )}
                </div>
                <Button variant="secondary" size="sm" onClick={() => openMessenger({ friendId: selectedFriendProfile.profile.id })}>
                  <MessageCircle size={13} /> Message
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Taste Match', value: `${selectedFriendProfile.stats.tasteMatch}%` },
                  { label: 'Common', value: selectedFriendProfile.stats.commonMovies },
                  { label: 'Watchlist', value: selectedFriendProfile.stats.watchlistCount },
                  { label: 'Avg Rating', value: `${selectedFriendProfile.stats.recentAverageRating}/10` },
                ].map(s => (
                  <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-3 text-center">
                    <p className="text-gray-500 text-xs mb-1">{s.label}</p>
                    <p className="text-white font-bold">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent ratings */}
              {selectedFriendProfile.recentRatings.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                    <Clock3 size={13} className="text-red-400" /> Recent Ratings
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedFriendProfile.recentRatings.map(item => (
                      <div key={item.id} className="flex gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                        <img src={resolvePosterUrl(item.movie.poster)} alt={item.movie.title}
                          className="w-10 h-14 object-cover rounded-lg flex-shrink-0"
                          onError={e => { e.currentTarget.src = posterFallback; }} />
                        <div className="min-w-0">
                          <p className="text-white text-xs font-medium truncate">{item.movie.title}</p>
                          <p className="text-yellow-400 text-xs mt-1 flex items-center gap-1">
                            <Star size={10} className="fill-yellow-400" />{item.rating}/10
                          </p>
                          <p className="text-gray-500 text-[10px] mt-0.5">{new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Common + together picks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4">
                  <h4 className="text-white font-semibold text-sm mb-3">Both Rated</h4>
                  {selectedCommonMovies.length > 0 ? (
                    <div className="grid grid-cols-4 gap-1.5">
                      {selectedCommonMovies.slice(0, 8).map(m => (
                        <div key={m.id}>
                          <img src={resolvePosterUrl(m.poster)} alt={m.title}
                            className="w-full aspect-[2/3] rounded-lg object-cover"
                            onError={e => { e.currentTarget.src = posterFallback; }} />
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 text-sm">No common titles yet</p>}
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4">
                  <h4 className="text-white font-semibold text-sm mb-3">Watch Together</h4>
                  {selectedJointRecs.length > 0 ? (
                    <div className="space-y-2">
                      {selectedJointRecs.slice(0, 4).map(r => (
                        <div key={r.movieId} className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] p-2">
                          <img src={resolvePosterUrl(r.poster)} alt={r.title}
                            className="w-9 h-12 object-cover rounded-lg flex-shrink-0"
                            onError={e => { e.currentTarget.src = posterFallback; }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-xs font-medium truncate">{r.title}</p>
                            <p className="text-red-400 text-xs">{r.compatibilityScore}% match</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 text-sm">No picks yet</p>}
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
