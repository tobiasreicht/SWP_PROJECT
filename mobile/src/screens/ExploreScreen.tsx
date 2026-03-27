import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Movie } from '../types';
import { moviesAPI } from '../services/api';

export function ExploreScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearch(query);
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await moviesAPI.search(query);
      setResults(response.data);
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
        placeholder="Search movies..."
        placeholderTextColor="#666"
        value={search}
        onChangeText={handleSearch}
      />

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#dc2626" />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>
            {search ? 'No movies found' : 'Search for movies'}
          </Text>
        </View>
      ) : (
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
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
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
