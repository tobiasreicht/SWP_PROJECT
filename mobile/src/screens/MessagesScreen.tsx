import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Message } from '../types';
import { messagesAPI, moviesAPI } from '../services/api';
import { useAuthStore } from '../store';
import { useFocusEffect } from '@react-navigation/native';

export function MessagesScreen({ route, navigation }: any) {
  const friendId = route?.params?.friendId as string | undefined;
  const friendName = route?.params?.friendName as string | undefined;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [pollingId, setPollingId] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (friendName) {
      navigation.setOptions({ title: friendName });
    }
  }, [friendName, navigation]);

  useFocusEffect(
    React.useCallback(() => {
      void loadMessages();
      const interval = setInterval(() => {
        void loadMessages(true);
      }, 2500);
      setPollingId(interval);

      return () => {
        clearInterval(interval);
      };
    }, [friendId])
  );

  useEffect(() => {
    return () => {
      if (pollingId) {
        clearInterval(pollingId);
      }
    };
  }, [pollingId]);

  const loadMessages = async (silent = false) => {
    if (!friendId) {
      setLoading(false);
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await messagesAPI.getConversation(friendId);
      const data = Array.isArray(response.data) ? response.data : [];
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!friendId || !text.trim()) return;

    try {
      setSending(true);
      await messagesAPI.send(friendId, { text: text.trim() });
      setText('');
      await loadMessages(true);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const openSharedMovie = async (message: Message) => {
    try {
      const targetId = message.movieTmdbId ? String(message.movieTmdbId) : undefined;

      if (targetId) {
        const response = await moviesAPI.getById(targetId);
        navigation.navigate('MovieDetail', { movie: response.data });
        return;
      }

      if (message.movieTitle) {
        const search = await moviesAPI.search(message.movieTitle);
        const first = Array.isArray(search.data) ? search.data[0] : null;
        if (first) {
          navigation.navigate('MovieDetail', { movie: first });
          return;
        }
      }
    } catch (error) {
      console.error('Failed to open shared movie from chat:', error);
    }
  };

  if (!friendId) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyState}>No conversation selected.</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#dc2626" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 8 }}
        contentContainerStyle={messages.length === 0 ? styles.emptyList : undefined}
        renderItem={({ item }) => {
          const isFromMe = item.senderId === user?.id;
          return (
            <View style={[styles.messageRow, isFromMe && styles.messageRowMe]}>
              <View
                style={[
                  styles.messageBubble,
                  isFromMe && styles.messageBubbleMe,
                ]}
              >
                {item.movieTitle ? (
                  <TouchableOpacity onPress={() => openSharedMovie(item)} activeOpacity={0.85}>
                    {item.moviePoster && (
                      <Image
                        source={{ uri: item.moviePoster }}
                        style={styles.movieImage}
                      />
                    )}
                    <Text style={styles.movieTitle}>{item.movieTitle}</Text>
                    <Text style={styles.movieOpenHint}>Tap to open movie details</Text>
                    {item.text ? <Text style={styles.message}>{item.text}</Text> : null}
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.message}>{item.text}</Text>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.emptyState}>No messages yet. Start the conversation.</Text>}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={sending}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0f14',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    color: '#999',
    textAlign: 'center',
    fontSize: 14,
  },
  messageRow: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '70%',
    backgroundColor: '#141924',
    borderColor: '#2a3040',
    borderWidth: 1,
    padding: 10,
    borderRadius: 14,
  },
  messageBubbleMe: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  message: {
    color: '#fff',
    fontSize: 14,
  },
  movieImage: {
    width: 150,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  movieOpenHint: {
    color: '#fca5a5',
    fontSize: 11,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopColor: '#242a3a',
    borderTopWidth: 1,
    backgroundColor: '#11131a',
  },
  input: {
    flex: 1,
    backgroundColor: '#161b26',
    borderColor: '#2d3446',
    borderWidth: 1,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
