import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { WatchlistItem } from '../types';
import { watchlistAPI } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';

export function WatchlistScreen({ navigation }: any) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'planned' | 'watching' | 'watched'>('all');

  useFocusEffect(
    React.useCallback(() => {
      loadWatchlist();
    }, [])
  );

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      const response = await watchlistAPI.getAll();
      setItems(response.data);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (movieId: string) => {
    try {
      await watchlistAPI.remove(movieId);
      setItems(items.filter(item => item.movieId !== movieId));
      Alert.alert('Success', 'Removed from watchlist');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove from watchlist');
    }
  };

  const updateStatus = async (movieId: string, status: 'planned' | 'watching' | 'watched') => {
    try {
      await watchlistAPI.update(movieId, { status });
      const updated = items.map(item =>
        item.movieId === movieId ? { ...item, status } : item
      );
      setItems(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const filteredItems = filter === 'all'
    ? items
    : items.filter(item => item.status === filter);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {['all', 'planned', 'watching', 'watched'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No movies in this list</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemContainer}>
              <Image
                source={{ uri: item.movie?.poster }}
                style={styles.poster}
              />
              <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={2}>{item.movie?.title}</Text>
                <Text style={styles.status}>
                  Status: <Text style={styles.statusBadge}>{item.status}</Text>
                </Text>
                <Text style={styles.priority}>
                  Priority: <Text style={styles.priorityBadge}>{item.priority}</Text>
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => updateStatus(item.movieId, 'watched')}
                  >
                    <Text style={styles.actionText}>Mark Watched</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerButton]}
                    onPress={() => removeFromWatchlist(item.movieId)}
                  >
                    <Text style={styles.actionText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 15,
    justifyContent: 'space-around',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
  },
  filterButtonActive: {
    backgroundColor: '#dc2626',
  },
  filterText: {
    color: '#999',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#fff',
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
  itemContainer: {
    flexDirection: 'row',
    padding: 15,
    borderBottomColor: '#2a2a2a',
    borderBottomWidth: 1,
  },
  poster: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  status: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
  statusBadge: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  priority: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  priorityBadge: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
  },
  dangerButton: {
    backgroundColor: '#7f1d1d',
  },
  actionText: {
    color: '#fff',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
});
