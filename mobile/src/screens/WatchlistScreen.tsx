import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import { Rating, WatchlistItem } from '../types';
import { moviesAPI, ratingsAPI, watchlistAPI } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { getPosterFallbackUrl, resolvePosterUrl } from '../utils/media';

export function WatchlistScreen({ navigation }: any) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'planned' | 'watching' | 'watched'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const posterFallback = getPosterFallbackUrl();

  useFocusEffect(
    React.useCallback(() => {
      loadWatchlist();
    }, [])
  );

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      const [watchlistResponse, ratingsResponse] = await Promise.all([
        watchlistAPI.getAll(),
        ratingsAPI.getUserRatings(),
      ]);
      setItems(Array.isArray(watchlistResponse.data) ? watchlistResponse.data : []);
      setRatings(Array.isArray(ratingsResponse.data) ? ratingsResponse.data : ratingsResponse.data?.data || []);
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

  const openMovieDetail = async (item: WatchlistItem) => {
    try {
      if (item.movie?.id) {
        navigation.navigate('MovieDetail', { movie: item.movie });
        return;
      }

      const targetId = String(item.movie?.tmdbId || item.movieId);
      const response = await moviesAPI.getById(targetId);
      navigation.navigate('MovieDetail', { movie: response.data });
    } catch (error) {
      console.error('Failed to open movie detail from watchlist:', error);
      Alert.alert('Error', 'Failed to open movie details.');
    }
  };

  const ratingsByMovieId = ratings.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.movieId] = entry.rating;
    return acc;
  }, {});

  const filteredItems = items.filter((item) => {
    const statusMatch = filter === 'all' || item.status === filter;
    const titleMatch = !searchQuery.trim() || item.movie?.title?.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return statusMatch && titleMatch;
  });

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
        <Text style={styles.heroEyebrow}>Library</Text>
        <Text style={styles.heroTitle}>Your Watchlist</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search watchlist"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

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
          <Text style={styles.emptyText}>No titles in this list</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.itemContainer} onPress={() => openMovieDetail(item)} activeOpacity={0.9}>
              <Image
                source={{ uri: resolvePosterUrl(item.movie?.poster) || posterFallback }}
                style={styles.poster}
              />
              <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={2}>{item.movie?.title}</Text>
                {item.movie?.type === 'series' ? (
                  <Text style={styles.seriesBadge}>{item.movie.seasonCount ? `${item.movie.seasonCount} seasons` : 'Series'}</Text>
                ) : null}
                <Text style={styles.status}>
                  Status: <Text style={styles.statusBadge}>{item.status}</Text>
                </Text>
                <Text style={styles.priority}>
                  Priority: <Text style={styles.priorityBadge}>{item.priority}</Text>
                </Text>
                {item.movie?.rating ? <Text style={styles.metaLine}>TMDB {item.movie.rating.toFixed(1)}</Text> : null}
                {ratingsByMovieId[item.movieId] ? <Text style={styles.metaLine}>Your rating ★ {ratingsByMovieId[item.movieId]}/10</Text> : null}
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
            </TouchableOpacity>
          )}
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
    paddingHorizontal: 14,
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
  searchWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  searchInput: {
    backgroundColor: '#161b26',
    borderColor: '#2d3446',
    borderWidth: 1,
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 12,
    justifyContent: 'space-around',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1a1f2c',
    borderColor: '#2d3446',
    borderWidth: 1,
  },
  filterButtonActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
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
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 14,
    borderColor: '#272d3d',
    borderBottomWidth: 1,
    borderWidth: 1,
    backgroundColor: '#141924',
    padding: 12,
  },
  poster: {
    width: 86,
    height: 128,
    borderRadius: 10,
    backgroundColor: '#1f2532',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  seriesBadge: {
    color: '#c7d2fe',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  status: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
  statusBadge: {
    color: '#f87171',
    fontWeight: 'bold',
  },
  priority: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  priorityBadge: {
    color: '#f87171',
    fontWeight: 'bold',
  },
  metaLine: {
    color: '#b3b3bb',
    fontSize: 12,
    marginTop: 5,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#ef4444',
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
