import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Share,
  Linking,
} from 'react-native';
import { Actor, Movie, Rating, SeriesEpisode, WatchlistItem } from '../types';
import { friendsAPI, messagesAPI, moviesAPI, ratingsAPI, watchlistAPI } from '../services/api';
import { getPosterFallbackUrl, resolveBackdropUrl, resolvePosterUrl } from '../utils/media';

const FALLBACK_ACTOR = 'https://placehold.co/200x300/1f2937/e5e7eb?text=Actor';

const formatDate = (value?: string | Date | null) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString();
};

const isNavigableActorId = (value: number | string) => Number.isFinite(Number(value));

export function MovieDetailScreen({ route, navigation }: any) {
  const { movie: routeMovie } = route.params as { movie: Movie };
  const [movie, setMovie] = useState<Movie>(routeMovie);
  const [loading, setLoading] = useState(false);
  const [castActors, setCastActors] = useState<Actor[]>([]);
  const [loadingCast, setLoadingCast] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [friends, setFriends] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sharingToFriendId, setSharingToFriendId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [episodesBySeason, setEpisodesBySeason] = useState<Record<number, SeriesEpisode[]>>({});
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const [backdropFailed, setBackdropFailed] = useState(false);

  const targetId = String(movie.tmdbId || movie.id);
  const posterUrl = posterFailed ? getPosterFallbackUrl() : resolvePosterUrl(movie.poster);
  const backdropUrl = backdropFailed ? posterUrl : resolveBackdropUrl(movie.backdrop, movie.poster);

  const matchedWatchlistItem = useMemo(() => {
    const tmdbCandidate = movie.tmdbId || Number(movie.id);
    return watchlistItems.find((item) => {
      if (item.movieId === movie.id) return true;
      if (!Number.isFinite(tmdbCandidate)) return false;
      return item.movie?.tmdbId === tmdbCandidate;
    });
  }, [movie.id, movie.tmdbId, watchlistItems]);

  const userRating = useMemo(() => {
    return ratings.find((entry) => {
      if (entry.movieId === movie.id) return true;
      if (matchedWatchlistItem && entry.movieId === matchedWatchlistItem.movieId) return true;
      if (movie.tmdbId && entry.movieId === String(movie.tmdbId)) return true;
      return false;
    });
  }, [matchedWatchlistItem, movie.id, movie.tmdbId, ratings]);

  const seasons = useMemo(() => (movie.seasons || []).filter((season) => season.seasonNumber > 0), [movie.seasons]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: movie.type === 'series' ? 'Series Details' : 'Movie Details',
    });
  }, [movie.type, navigation]);

  useEffect(() => {
    void Promise.all([loadDetails(), loadCast(), loadUserData()]);
  }, [routeMovie.id]);

  useEffect(() => {
    if (seasons.length === 0) {
      setSelectedSeason(null);
      return;
    }

    setSelectedSeason((current) => {
      if (current && seasons.some((season) => season.seasonNumber === current)) {
        return current;
      }
      return seasons[0].seasonNumber;
    });
  }, [seasons]);

  useEffect(() => {
    if (movie.type !== 'series' || !selectedSeason || episodesBySeason[selectedSeason]) {
      return;
    }

    void loadSeasonEpisodes(selectedSeason);
  }, [movie.type, selectedSeason, episodesBySeason, targetId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const response = await moviesAPI.getById(targetId);
      setMovie(response.data as Movie);
    } catch (error) {
      console.error('Failed to load details:', error);
      setMovie(routeMovie);
    } finally {
      setLoading(false);
    }
  };

  const loadCast = async () => {
    try {
      setLoadingCast(true);
      const response = await moviesAPI.getCast(targetId, 20);
      setCastActors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load cast:', error);
      setCastActors([]);
    } finally {
      setLoadingCast(false);
    }
  };

  const loadUserData = async () => {
    try {
      const [ratingsRes, watchlistRes] = await Promise.all([
        ratingsAPI.getUserRatings(),
        watchlistAPI.getAll(),
      ]);
      const fetchedRatings = Array.isArray(ratingsRes.data) ? ratingsRes.data : ratingsRes.data?.data || [];
      const fetchedWatchlist = Array.isArray(watchlistRes.data) ? watchlistRes.data : watchlistRes.data?.data || [];
      setRatings(fetchedRatings as Rating[]);
      setWatchlistItems(fetchedWatchlist as WatchlistItem[]);
    } catch (error) {
      console.error('Failed to load rating/watchlist data:', error);
    }
  };

  const loadSeasonEpisodes = async (seasonNumber: number) => {
    try {
      setLoadingEpisodes(true);
      const response = await moviesAPI.getSeriesSeason(targetId, seasonNumber);
      const episodes = Array.isArray(response.data) ? response.data : [];
      setEpisodesBySeason((current) => ({ ...current, [seasonNumber]: episodes as SeriesEpisode[] }));
    } catch (error) {
      console.error('Failed to load season episodes:', error);
      setEpisodesBySeason((current) => ({ ...current, [seasonNumber]: [] }));
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleToggleWatchlist = async () => {
    try {
      setLoading(true);
      if (matchedWatchlistItem) {
        await watchlistAPI.remove(matchedWatchlistItem.movieId);
        Alert.alert('Updated', 'Removed from watchlist');
      } else {
        await watchlistAPI.add({ movieId: String(movie.tmdbId || movie.id), priority: 'medium', status: 'planned' });
        Alert.alert('Updated', 'Added to watchlist');
      }
      await loadUserData();
    } catch (error) {
      console.error('Failed to update watchlist:', error);
      Alert.alert('Error', 'Failed to update watchlist');
    } finally {
      setLoading(false);
    }
  };

  const getSharePayload = () => {
    const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '';
    const tmdbId = movie.tmdbId || Number(movie.id);
    const mediaPath = movie.type === 'series' ? 'tv' : 'movie';
    const tmdbUrl = Number.isFinite(tmdbId)
      ? `https://www.themoviedb.org/${mediaPath}/${tmdbId}`
      : '';

    return {
      message: [
        `Check this ${movie.type === 'series' ? 'series' : 'movie'}: ${movie.title}${year ? ` (${year})` : ''}`,
        `TMDB rating: ${movie.rating.toFixed(1)}/10`,
        movie.description,
        tmdbUrl,
      ].filter(Boolean).join('\n\n'),
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
        text: `I think you'll like this ${movie.type === 'series' ? 'series' : 'movie'}!`,
        movieTmdbId: payload.tmdbId,
        movieTitle: movie.title,
        moviePoster: movie.poster,
      });
      setShareModalOpen(false);
      Alert.alert('Shared', 'Title shared in chat.');
    } catch (error) {
      console.error('Failed to share title in chat:', error);
      Alert.alert('Error', 'Failed to share in chat.');
    } finally {
      setSharingToFriendId(null);
    }
  };

  const handleNativeShare = async () => {
    try {
      const payload = getSharePayload();
      await Share.share({ message: payload.message });
    } catch (error) {
      console.error('Native share failed:', error);
    }
  };

  const handleOpenActor = (actor: Actor) => {
    if (!isNavigableActorId(actor.id)) {
      Alert.alert('Unavailable', 'This cast profile is not available for this title.');
      return;
    }

    navigation.navigate('ActorProfile', { actorId: String(actor.id) });
  };

  const activeEpisodes = selectedSeason ? episodesBySeason[selectedSeason] || [] : [];

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: backdropUrl }} style={styles.backdrop} onError={() => setBackdropFailed(true)} />

      <View style={styles.content}>
        <Image source={{ uri: posterUrl }} style={styles.poster} onError={() => setPosterFailed(true)} />

        <Text style={styles.title}>{movie.title}</Text>
        <Text style={styles.releaseDate}>
          {new Date(movie.releaseDate).getFullYear()} • {movie.type === 'series' ? 'Series' : 'Movie'}
          {movie.type === 'series' && movie.seasonCount ? ` • ${movie.seasonCount} seasons` : ''}
        </Text>

        <Text style={styles.description}>{movie.description}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>TMDB</Text>
            <Text style={styles.infoValue}>{movie.rating.toFixed(1)}/10</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Your Rating</Text>
            <Text style={styles.infoValue}>{userRating ? `${userRating.rating}/10` : 'Watchlist only'}</Text>
          </View>
          {movie.runtime ? (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>{movie.type === 'series' ? 'Episode Runtime' : 'Runtime'}</Text>
              <Text style={styles.infoValue}>{movie.runtime} min</Text>
            </View>
          ) : null}
        </View>

        {movie.director ? (
          <Text style={styles.metaLine}>
            <Text style={styles.metaLabel}>{movie.type === 'series' ? 'Creator' : 'Director'}: </Text>
            <Text style={styles.metaValue}>{movie.director}</Text>
          </Text>
        ) : null}

        {movie.genres.length > 0 ? (
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
        ) : null}

        {movie.streamingPlatforms.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Where to watch</Text>
            <View style={styles.platformList}>
              {movie.streamingPlatforms.map((platform) => (
                <TouchableOpacity key={platform.platform} style={styles.platformTag} onPress={() => Linking.openURL(platform.url)}>
                  <Text style={styles.platformText}>{platform.platform}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        {movie.type === 'series' && seasons.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Season Overview</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonTabs}>
              {seasons.map((season) => (
                <TouchableOpacity
                  key={season.id}
                  style={[styles.seasonChip, selectedSeason === season.seasonNumber && styles.seasonChipActive]}
                  onPress={() => setSelectedSeason(season.seasonNumber)}
                >
                  <Text style={[styles.seasonChipText, selectedSeason === season.seasonNumber && styles.seasonChipTextActive]}>
                    S{season.seasonNumber} • {season.episodeCount} eps
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.episodesWrap}>
              {loadingEpisodes ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : activeEpisodes.length > 0 ? (
                activeEpisodes.map((episode) => (
                  <View key={episode.id} style={styles.episodeCard}>
                    <Text style={styles.episodeTitle}>E{episode.episodeNumber}: {episode.name}</Text>
                    <Text style={styles.episodeMeta}>
                      {formatDate(episode.airDate)}{episode.runtime ? ` • ${episode.runtime} min` : ''}
                    </Text>
                    {episode.overview ? <Text style={styles.episodeOverview}>{episode.overview}</Text> : null}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyEpisodes}>No episode details available.</Text>
              )}
            </View>
          </>
        ) : null}

        {(loadingCast || castActors.length > 0 || movie.cast.length > 0) ? (
          <>
            <Text style={styles.sectionTitle}>Cast</Text>
            {loadingCast ? (
              <ActivityIndicator size="small" color="#dc2626" style={styles.castLoader} />
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
                    onPress={() => handleOpenActor(item)}
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
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleToggleWatchlist} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{matchedWatchlistItem ? 'Remove from Watchlist' : 'Add to Watchlist'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleOpenShare}>
            <Text style={styles.buttonText}>Share {movie.type === 'series' ? 'Series' : 'Movie'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={shareModalOpen} transparent animationType="slide" onRequestClose={() => setShareModalOpen(false)}>
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
                    <Text style={styles.shareFriendAction}>{sharingToFriendId === item.id ? 'Sending...' : 'Send'}</Text>
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

export default MovieDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121217',
  },
  backdrop: {
    width: '100%',
    height: 260,
    backgroundColor: '#1f1f24',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    marginTop: -70,
  },
  poster: {
    width: 132,
    height: 198,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: '#25252c',
    borderColor: '#2f2f38',
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  releaseDate: {
    color: '#a1a1aa',
    fontSize: 14,
    marginTop: 6,
  },
  description: {
    color: '#d4d4d8',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 18,
    paddingVertical: 16,
    borderTopColor: '#25252c',
    borderTopWidth: 1,
    borderBottomColor: '#25252c',
    borderBottomWidth: 1,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    color: '#8f8f99',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  metaLine: {
    marginTop: -4,
    marginBottom: 6,
  },
  metaLabel: {
    color: '#8f8f99',
    fontSize: 13,
  },
  metaValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
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
    backgroundColor: '#1c1c23',
    borderColor: '#2e2e38',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  genreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  platformList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  platformTag: {
    backgroundColor: '#242430',
    borderColor: '#343447',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  platformText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  seasonTabs: {
    paddingBottom: 8,
  },
  seasonChip: {
    backgroundColor: '#1c1c23',
    borderColor: '#303040',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  seasonChipActive: {
    backgroundColor: '#312e81',
    borderColor: '#6366f1',
  },
  seasonChipText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontWeight: '600',
  },
  seasonChipTextActive: {
    color: '#eef2ff',
  },
  episodesWrap: {
    backgroundColor: '#18181f',
    borderColor: '#27272f',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  episodeCard: {
    backgroundColor: '#101016',
    borderColor: '#262630',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  episodeTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  episodeMeta: {
    color: '#a1a1aa',
    fontSize: 11,
    marginTop: 4,
  },
  episodeOverview: {
    color: '#d4d4d8',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  emptyEpisodes: {
    color: '#8f8f99',
    fontSize: 13,
  },
  castLoader: {
    marginBottom: 8,
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
  actions: {
    gap: 10,
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#dc2626',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#1f1f27',
    borderColor: '#3a3a48',
    borderWidth: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
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