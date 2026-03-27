import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { Friend } from '../types';
import { friendsAPI, messagesAPI } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

export function SocialScreen({ navigation }: any) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'friends' | 'requests'>('friends');

  useFocusEffect(
    React.useCallback(() => {
      loadFriends();
    }, [])
  );

  const loadFriends = async () => {
    try {
      setLoading(true);
      const [friendsRes, requestsRes] = await Promise.all([
        friendsAPI.getAll(),
        friendsAPI.getRequests(),
      ]);
      if (tab === 'friends') {
        setFriends(friendsRes.data);
      } else {
        setFriends(requestsRes.data);
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      loadFriends();
      return;
    }

    try {
      const response = await friendsAPI.search(query);
      setFriends(response.data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleAddFriend = async (identifier: string) => {
    try {
      await friendsAPI.add({ identifier });
      Alert.alert('Success', 'Friend request sent');
      loadFriends();
    } catch (error) {
      Alert.alert('Error', 'Failed to add friend');
    }
  };

  const handleAcceptRequest = async (friendId: string) => {
    try {
      await friendsAPI.acceptRequest(friendId);
      loadFriends();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
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
      <TextInput
        style={styles.searchInput}
        placeholder="Search friends..."
        placeholderTextColor="#666"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'friends' && styles.tabActive]}
          onPress={() => {
            setTab('friends');
            loadFriends();
          }}
        >
          <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'requests' && styles.tabActive]}
          onPress={() => {
            setTab('requests');
            loadFriends();
          }}
        >
          <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>Requests</Text>
        </TouchableOpacity>
      </View>

      {friends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No {tab} yet</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.friendItem}>
              <View style={styles.friendInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>👤</Text>
                </View>
                <View style={styles.details}>
                  <Text style={styles.friendName}>
                    Friend {item.friendId.slice(0, 8)}
                  </Text>
                  {item.tasteMatch && (
                    <Text style={styles.tasteMatch}>
                      Taste Match: {item.tasteMatch}%
                    </Text>
                  )}
                </View>
              </View>

              {tab === 'friends' ? (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('Messages', { friendId: item.friendId })}
                >
                  <Text style={styles.actionBtnText}>Message</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.acceptBtn]}
                  onPress={() => handleAcceptRequest(item.id)}
                >
                  <Text style={styles.actionBtnText}>Accept</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    borderWidth: 1,
    color: '#fff',
    padding: 12,
    margin: 15,
    borderRadius: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomColor: '#2a2a2a',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomColor: '#dc2626',
    borderBottomWidth: 2,
  },
  tabText: {
    color: '#999',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
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
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomColor: '#2a2a2a',
    borderBottomWidth: 1,
  },
  friendInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
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
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  actionBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  acceptBtn: {
    backgroundColor: '#059669',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
