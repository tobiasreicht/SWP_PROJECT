import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Movie } from '../types';
import { moviesAPI, recommendationsAPI } from '../services/api';
import { getPosterFallbackUrl, resolveBackdropUrl, resolvePosterUrl } from '../utils/media';

const RECENT_RELEASE_WINDOW_DAYS = 60;

type HomeRow = {
  key: string;
  title: string;
  subtitle: string;
  data: Movie[];
};

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

const uniqueMovies = (movies: Movie[]): Movie[] => {
  const seen = new Set<string>();
  return movies.filter((movie) => {
    const key = `${movie.id}-${movie.tmdbId || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
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

const getBadgeText = (movie: Movie): string => {
  if (movie.type === 'series') {
    return movie.seasonCount ? `${movie.seasonCount} seasons` : 'Series';
  }
  return 'Movie';
};

const mapResponseMovies = (value: any): Movie[] => (Array.isArray(value) ? value : []);

export function HomeScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<HomeRow[]>([]);
  const [featured, setFeatured] = useState<Movie | null>(null);
  const posterFallback = getPosterFallbackUrl();

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trendingRes, newRes, page1Res, page2Res, page3Res, recRes] = await Promise.all([
        moviesAPI.getTrending(),
        moviesAPI.getNewReleases(),
        moviesAPI.getAll(1, 20),
        moviesAPI.getAll(2, 20),
        moviesAPI.getAll(3, 20),
        recommendationsAPI.getPersonal(16),
      ]);

      const trending = mapResponseMovies(trendingRes.data);
      const incomingReleases = mapResponseMovies(newRes.data);
      const page1 = mapResponseMovies(page1Res.data);
      const page2 = mapResponseMovies(page2Res.data);
      const page3 = mapResponseMovies(page3Res.data);
      const recommended = Array.isArray(recRes.data)
        ? recRes.data
            .map((entry: { movie?: Movie }) => entry.movie)
            .filter((movie): movie is Movie => Boolean(movie))
        : [];

      const releaseCandidates = uniqueMovies([
        ...incomingReleases,
        ...page1,
        ...page2,
        ...trending,
      ]);
      const { released, upcomingThisYear } = splitReleaseBuckets(releaseCandidates);

      const featuredCandidate =
        trending.find((item) => item.backdrop || item.poster) ||
        recommended.find((item) => item.backdrop || item.poster) ||
        released.find((item) => item.backdrop || item.poster) ||
        null;
      setFeatured(featuredCandidate);

      const primaryPool = uniqueMovies([...trending, ...page1, ...incomingReleases]);
      const hiddenGems = uniqueMovies(page2).filter(
        (movie) => !primaryPool.some((primary) => primary.id === movie.id && primary.tmdbId === movie.tmdbId)
      );

      const nextRows: HomeRow[] = [
        {
          key: 'trending',
          title: 'Trending Now',
          subtitle: 'Most watched right now',
          data: trending.slice(0, 18),
        },
        {
          key: 'fresh',
          title: 'Fresh Releases',
          subtitle: 'Released in the last 60 days',
          data: released.slice(0, 18),
        },
        {
          key: 'upcoming',
          title: 'Coming This Year',
          subtitle: 'Upcoming movies and series',
          data: upcomingThisYear.slice(0, 18),
        },
        {
          key: 'recommended',
          title: 'For Your Taste',
          subtitle: 'Built from your ratings',
          data: recommended.slice(0, 18),
        },
        {
          key: 'popular',
          title: 'Popular Picks',
          subtitle: 'Strong all-round choices',
          data: uniqueMovies(page1).slice(0, 18),
        },
        {
          key: 'gems',
          title: 'Hidden Gems',
          subtitle: 'Less obvious picks worth trying',
          data: hiddenGems.slice(0, 18),
        },
        {
          key: 'deepcuts',
          title: 'Deep Cuts',
          subtitle: 'More from the full catalog',
          data: uniqueMovies(page3).slice(0, 18),
        },
      ].filter((row) => row.data.length > 0);

      setRows(nextRows);
    } catch (error) {
      console.error('Failed to load home data:', error);
      setRows([]);
      setFeatured(null);
    } finally {
      setLoading(false);
    }
  };

  const spotlight = useMemo(() => {
    if (!rows.length) return [];
    return uniqueMovies(rows.flatMap((row) => row.data)).slice(0, 4);
  }, [rows]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topGradient} />

      {featured ? (
        <TouchableOpacity
          style={styles.heroWrap}
          activeOpacity={0.92}
          onPress={() => navigation.navigate('MovieDetail', { movie: featured })}
        >
          <Image
            source={{ uri: resolveBackdropUrl(featured.backdrop, featured.poster) || posterFallback }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>Home</Text>
              </View>
              <View style={styles.heroRatingBadge}>
                <Text style={styles.heroRatingText}>{featured.rating.toFixed(1)}/10</Text>
              </View>
            </View>

            <Text style={styles.heroTitle} numberOfLines={2}>{featured.title}</Text>
            <Text style={styles.heroMeta} numberOfLines={1}>
              {getBadgeText(featured)}
              {featured.releaseDate ? ` • ${new Date(featured.releaseDate).getFullYear()}` : ''}
            </Text>
            <Text style={styles.heroDescription} numberOfLines={3}>{featured.description}</Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {spotlight.length > 0 ? (
        <View style={styles.spotlightWrap}>
          <Text style={styles.spotlightTitle}>Tonight's Spotlight</Text>
          <View style={styles.spotlightGrid}>
            {spotlight.map((movie) => (
              <TouchableOpacity
                key={`spotlight-${movie.id}-${movie.tmdbId || ''}`}
                style={styles.spotlightCard}
                onPress={() => navigation.navigate('MovieDetail', { movie })}
              >
                <Image source={{ uri: resolvePosterUrl(movie.poster) || posterFallback }} style={styles.spotlightPoster} />
                <Text style={styles.spotlightMovieTitle} numberOfLines={1}>{movie.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {rows.map((row) => (
        <View key={row.key} style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{row.title}</Text>
            <Text style={styles.sectionSubtitle}>{row.subtitle}</Text>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={row.data}
            keyExtractor={(item) => `${row.key}-${item.id}-${item.tmdbId || ''}`}
            contentContainerStyle={styles.rowListContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('MovieDetail', { movie: item })}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: resolvePosterUrl(item.poster) || posterFallback }}
                  style={styles.cardPoster}
                />
                <View style={styles.cardTopBadge}>
                  <Text style={styles.cardTopBadgeText}>{item.type === 'series' ? 'Series' : 'Movie'}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardMeta} numberOfLines={1}>{getBadgeText(item)}</Text>
                <Text style={styles.cardMeta} numberOfLines={1}>{formatReleaseDate(item.releaseDate)}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ))}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0f14',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d0f14',
  },
  topGradient: {
    height: 10,
    backgroundColor: '#18121a',
  },
  heroWrap: {
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#171a22',
    borderColor: '#2b3040',
    borderWidth: 1,
  },
  heroImage: {
    width: '100%',
    height: 310,
    backgroundColor: '#232735',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'rgba(8, 10, 16, 0.52)',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heroBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  heroRatingBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroRatingText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    maxWidth: '92%',
  },
  heroMeta: {
    color: '#e4e4e7',
    fontSize: 13,
    marginTop: 7,
  },
  heroDescription: {
    color: '#f4f4f5',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: '96%',
  },
  spotlightWrap: {
    marginTop: 18,
    paddingHorizontal: 14,
  },
  spotlightTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  spotlightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  spotlightCard: {
    width: '48%',
    backgroundColor: '#151923',
    borderColor: '#272d3d',
    borderWidth: 1,
    borderRadius: 14,
    padding: 8,
  },
  spotlightPoster: {
    width: '100%',
    height: 132,
    borderRadius: 10,
    backgroundColor: '#232735',
  },
  spotlightMovieTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 7,
  },
  sectionWrap: {
    marginTop: 18,
  },
  sectionHeader: {
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  rowListContent: {
    paddingHorizontal: 14,
  },
  card: {
    width: 146,
    marginRight: 12,
  },
  cardPoster: {
    width: 146,
    height: 218,
    borderRadius: 14,
    backgroundColor: '#232735',
  },
  cardTopBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    backgroundColor: 'rgba(10, 12, 18, 0.86)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardTopBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  cardMeta: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 3,
  },
  bottomSpacer: {
    height: 24,
  },
});