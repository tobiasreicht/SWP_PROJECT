import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Actor, Movie } from '../types';
import { moviesAPI } from '../services/api';

const FALLBACK_ACTOR = 'https://placehold.co/200x300/1f2937/e5e7eb?text=Actor';

export function ExploreScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [actorResults, setActorResults] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(false);

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
      <TextInput
        style={styles.searchInput}
        placeholder="Search movies or actors..."
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
            {search ? 'No movies or actors found' : 'Search for movies or actors'}
          </Text>
        </View>
      ) : (
        <View style={styles.resultsWrap}>
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

          {results.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Movies</Text>
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.movieItem}
                    onPress={() => navigation.navigate('MovieDetail', { movie: item })}
                  >
                    <Image
                      source={{ uri: item.poster }}
                      style={styles.moviePoster}
                    />
                    <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.movieYear}>
                      {new Date(item.releaseDate).getFullYear()}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 15,
  },
  searchInput: {
    backgroundColor: '#202020',
    borderColor: '#3b3b3b',
    borderWidth: 1,
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  resultsWrap: {
    flex: 1,
    paddingBottom: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
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
    width: 122,
    marginRight: 12,
    backgroundColor: '#1f1f1f',
    borderColor: '#2f2f2f',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  actorImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  actorName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  actorMeta: {
    color: '#a3a3a3',
    fontSize: 11,
    marginTop: 3,
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
    height: 200,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
  },
  movieTitle: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  movieYear: {
    color: '#999',
    fontSize: 11,
    marginTop: 4,
  },
});
