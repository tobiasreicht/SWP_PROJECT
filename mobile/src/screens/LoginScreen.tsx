import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useAuthStore } from '../store';

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert('Login Failed', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      <View style={styles.card}>
        <Image
          source={require('@/assets/images/watch-togther-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue watching together.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#8f94a3"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8f94a3"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkWrap} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0f14',
    padding: 18,
    justifyContent: 'center',
  },
  bgGlowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: '#3b161d',
    opacity: 0.45,
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: '#1e2534',
    opacity: 0.55,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#283042',
    backgroundColor: '#131722',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 18,
    fontSize: 13,
  },
  logo: {
    width: 220,
    height: 116,
    alignSelf: 'center',
    marginBottom: 2,
  },
  input: {
    backgroundColor: '#1b2230',
    borderColor: '#303a52',
    borderWidth: 1,
    color: '#fff',
    padding: 13,
    marginBottom: 12,
    borderRadius: 12,
  },
  button: {
    backgroundColor: '#ef4444',
    padding: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  linkWrap: {
    marginTop: 14,
  },
  link: {
    color: '#f87171',
    textAlign: 'center',
    fontWeight: '600',
  },
});
