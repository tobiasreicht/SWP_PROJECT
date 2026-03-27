import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native';
import { Movie } from '../types';
import { moviesAPI } from '../services/api';

export function HomeScreen({ navigation }: any) {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [newReleases, setNewReleases] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trendingRes, newRes] = await Promise.all([
        moviesAPI.getTrending(),
        moviesAPI.getNewReleases(),
      ]);
      setTrending(trendingRes.data);
      setNewReleases(newRes.data);
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
});
