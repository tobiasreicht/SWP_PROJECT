import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { friendsAPI } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

type SocialTab = 'friends' | 'requests';

interface FriendListItem {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  tasteMatch?: number;
  status?: string;
  relationId?: string;
  createdAt?: string;
}

interface FriendRequestItem {
  id: string;
  userId: string;
  name: string;
  username?: string;
  avatar?: string;
  status?: string;
  createdAt?: string;
}

interface FriendSearchResult {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  relationStatus: 'none' | 'pending' | 'accepted' | 'blocked';
}

export function SocialScreen({ navigation }: any) {
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [requests, setRequests] = useState<FriendRequestItem[]>([]);
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<SocialTab>('friends');

  useFocusEffect(
    React.useCallback(() => {
      void loadSocialData();
    }, [])
  );

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      void handleSearch(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const loadSocialData = async () => {
    try {
      setLoading(true);
      const [friendsRes, requestsRes] = await Promise.all([
        friendsAPI.getAll(),
        friendsAPI.getRequests(),
      ]);

      const mappedFriends = (Array.isArray(friendsRes.data) ? friendsRes.data : []).map((entry: any) => ({
        id: String(entry.id),
        relationId: entry.relationId ? String(entry.relationId) : undefined,
        name: String(entry.name || entry.username || 'Friend'),
        username: entry.username ? String(entry.username) : undefined,
        avatar: entry.avatar ? String(entry.avatar) : undefined,
        tasteMatch: typeof entry.tasteMatch === 'number' ? entry.tasteMatch : undefined,
        status: entry.status ? String(entry.status) : undefined,
        createdAt: entry.createdAt ? String(entry.createdAt) : undefined,
      }));

      const mappedRequests = (Array.isArray(requestsRes.data) ? requestsRes.data : []).map((entry: any) => ({
        id: String(entry.id),
        userId: String(entry.userId),
        name: String(entry.name || entry.username || 'User'),
        username: entry.username ? String(entry.username) : undefined,
        avatar: entry.avatar ? String(entry.avatar) : undefined,
        status: entry.status ? String(entry.status) : undefined,
        createdAt: entry.createdAt ? String(entry.createdAt) : undefined,
      }));

      setFriends(mappedFriends);
      setRequests(mappedRequests);
    } catch (error) {
      console.error('Failed to load social data:', error);
      Alert.alert('Error', 'Failed to load social data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await friendsAPI.search(query);
      setSearchResults(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = async (identifier: string) => {
    try {
      setSendingRequestTo(identifier);
      await friendsAPI.add({ identifier });
      Alert.alert('Success', 'Friend request sent');
      setSearchQuery('');
      setSearchResults([]);
      await loadSocialData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add friend');
    } finally {
      setSendingRequestTo(null);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendsAPI.acceptRequest(requestId);
      await loadSocialData();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const listData = useMemo(() => {
    if (searchQuery.trim() && tab === 'friends') {
      return searchResults;
    }

    return tab === 'friends' ? friends : requests;
  }, [searchQuery, tab, searchResults, friends, requests]);

  const renderAvatar = (name: string) => {
    const initial = name.trim().charAt(0).toUpperCase() || 'U';
    return (
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroEyebrow}>Social</Text>
        <Text style={styles.heroTitle}>Friends & Requests</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search users to add..."
        placeholderTextColor="#666"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'friends' && styles.tabActive]}
          onPress={() => {
            setTab('friends');
            setSearchQuery('');
          }}
        >
          <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'requests' && styles.tabActive]}
          onPress={() => {
            setTab('requests');
            setSearchQuery('');
          }}
        >
          <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>Requests</Text>
        </TouchableOpacity>
      </View>

      {searching ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" color="#dc2626" />
        </View>
      ) : listData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery.trim() ? 'No users found' : `No ${tab} yet`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData as any[]}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const isSearchMode = Boolean(searchQuery.trim() && tab === 'friends');

            return (
              <View style={styles.friendItem}>
                <View style={styles.friendInfo}>
                  {renderAvatar(String(item.name || item.username || 'User'))}
                  <View style={styles.details}>
                    <Text style={styles.friendName}>{item.name || item.username || 'User'}</Text>
                    {isSearchMode ? (
                      <Text style={styles.subText}>@{item.username}</Text>
                    ) : tab === 'friends' ? (
                      <Text style={styles.tasteMatch}>Taste Match: {item.tasteMatch ?? 0}%</Text>
                    ) : (
                      <Text style={styles.subText}>@{item.username || 'user'}</Text>
                    )}
                  </View>
                </View>

                {isSearchMode ? (
                  item.relationStatus === 'none' ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, sendingRequestTo === item.id && styles.actionBtnDisabled]}
                      onPress={() => handleAddFriend(String(item.id))}
                      disabled={sendingRequestTo === item.id}
                    >
                      <Text style={styles.actionBtnText}>
                        {sendingRequestTo === item.id ? 'Sending...' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.badgeMuted}>
                      <Text style={styles.badgeMutedText}>{item.relationStatus}</Text>
                    </View>
                  )
                ) : tab === 'friends' ? (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('Messages', { friendId: item.id, friendName: item.name })}
                  >
                    <Text style={styles.actionBtnText}>Message</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() => handleAcceptRequest(String(item.id))}
                  >
                    <Text style={styles.actionBtnText}>Accept</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0f14',
  },
  heroHeader: {
    paddingHorizontal: 15,
    paddingTop: 14,
  },
  heroEyebrow: {
    color: '#fda4af',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  searchInput: {
    backgroundColor: '#161b26',
    borderColor: '#2d3446',
    borderWidth: 1,
    color: '#fff',
    padding: 12,
    margin: 15,
    marginTop: 10,
    borderRadius: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomColor: '#242a3a',
    borderBottomWidth: 1,
    marginHorizontal: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomColor: '#ef4444',
    borderBottomWidth: 2,
  },
  tabText: {
    color: '#999',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 12,
    borderColor: '#262d3d',
    borderWidth: 1,
    backgroundColor: '#131722',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  friendInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  details: {
    justifyContent: 'center',
  },
  friendName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tasteMatch: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 4,
  },
  subText: {
    color: '#a3a3a3',
    fontSize: 12,
    marginTop: 4,
  },
  actionBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtn: {
    backgroundColor: '#059669',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },
  badgeMuted: {
    backgroundColor: '#1a1f2c',
    borderColor: '#2d3446',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeMutedText: {
    color: '#d4d4d4',
    fontSize: 11,
    textTransform: 'capitalize',
  },
});
