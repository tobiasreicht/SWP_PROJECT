import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Movie, Rating } from '../types';
import { watchlistAPI, ratingsAPI } from '../services/api';

export function MovieDetailScreen({ route }: any) {
  const { movie } = route.params as { movie: Movie };
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const handleAddToWatchlist = async () => {
    try {
      setLoading(true);
      await watchlistAPI.add({ movieId: movie.id });
      Alert.alert('Success', 'Added to watchlist');
    } catch (error) {
      Alert.alert('Error', 'Failed to add to watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRateMovie = async () => {
    if (rating === null) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    try {
      setLoading(true);
      await ratingsAPI.create({
        movieId: movie.id,
        rating,
        review: review || undefined,
      });
      Alert.alert('Success', 'Movie rated');
      setRating(null);
      setReview('');
      setShowReviewForm(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to rate movie');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: movie.backdrop }} style={styles.backdrop} />

      <View style={styles.content}>
        <Image source={{ uri: movie.poster }} style={styles.poster} />

        <Text style={styles.title}>{movie.title}</Text>
        <Text style={styles.releaseDate}>
          {new Date(movie.releaseDate).getFullYear()} • {movie.type}
        </Text>

        <Text style={styles.description}>{movie.description}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Rating</Text>
            <Text style={styles.infoValue}>{movie.rating.toFixed(1)}/10</Text>
          </View>
          {movie.runtime && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Runtime</Text>
              <Text style={styles.infoValue}>{movie.runtime} min</Text>
            </View>
          )}
          {movie.director && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Director</Text>
              <Text style={styles.infoValue}>{movie.director}</Text>
            </View>
          )}
        </View>

        {movie.genres.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Genres</Text>
            <View style={styles.genreList}>
              {movie.genres.map((genre) => (
                <View key={genre} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {movie.cast.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Cast</Text>
            <Text style={styles.castText}>{movie.cast.join(', ')}</Text>
          </>
        )}

        {movie.streamingPlatforms.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Available On</Text>
            <View style={styles.platformList}>
              {movie.streamingPlatforms.map((platform) => (
                <TouchableOpacity key={platform.platform} style={styles.platformTag}>
                  <Text style={styles.platformText}>{platform.platform}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAddToWatchlist}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Add to Watchlist</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => setShowReviewForm(!showReviewForm)}
          >
            <Text style={styles.buttonText}>Rate Movie</Text>
          </TouchableOpacity>
        </View>

        {showReviewForm && (
          <View style={styles.reviewForm}>
            <Text style={styles.formTitle}>Rate this movie</Text>

            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                <TouchableOpacity
                  key={star}
                  style={[styles.star, rating !== null && rating >= star ? styles.starActive : null]}
                  onPress={() => setRating(star)}
                >
                  <Text style={styles.starText}>★</Text>
                </TouchableOpacity>
              ))}
            </View>

            {rating && <Text style={styles.selectedRating}>You rated: {rating}/10</Text>}

            <TextInput
              style={styles.reviewInput}
              placeholder="Write a review (optional)..."
              placeholderTextColor="#666"
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleRateMovie}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Submit Rating</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  backdrop: {
    width: '100%',
    height: 250,
  },
  content: {
    paddingHorizontal: 15,
    paddingBottom: 30,
    marginTop: -60,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#2a2a2a',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  releaseDate: {
    color: '#999',
    fontSize: 14,
    marginTop: 5,
  },
  description: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
    paddingVertical: 15,
    borderTopColor: '#2a2a2a',
    borderTopWidth: 1,
    borderBottomColor: '#2a2a2a',
    borderBottomWidth: 1,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    color: '#999',
    fontSize: 12,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  genreList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  genreText: {
    color: '#fff',
    fontSize: 12,
  },
  castText: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 18,
  },
  platformList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformTag: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  platformText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    gap: 10,
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#dc2626',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    borderWidth: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  reviewForm: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  formTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  star: {
    padding: 8,
  },
  starActive: {
    opacity: 1,
  },
  starText: {
    fontSize: 24,
    color: '#999',
  },
  selectedRating: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  reviewInput: {
    backgroundColor: '#1a1a1a',
    borderColor: '#444',
    borderWidth: 1,
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
