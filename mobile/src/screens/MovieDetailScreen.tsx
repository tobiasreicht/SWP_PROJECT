import React, { useEffect, useState } from 'react';
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
  FlatList,
  Modal,
  Share,
} from 'react-native';
import { Actor, Movie, Rating } from '../types';
import { friendsAPI, messagesAPI, moviesAPI, watchlistAPI, ratingsAPI } from '../services/api';

const FALLBACK_ACTOR = 'https://placehold.co/200x300/1f2937/e5e7eb?text=Actor';

export function MovieDetailScreen({ route, navigation }: any) {
  const { movie } = route.params as { movie: Movie };
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [castActors, setCastActors] = useState<Actor[]>([]);
  const [loadingCast, setLoadingCast] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [friends, setFriends] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sharingToFriendId, setSharingToFriendId] = useState<string | null>(null);

  useEffect(() => {
    loadCast();
  }, [movie.id]);

  const loadCast = async () => {
    try {
      setLoadingCast(true);
      const targetId = String(movie.tmdbId || movie.id);
      const response = await moviesAPI.getCast(targetId, 20);
      setCastActors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load cast:', error);
      setCastActors([]);
    } finally {
      setLoadingCast(false);
    }
  };

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

  const getSharePayload = () => {
    const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '';
    const tmdbId = movie.tmdbId || Number(movie.id);
    const tmdbUrl = Number.isFinite(tmdbId)
      ? `https://www.themoviedb.org/movie/${tmdbId}`
      : '';

    const message = [
      `Check this movie: ${movie.title}${year ? ` (${year})` : ''}`,
      `Rating: ${movie.rating.toFixed(1)}/10`,
      movie.description,
      tmdbUrl,
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      message,
      tmdbId: Number.isFinite(tmdbId) ? tmdbId : undefined,
    };
  };

  const loadFriendsForShare = async () => {
    try {
      setLoadingFriends(true);
      const response = await friendsAPI.getAll();
      const mapped = (Array.isArray(response.data) ? response.data : []).map((entry: any) => ({
        id: String(entry.id),
        name: String(entry.name || entry.username || 'Friend'),
      }));
      setFriends(mapped);
    } catch (error) {
      console.error('Failed to load friends for share:', error);
      Alert.alert('Error', 'Could not load friends.');
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleOpenShare = async () => {
    setShareModalOpen(true);
    await loadFriendsForShare();
  };

  const handleShareToFriend = async (friendId: string) => {
    try {
      setSharingToFriendId(friendId);
      const payload = getSharePayload();
      await messagesAPI.send(friendId, {
        text: `I think you'll like this one!`,
        movieTmdbId: payload.tmdbId,
        movieTitle: movie.title,
        moviePoster: movie.poster,
      });
      setShareModalOpen(false);
      Alert.alert('Shared', 'Movie shared in chat.');
    } catch (error) {
      console.error('Failed to share movie in chat:', error);
      Alert.alert('Error', 'Failed to share movie in chat.');
    } finally {
      setSharingToFriendId(null);
    }
  };

  const handleNativeShare = async () => {
    try {
      const payload = getSharePayload();
      await Share.share({
        message: payload.message,
      });
    } catch (error) {
      console.error('Native share failed:', error);
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

        {(loadingCast || castActors.length > 0 || movie.cast.length > 0) && (
          <>
            <Text style={styles.sectionTitle}>Cast</Text>
            {loadingCast ? (
              <ActivityIndicator size="small" color="#dc2626" style={{ marginBottom: 8 }} />
            ) : castActors.length > 0 ? (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={castActors}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.castList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.castCard}
                    onPress={() => navigation.navigate('ActorProfile', { actorId: String(item.id) })}
                  >
                    <Image source={{ uri: item.profilePath || FALLBACK_ACTOR }} style={styles.castImage} />
                    <View style={styles.castOverlay}>
                      <Text style={styles.castName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.castRole} numberOfLines={1}>{item.character || item.knownForDepartment || 'Actor'}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <Text style={styles.castText}>{movie.cast.join(', ')}</Text>
            )}
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

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleOpenShare}
          >
            <Text style={styles.buttonText}>Share Movie</Text>
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

      <Modal
        visible={shareModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.shareSheet}>
            <Text style={styles.shareTitle}>Share {movie.title}</Text>

            {loadingFriends ? (
              <View style={styles.shareLoadingWrap}>
                <ActivityIndicator size="small" color="#dc2626" />
              </View>
            ) : friends.length === 0 ? (
              <Text style={styles.shareEmptyText}>No friends available to share in chat.</Text>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={(item) => item.id}
                style={styles.shareFriendList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.shareFriendRow}
                    onPress={() => handleShareToFriend(item.id)}
                    disabled={sharingToFriendId === item.id}
                  >
                    <View style={styles.shareFriendAvatar}>
                      <Text style={styles.shareFriendAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.shareFriendName}>{item.name}</Text>
                    <Text style={styles.shareFriendAction}>
                      {sharingToFriendId === item.id ? 'Sending...' : 'Send'}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}

            <View style={styles.shareButtonsRow}>
              <TouchableOpacity style={styles.shareOutlineButton} onPress={handleNativeShare}>
                <Text style={styles.shareOutlineButtonText}>Share Externally</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareCloseButton} onPress={() => setShareModalOpen(false)}>
                <Text style={styles.shareCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  castList: {
    paddingBottom: 8,
  },
  castCard: {
    width: 132,
    marginRight: 10,
    backgroundColor: '#161616',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  castImage: {
    width: '100%',
    height: 190,
    backgroundColor: '#2a2a2a',
  },
  castOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  castName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  castRole: {
    color: '#d0d0d0',
    marginTop: 3,
    fontSize: 11,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  shareSheet: {
    backgroundColor: '#181818',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    maxHeight: '70%',
    borderTopColor: '#2b2b2b',
    borderTopWidth: 1,
  },
  shareTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  shareLoadingWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  shareEmptyText: {
    color: '#a3a3a3',
    fontSize: 13,
    paddingVertical: 12,
  },
  shareFriendList: {
    maxHeight: 280,
  },
  shareFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: '#2a2a2a',
    borderBottomWidth: 1,
  },
  shareFriendAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  shareFriendAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  shareFriendName: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  shareFriendAction: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
  shareButtonsRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  shareOutlineButton: {
    flex: 1,
    borderColor: '#454545',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#242424',
  },
  shareOutlineButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  shareCloseButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#dc2626',
  },
  shareCloseButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
