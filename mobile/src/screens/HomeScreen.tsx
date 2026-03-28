import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native';
import { Movie } from '../types';
import { moviesAPI, recommendationsAPI, watchlistAPI } from '../services/api';

const RECENT_RELEASE_WINDOW_DAYS = 60;

const parseMovieDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatReleaseDate = (value: Date | string | null | undefined): string => {
  const date = parseMovieDate(value);
  if (!date) return 'TBA';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const splitReleaseBuckets = (movies: Movie[]) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const recentCutoff = new Date(now);
  recentCutoff.setDate(recentCutoff.getDate() - RECENT_RELEASE_WINDOW_DAYS);

  const released = movies
    .filter((movie) => {
      const releaseDate = parseMovieDate(movie.releaseDate);
      if (!releaseDate) return false;
      return releaseDate <= now && releaseDate >= recentCutoff;
    })
    .sort((a, b) => {
      const aTime = parseMovieDate(a.releaseDate)?.getTime() ?? 0;
      const bTime = parseMovieDate(b.releaseDate)?.getTime() ?? 0;
      return bTime - aTime;
    });

  const upcomingThisYear = movies
    .filter((movie) => {
      const releaseDate = parseMovieDate(movie.releaseDate);
      if (!releaseDate) return false;
      return releaseDate > now && releaseDate.getFullYear() === currentYear;
    })
    .sort((a, b) => {
      const aTime = parseMovieDate(a.releaseDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = parseMovieDate(b.releaseDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });

  return { released, upcomingThisYear };
};

const uniqueMovies = (movies: Movie[]): Movie[] => {
  const seen = new Set<string>();
  return movies.filter((movie) => {
    const key = `${movie.id}-${movie.tmdbId || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function HomeScreen({ navigation }: any) {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [upcomingThisYear, setUpcomingThisYear] = useState<Movie[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trendingRes, newRes, allPage1Res, allPage2Res, recRes, watchlistRes] = await Promise.all([
        moviesAPI.getTrending(),
        moviesAPI.getNewReleases(),
        moviesAPI.getAll(1, 20),
        moviesAPI.getAll(2, 20),
        recommendationsAPI.getPersonal(10),
        watchlistAPI.getCount(),
      ]);
      const trendingMovies = Array.isArray(trendingRes.data) ? trendingRes.data : [];
      const incomingReleases = Array.isArray(newRes.data) ? newRes.data : [];
      const page1Movies = Array.isArray(allPage1Res.data) ? allPage1Res.data : [];
      const page2Movies = Array.isArray(allPage2Res.data) ? allPage2Res.data : [];
      const releaseCandidates = uniqueMovies([
        ...incomingReleases,
        ...page1Movies,
        ...page2Movies,
        ...trendingMovies,
      ]);
      const { released, upcomingThisYear: upcoming } = splitReleaseBuckets(releaseCandidates);
      setTrending(trendingMovies);
      setNewReleases(released);
      setUpcomingThisYear(upcoming);

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

      <Text style={styles.sectionTitle}>New Releases (Last 60 Days)</Text>
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
            <Text style={styles.movieMeta} numberOfLines={1}>Released {formatReleaseDate(item.releaseDate)}</Text>
          </TouchableOpacity>
        )}
        scrollEnabled={true}
        style={styles.horizontalList}
      />
      {newReleases.length === 0 ? <Text style={styles.emptySectionText}>No recent releases right now.</Text> : null}

      <Text style={styles.sectionTitle}>Upcoming This Year</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={upcomingThisYear.slice(0, 10)}
        keyExtractor={(item) => `${item.id}-upcoming`}
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
            <Text style={styles.movieMeta} numberOfLines={1}>Comes on {formatReleaseDate(item.releaseDate)}</Text>
          </TouchableOpacity>
        )}
        scrollEnabled={true}
        style={styles.horizontalList}
      />
      {upcomingThisYear.length === 0 ? <Text style={styles.emptySectionText}>No upcoming titles for this year yet.</Text> : null}

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
  movieMeta: {
    color: '#a3a3a3',
    fontSize: 11,
    marginTop: 4,
    maxWidth: 120,
  },
  emptySectionText: {
    color: '#8a8a8a',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 16,
    paddingHorizontal: 20,
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
