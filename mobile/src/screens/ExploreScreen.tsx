import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Actor, Movie } from '../types';
import { moviesAPI } from '../services/api';
import { getPosterFallbackUrl, resolvePosterUrl } from '../utils/media';

const FALLBACK_ACTOR = 'https://placehold.co/200x300/1f2937/e5e7eb?text=Actor';

export function ExploreScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [actorResults, setActorResults] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(false);
  const posterFallback = getPosterFallbackUrl();

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (!query.trim()) {
      setResults([]);
      setActorResults([]);
      return;
    }

    try {
      setLoading(true);
      const [movieResponse, actorResponse] = await Promise.all([
        moviesAPI.search(query),
        moviesAPI.searchActors(query),
      ]);
      setResults(movieResponse.data);
      setActorResults(actorResponse.data);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroEyebrow}>Explore</Text>
        <Text style={styles.heroTitle}>Find your next watch</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search movies, series or actors..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={handleSearch}
      />

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#dc2626" />
        </View>
      ) : results.length === 0 && actorResults.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>
            {search ? 'No titles or actors found' : 'Search for movies, series or actors'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.resultsListContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeaderWrap}>
              {actorResults.length > 0 && (
                <View style={styles.actorSection}>
                  <Text style={styles.sectionTitle}>Actors</Text>
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={actorResults}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.actorList}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.actorCard}
                        onPress={() => navigation.navigate('ActorProfile', { actorId: String(item.id) })}
                      >
                        <Image source={{ uri: item.profilePath || FALLBACK_ACTOR }} style={styles.actorImage} />
                        <Text style={styles.actorName} numberOfLines={2}>{item.name}</Text>
                        <Text style={styles.actorMeta} numberOfLines={1}>{item.knownForDepartment || 'Actor'}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
              <Text style={styles.sectionTitle}>Titles</Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.emptyMoviesText}>No title results for this search.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.movieItem}
              onPress={() => navigation.navigate('MovieDetail', { movie: item })}
            >
              <Image
                source={{ uri: resolvePosterUrl(item.poster) || posterFallback }}
                style={styles.moviePoster}
              />
              <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.movieYear}>
                {new Date(item.releaseDate).getFullYear()} • {item.type === 'series' ? 'Series' : 'Film'}
              </Text>
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
    padding: 14,
  },
  heroHeader: {
    marginBottom: 10,
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
    padding: 13,
    borderRadius: 14,
    marginBottom: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 15,
  },
  resultsListContent: {
    paddingBottom: 16,
  },
  listHeaderWrap: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  actorSection: {
    marginBottom: 16,
  },
  actorList: {
    paddingBottom: 6,
  },
  actorCard: {
    width: 132,
    marginRight: 12,
    backgroundColor: '#131722',
    borderColor: '#283042',
    borderWidth: 1,
    borderRadius: 14,
    padding: 9,
  },
  actorImage: {
    width: '100%',
    height: 165,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
  },
  actorName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  actorMeta: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 3,
  },
  emptyMoviesText: {
    color: '#8f94a3',
    fontSize: 13,
    marginBottom: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  movieItem: {
    width: '48%',
  },
  moviePoster: {
    width: '100%',
    height: 206,
    borderRadius: 12,
    backgroundColor: '#1f2532',
  },
  movieTitle: {
    color: '#fff',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '700',
  },
  movieYear: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 4,
  },
});
