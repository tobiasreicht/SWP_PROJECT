import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { moviesAPI, recommendationsAPI, watchlistAPI } from '@/src/services/api';
import { Movie } from '@/src/types';

const FALLBACK_POSTER = 'https://placehold.co/300x450/1f2937/e5e7eb?text=No+Poster';
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

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const palette = Colors[colorScheme ?? 'light'];

  const [trending, setTrending] = useState<Movie[]>([]);
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [upcomingThisYear, setUpcomingThisYear] = useState<Movie[]>([]);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadHomeData = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      setLoadError(null);
      const [trendingRes, newRes, allPage1Res, allPage2Res, recRes, watchlistRes] = await Promise.all([
        moviesAPI.getTrending(),
        moviesAPI.getNewReleases(),
        moviesAPI.getAll(1, 20),
        moviesAPI.getAll(2, 20),
        recommendationsAPI.getPersonal(12),
        watchlistAPI.getCount(),
      ]);

      const trendingData = Array.isArray(trendingRes.data) ? trendingRes.data : [];
      const newData = Array.isArray(newRes.data) ? newRes.data : [];
      const page1Data = Array.isArray(allPage1Res.data) ? allPage1Res.data : [];
      const page2Data = Array.isArray(allPage2Res.data) ? allPage2Res.data : [];
      const releaseCandidates = uniqueMovies([...newData, ...page1Data, ...page2Data, ...trendingData]);
      const { released, upcomingThisYear: upcoming } = splitReleaseBuckets(releaseCandidates);
      const recommendationData = Array.isArray(recRes.data) ? recRes.data : [];
      const countValue =
        (watchlistRes.data?.count as number | undefined) ??
        (watchlistRes.data?.total as number | undefined) ??
        0;

      setTrending(trendingData);
      setNewReleases(released);
      setUpcomingThisYear(upcoming);
      setRecommended(recommendationData.map((entry: { movie?: Movie }) => entry.movie).filter(Boolean) as Movie[]);
      setWatchlistCount(countValue);
    } catch (error) {
      setLoadError('Konnte Home-Daten nicht laden. Bitte spaeter erneut versuchen.');
      console.error('Failed to load home screen data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadHomeData();
  }, [loadHomeData]);

  const topGenres = useMemo(() => {
    const merged = [...trending, ...newReleases, ...upcomingThisYear];
    const genreCounts = new Map<string, number>();
    merged.forEach((movie) => {
      movie.genres?.forEach((genre) => {
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
      });
    });

    return [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([genre]) => genre);
  }, [newReleases, trending, upcomingThisYear]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadHomeData(true);
  };

  const renderMovieCard = ({ item, dateLabel }: { item: Movie; dateLabel?: string }) => (
    <Pressable style={styles.movieCard} onPress={() => router.push('/explore')}>
      <Image source={{ uri: item.poster || FALLBACK_POSTER }} style={styles.moviePoster} />
      <ThemedText type="defaultSemiBold" numberOfLines={2} style={styles.movieTitle}>
        {item.title}
      </ThemedText>
      <ThemedText style={styles.movieMeta}>★ {item.rating?.toFixed?.(1) ?? '0.0'}</ThemedText>
      {dateLabel ? <ThemedText style={styles.movieDateMeta}>{dateLabel} {formatReleaseDate(item.releaseDate)}</ThemedText> : null}
    </Pressable>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#fee2e2', dark: '#1f2937' }}
      headerImage={
        <View style={styles.headerHero}>
          <View style={styles.heroLogoWrap}>
            <Image source={require('@/assets/images/watch-togther-logo.png')} style={styles.heroLogo} contentFit="contain" />
          </View>
          <ThemedText style={styles.heroSubtitle}>Entdecke Filme smarter, gemeinsam und ohne Ablenkung.</ThemedText>
          <Pressable style={styles.heroButton} onPress={() => router.push('/explore')}>
            <ThemedText type="defaultSemiBold" style={styles.heroButtonLabel}>
              Jetzt entdecken
            </ThemedText>
          </Pressable>
        </View>
      }>
      {loading ? (
        <ThemedView style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={palette.tint} />
          <ThemedText style={styles.loadingText}>Inhalte werden geladen ...</ThemedText>
        </ThemedView>
      ) : (
        <View>
          <ThemedView style={styles.statsRow}>
            <ThemedView style={styles.statCard}>
              <ThemedText type="subtitle">{watchlistCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Watchlist</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText type="subtitle">{trending.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Trending</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText type="subtitle">{recommended.length}</ThemedText>
              <ThemedText style={styles.statLabel}>Fuer dich</ThemedText>
            </ThemedView>
          </ThemedView>

          {loadError ? <ThemedText style={styles.errorText}>{loadError}</ThemedText> : null}

          <SectionHeader title="Trending Now" cta="Alles" onPress={() => router.push('/explore')} />
          <FlatList
            horizontal
            data={trending.slice(0, 15)}
            keyExtractor={(item) => item.id}
            renderItem={renderMovieCard}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />

          <SectionHeader title="New Releases (Last 60 Days)" cta="Mehr" onPress={() => router.push('/explore')} />
          <FlatList
            horizontal
            data={newReleases.slice(0, 15)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderMovieCard({ item, dateLabel: 'Released' })}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
          {newReleases.length === 0 ? <ThemedText style={styles.emptySectionText}>No recent releases right now.</ThemedText> : null}

          <SectionHeader title="Upcoming This Year" cta="Mehr" onPress={() => router.push('/explore')} />
          <FlatList
            horizontal
            data={upcomingThisYear.slice(0, 15)}
            keyExtractor={(item) => `${item.id}-upcoming`}
            renderItem={({ item }) => renderMovieCard({ item, dateLabel: 'Comes on' })}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
          {upcomingThisYear.length === 0 ? <ThemedText style={styles.emptySectionText}>No upcoming titles for this year yet.</ThemedText> : null}

          <SectionHeader title="Empfohlen fuer dich" cta="Mehr" onPress={() => router.push('/explore')} />
          <FlatList
            horizontal
            data={recommended.slice(0, 15)}
            keyExtractor={(item) => item.id}
            renderItem={renderMovieCard}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />

          <ThemedView style={styles.genreWrap}>
            <ThemedText type="subtitle">Beliebte Genres</ThemedText>
            <View style={styles.genreList}>
              {topGenres.map((genre) => (
                <Pressable key={genre} style={styles.genreChip} onPress={() => router.push('/explore')}>
                  <ThemedText style={styles.genreText}>{genre}</ThemedText>
                </Pressable>
              ))}
            </View>
          </ThemedView>

          <ThemedView style={styles.discoverCard}>
            <ThemedText type="subtitle">Weiter schauen</ThemedText>
            <ThemedText style={styles.discoverText}>
              In Explore findest du die volle Suche, Filter und deinen persoenlichen Discovery-Flow.
            </ThemedText>
            <Pressable style={styles.discoverButton} onPress={() => router.push('/explore')}>
              <ThemedText type="defaultSemiBold">Explore oeffnen</ThemedText>
            </Pressable>
          </ThemedView>

          <View style={styles.bottomSpacer} />
        </View>
      )}
    </ParallaxScrollView>
  );
}

function SectionHeader({
  title,
  cta,
  onPress,
}: {
  title: string;
  cta: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <Pressable onPress={onPress}>
        <ThemedText style={styles.sectionLink}>{cta}</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerHero: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(17, 24, 39, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroLogoWrap: {
    width: 208,
    height: 108,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroLogo: {
    width: 188,
    height: 90,
  },
  heroSubtitle: {
    color: '#e5e7eb',
    marginBottom: 14,
    fontSize: 13,
  },
  heroButton: {
    backgroundColor: '#ef4444',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroButtonLabel: {
    color: '#fff',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  loadingText: {
    opacity: 0.75,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'rgba(127, 127, 127, 0.12)',
  },
  statLabel: {
    opacity: 0.7,
    marginTop: 4,
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 8,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLink: {
    color: '#ef4444',
    fontWeight: '700',
  },
  horizontalList: {
    paddingBottom: 6,
    paddingRight: 8,
  },
  movieCard: {
    width: 132,
    marginRight: 12,
  },
  moviePoster: {
    width: 132,
    height: 198,
    borderRadius: 10,
    backgroundColor: 'rgba(127,127,127,0.2)',
  },
  movieTitle: {
    marginTop: 8,
    fontSize: 13,
  },
  movieMeta: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.8,
  },
  movieDateMeta: {
    marginTop: 2,
    fontSize: 11,
    opacity: 0.72,
  },
  emptySectionText: {
    marginTop: -2,
    marginBottom: 10,
    opacity: 0.68,
    fontSize: 12,
  },
  genreWrap: {
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    backgroundColor: 'rgba(127, 127, 127, 0.12)',
  },
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  genreChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(127, 127, 127, 0.35)',
  },
  genreText: {
    fontSize: 12,
  },
  discoverCard: {
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
  },
  discoverText: {
    marginTop: 8,
    opacity: 0.85,
  },
  discoverButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  bottomSpacer: {
    height: 32,
  },
});
