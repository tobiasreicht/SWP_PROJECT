import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Message } from '../types';
import { messagesAPI } from '../services/api';
import { useAuthStore } from '../store';

export function MessagesScreen({ route, navigation }: any) {
  const { friendId } = route.params;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const response = await messagesAPI.getConversation(friendId);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!text.trim()) return;

    try {
      setSending(true);
      await messagesAPI.send(friendId, { text });
      setText('');
      loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
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
                  <>
                    {item.moviePoster && (
                      <Image
                        source={{ uri: item.moviePoster }}
                        style={styles.movieImage}
                      />
                    )}
                    <Text style={styles.movieTitle}>{item.movieTitle}</Text>
                  </>
                ) : (
                  <Text style={styles.message}>{item.text}</Text>
                )}
              </View>
            </View>
          );
        }}
        inverted
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
    backgroundColor: '#1a1a1a',
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
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 12,
  },
  messageBubbleMe: {
    backgroundColor: '#dc2626',
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
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopColor: '#2a2a2a',
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    borderWidth: 1,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#dc2626',
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
