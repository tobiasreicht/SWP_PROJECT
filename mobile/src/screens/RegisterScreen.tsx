import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { useAuthStore } from '../store';

export function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { register, isLoading, error } = useAuthStore();

  const handleRegister = async () => {
    if (!email || !username || !displayName || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await register(email, username, password, displayName);
    } catch (error) {
      Alert.alert('Registration Failed', error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.bgGlowTop} />
      <View style={styles.bgGlowBottom} />

      <View style={styles.inner}>
        <Image
          source={require('@/assets/images/watch-togther-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join the Watch Together mobile experience.</Text>
        
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
          placeholder="Username"
          placeholderTextColor="#8f94a3"
          value={username}
          onChangeText={setUsername}
          editable={!isLoading}
        />

        <TextInput
          style={styles.input}
          placeholder="Display Name"
          placeholderTextColor="#8f94a3"
          value={displayName}
          onChangeText={setDisplayName}
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

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#8f94a3"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!isLoading}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkWrap} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0f14',
  },
  contentContainer: {
    padding: 18,
    paddingVertical: 24,
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
  inner: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#283042',
    backgroundColor: '#131722',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  logo: {
    width: 220,
    height: 116,
    alignSelf: 'center',
    marginBottom: 4,
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
    marginBottom: 10,
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
