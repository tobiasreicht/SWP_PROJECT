import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native';
import { Movie } from '../types';
import { moviesAPI, recommendationsAPI, watchlistAPI } from '../services/api';

export function HomeScreen({ navigation }: any) {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trendingRes, newRes, recRes, watchlistRes] = await Promise.all([
        moviesAPI.getTrending(),
        moviesAPI.getNewReleases(),
        recommendationsAPI.getPersonal(10),
        watchlistAPI.getCount(),
      ]);
      setTrending(trendingRes.data);
      setNewReleases(newRes.data);

      const recommendedMovies = Array.isArray(recRes.data)
        ? recRes.data
            .map((entry: { movie?: Movie }) => entry.movie)
            .filter((movie): movie is Movie => Boolean(movie))
        : [];
      setRecommended(recommendedMovies);
      setWatchlistCount((watchlistRes.data?.count as number | undefined) ?? (watchlistRes.data?.total as number | undefined) ?? 0);
    } catch (error) {
      console.error('Failed to load movies:', error);
    } finally {
      setLoading(false);
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome</Text>
        <Text style={styles.headerSubtitle}>Discover amazing movies</Text>
      </View>

      <View style={styles.quickStats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{watchlistCount}</Text>
          <Text style={styles.statText}>Watchlist</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{trending.length}</Text>
          <Text style={styles.statText}>Trending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{recommended.length}</Text>
          <Text style={styles.statText}>For You</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Trending Now</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={trending.slice(0, 10)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.movieCard}
            onPress={() => navigation.navigate('MovieDetail', { movie: item })}
          >
            <Image
              source={{ uri: item.poster }}
              style={styles.moviePoster}
            />
            <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
          </TouchableOpacity>
        )}
        scrollEnabled={true}
        style={styles.horizontalList}
      />

      <Text style={styles.sectionTitle}>New Releases</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={newReleases.slice(0, 10)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.movieCard}
            onPress={() => navigation.navigate('MovieDetail', { movie: item })}
          >
            <Image
              source={{ uri: item.poster }}
              style={styles.moviePoster}
            />
            <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
          </TouchableOpacity>
        )}
        scrollEnabled={true}
        style={styles.horizontalList}
      />

      <Text style={styles.sectionTitle}>Recommended For You</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={recommended.slice(0, 10)}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.movieCard}
            onPress={() => navigation.navigate('MovieDetail', { movie: item })}
          >
            <Image
              source={{ uri: item.poster }}
              style={styles.moviePoster}
            />
            <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
          </TouchableOpacity>
        )}
        scrollEnabled={true}
        style={styles.horizontalList}
      />

      <View style={styles.discoveryCard}>
        <Text style={styles.discoveryTitle}>Continue discovering</Text>
        <Text style={styles.discoveryText}>
          Explore more genres, search for new titles, and keep your watchlist up to date.
        </Text>
        <TouchableOpacity style={styles.discoveryButton} onPress={() => navigation.navigate('Explore')}>
          <Text style={styles.discoveryButtonText}>Open Explore</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#242424',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  statText: {
    color: '#999',
    marginTop: 4,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 10,
  },
  horizontalList: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  movieCard: {
    marginRight: 15,
    width: 120,
  },
  moviePoster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  movieTitle: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    maxWidth: 120,
  },
  discoveryCard: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#2a1a1a',
    borderColor: '#4a1f1f',
    borderWidth: 1,
    padding: 14,
  },
  discoveryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  discoveryText: {
    color: '#cfcfcf',
    marginTop: 6,
    lineHeight: 20,
  },
  discoveryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#dc2626',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  discoveryButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 28,
  },
});
