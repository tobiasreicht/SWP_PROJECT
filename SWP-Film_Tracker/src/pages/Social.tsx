import React, { useEffect, useMemo, useState } from 'react';
import { Users, ActivitySquare } from 'lucide-react';
import { FriendCard, ActivityFeedItem } from '../components/social';
import { Card, Button } from '../components/ui';
import { friendsAPI, recommendationsAPI } from '../services/api';
import {
  FriendRequest,
  FriendSearchResult,
  JointRecommendation,
  SocialActivityItem,
  SocialFriend,
} from '../types';

export const Social: React.FC = () => {
  const [friends, setFriends] = useState<SocialFriend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [activityFeed, setActivityFeed] = useState<SocialActivityItem[]>([]);
  const [jointRecs, setJointRecs] = useState<JointRecommendation[]>([]);
  const [identifier, setIdentifier] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedFriend = useMemo(
    () => friends.find((friend) => friend.id === selectedFriendId),
    [friends, selectedFriendId]
  );

  const loadSocialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [friendsResponse, requestsResponse, activityResponse] = await Promise.all([
        friendsAPI.getAll(),
        friendsAPI.getRequests(),
        friendsAPI.getActivity(),
      ]);

      const loadedFriends = (friendsResponse.data || []) as SocialFriend[];
      setFriends(loadedFriends);
      setRequests((requestsResponse.data || []) as FriendRequest[]);

      setActivityFeed(
        ((activityResponse.data || []) as SocialActivityItem[]).map((item) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }))
      );

      const firstFriendId = loadedFriends[0]?.id;
      const activeFriendId = selectedFriendId || firstFriendId;
      if (activeFriendId) {
        setSelectedFriendId(activeFriendId);
        const recommendationsResponse = await recommendationsAPI.getJoint(activeFriendId);
        setJointRecs((recommendationsResponse.data || []) as JointRecommendation[]);
      } else {
        setJointRecs([]);
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
          result.id === friendId
            ? {
                ...result,
                relationStatus: 'pending',
              }
            : result
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

  const handleSelectFriend = async (friendId: string) => {
    try {
      setSelectedFriendId(friendId);
      const recommendationsResponse = await recommendationsAPI.getJoint(friendId);
      setJointRecs((recommendationsResponse.data || []) as JointRecommendation[]);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load joint recommendations');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Social</h1>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Friends Section - Left */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users size={24} />
                Friends
              </h2>
            </div>

            <Card className="p-4 mb-4">
              <div className="flex gap-2">
                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="Search by name, username, or email"
                  className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400 text-sm"
                />
                <Button variant="primary" size="sm" onClick={handleSearchFriends}>
                  Search
                </Button>
              </div>

              {isSearching && <p className="text-xs text-gray-400 mt-3">Searching...</p>}

              {!isSearching && searchResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between gap-3 p-2 rounded bg-white/5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{result.name}</p>
                        <p className="text-xs text-gray-400 truncate">{result.email}</p>
                      </div>
                      {result.relationStatus === 'none' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSendFriendRequest(result.id)}
                        >
                          Add
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 capitalize">{result.relationStatus}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {requests.length > 0 && (
              <Card className="p-4 mb-4">
                <h3 className="text-white font-semibold mb-3">Pending Requests</h3>
                <div className="space-y-2">
                  {requests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-300 truncate">{request.name}</p>
                      <Button variant="secondary" size="sm" onClick={() => handleAcceptRequest(request.id)}>
                        Accept
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="space-y-4">
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <div key={friend.id} onClick={() => handleSelectFriend(friend.id)}>
                    <FriendCard
                      id={friend.id}
                      name={friend.name}
                      avatar={friend.avatar}
                      tasteMatch={friend.tasteMatch}
                      commonMovies={friend.commonMovies}
                      isAdded
                    />
                  </div>
                ))
              ) : (
                <Card className="p-6 text-center text-gray-400">
                  No friends yet. Add someone to get started.
                </Card>
              )}
            </div>
          </div>

          {/* Activity & Recommendations - Right */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Tabs */}
              <div className="space-y-6">
                {/* Activity Feed */}
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
                    <ActivitySquare size={24} />
                    Friend Activity
                  </h2>

                  <div className="divide-y divide-white/10">
                    {activityFeed.length > 0 ? (
                      activityFeed.map((item) => (
                        <ActivityFeedItem key={item.id} {...item} timestamp={new Date(item.timestamp)} />
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm py-2">No friend activity yet.</p>
                    )}
                  </div>
                </div>

                {/* Joint Recommendations */}
                <div className="border-t border-white/10 pt-6">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    {selectedFriend ? `Watch Together with ${selectedFriend.name}` : 'What You Should Watch Together'}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {jointRecs.length > 0 ? jointRecs.map((rec) => (
                      <Card
                        key={rec.movieId}
                        className="p-4 flex gap-4 items-start hover:border-red-500/50"
                      >
                        <img src={rec.poster} alt={rec.title} className="w-16 h-24 object-cover rounded" />
                        <div className="flex-1">
                          <h3 className="font-bold text-white mb-2">{rec.title}</h3>
                          <p className="text-sm text-gray-400 mb-3">
                            {rec.mutualRaters} friends rate it highly
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">Compatibility</span>
                            <span className="font-bold text-red-600">{rec.compatibilityScore}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                            <div
                              className="bg-red-600 h-2 rounded-full"
                              style={{ width: `${rec.compatibilityScore}%` }}
                            />
                          </div>
                        </div>
                      </Card>
                    )) : (
                      <p className="text-gray-400 text-sm">No joint recommendations yet.</p>
                    )}
                  </div>
                </div>
              </div>
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
    </div>
  );
};
