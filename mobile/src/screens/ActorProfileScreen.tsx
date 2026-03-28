import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { moviesAPI } from '../services/api';
import { ActorProfile, Movie } from '../types';

const FALLBACK_ACTOR = 'https://placehold.co/300x450/1f2937/e5e7eb?text=Actor';

export function ActorProfileScreen({ route, navigation }: any) {
  const { actorId } = route.params as { actorId: string | number };

  const [profile, setProfile] = useState<ActorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMovieId, setLoadingMovieId] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [actorId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await moviesAPI.getActorProfile(String(actorId));
      setProfile(response.data as ActorProfile);
    } catch (error) {
      console.error('Failed to load actor profile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const openMovie = async (movie: Movie) => {
    const targetId = String(movie.tmdbId || movie.id);
    try {
      setLoadingMovieId(targetId);
      const response = await moviesAPI.getById(targetId);
      navigation.navigate('MovieDetail', { movie: response.data });
    } catch {
      navigation.navigate('MovieDetail', { movie });
    } finally {
      setLoadingMovieId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Actor profile could not be loaded.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Image source={{ uri: profile.profilePath || FALLBACK_ACTOR }} style={styles.heroImage} />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroName}>{profile.name}</Text>
          <Text style={styles.heroSubline}>{profile.knownForDepartment || 'Actor'}</Text>
        </View>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statChip}>
          <Text style={styles.statLabel}>Movies</Text>
          <Text style={styles.statValue}>{profile.movies.length}</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statLabel}>Born</Text>
          <Text style={styles.statValue}>{profile.birthday || 'Unknown'}</Text>
        </View>
      </View>

      {!!profile.placeOfBirth && <Text style={styles.metaText}>From: {profile.placeOfBirth}</Text>}

      <View style={styles.bioCard}>
        <View style={styles.bioHeader}>
          <Text style={styles.sectionTitle}>Biography</Text>
          <TouchableOpacity style={styles.expandButton} onPress={() => setBioExpanded((value) => !value)}>
            <Text style={styles.expandButtonText}>{bioExpanded ? 'Show less' : 'Show more'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bioText} numberOfLines={bioExpanded ? undefined : 6}>
          {profile.biography || 'No biography available.'}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Top Credits</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.movieList}>
        {profile.movies.slice(0, 12).map((item) => {
          const id = String(item.tmdbId || item.id);
          const isLoadingMovie = loadingMovieId === id;

          return (
            <TouchableOpacity key={`top-${id}`} style={styles.movieCard} onPress={() => openMovie(item)} disabled={isLoadingMovie}>
              <Image source={{ uri: item.poster }} style={styles.moviePoster} />
              <View style={styles.movieOverlay}>
                <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.movieYear}>{new Date(item.releaseDate).getFullYear() || 'N/A'}</Text>
              </View>
              {isLoadingMovie ? <ActivityIndicator size="small" color="#dc2626" style={styles.loadingMovie} /> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionTitle}>Filmography</Text>
      <View style={styles.gridWrap}>
        {profile.movies.map((item) => {
          const id = String(item.tmdbId || item.id);
          const isLoadingMovie = loadingMovieId === id;

          return (
            <TouchableOpacity key={`grid-${id}`} style={styles.gridCard} onPress={() => openMovie(item)} disabled={isLoadingMovie}>
              <Image source={{ uri: item.poster }} style={styles.gridPoster} />
              <Text style={styles.gridTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.gridYear}>{new Date(item.releaseDate).getFullYear() || 'N/A'}</Text>
              {isLoadingMovie ? <ActivityIndicator size="small" color="#dc2626" style={styles.loadingMovie} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#141414',
  },
  errorText: {
    color: '#f87171',
    fontSize: 15,
  },
  heroCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderColor: '#2f2f2f',
    borderWidth: 1,
    marginBottom: 14,
  },
  heroImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#2a2a2a',
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  heroName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  heroSubline: {
    color: '#d4d4d4',
    fontSize: 14,
    marginTop: 3,
  },
  statRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#1f1f1f',
    borderColor: '#2f2f2f',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  statLabel: {
    color: '#9f9f9f',
    fontSize: 11,
  },
  statValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  metaText: {
    color: '#c4c4c4',
    fontSize: 13,
    marginBottom: 10,
  },
  bioCard: {
    backgroundColor: '#1f1f1f',
    borderColor: '#2f2f2f',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expandButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#3a3a3a',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  expandButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  bioText: {
    color: '#d4d4d4',
    lineHeight: 20,
    fontSize: 14,
  },
  movieList: {
    paddingBottom: 10,
  },
  movieCard: {
    width: 132,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderColor: '#2f2f2f',
    borderWidth: 1,
    backgroundColor: '#151515',
  },
  moviePoster: {
    width: 132,
    height: 190,
    backgroundColor: '#2a2a2a',
  },
  movieOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  movieYear: {
    color: '#d4d4d4',
    fontSize: 11,
    marginTop: 2,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
    paddingBottom: 8,
  },
  gridCard: {
    width: '48.5%',
  },
  gridPoster: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
    borderColor: '#2f2f2f',
    borderWidth: 1,
  },
  gridTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  gridYear: {
    color: '#9f9f9f',
    fontSize: 11,
    marginTop: 3,
  },
  loadingMovie: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
