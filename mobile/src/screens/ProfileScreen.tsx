import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { useAuthStore } from '../store';
import { analyticsAPI, usersAPI } from '../services/api';
import { AnalyticsData } from '../types';

export function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const [statsResponse, dashboardRes, genresRes, monthlyRes] = await Promise.all([
        usersAPI.getStatistics(user!.id),
        analyticsAPI.getDashboard(),
        analyticsAPI.getGenreDistribution(),
        analyticsAPI.getMonthlyStats(),
      ]);
      setStats(statsResponse.data);
      setAnalytics({
        totalMoviesWatched: dashboardRes.data.totalMoviesWatched,
        totalSeriesWatched: dashboardRes.data.totalSeriesWatched,
        averageRating: dashboardRes.data.averageRating,
        genreDistribution: genresRes.data,
        monthlyStats: monthlyRes.data,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
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
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{user?.displayName[0]}</Text>
          </View>
        )}
        <Text style={styles.name}>{user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.totalMoviesWatched || 0}</Text>
          <Text style={styles.statLabel}>Movies Watched</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.totalSeriesWatched || 0}</Text>
          <Text style={styles.statLabel}>Series Watched</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats?.averageRating?.toFixed(1) || 'N/A'}</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Favorite Genres</Text>
        <View style={styles.genreContainer}>
          {user?.preferences?.favoriteGenres?.map((genre: string) => (
            <View key={genre} style={styles.genreBadge}>
              <Text style={styles.genreText}>{genre}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Dashboard</Text>
        <View style={styles.analyticsStatsGrid}>
          <View style={styles.analyticsStatCard}>
            <Text style={styles.analyticsStatNumber}>{analytics?.totalMoviesWatched ?? 0}</Text>
            <Text style={styles.analyticsStatLabel}>Movies Watched</Text>
          </View>
          <View style={styles.analyticsStatCard}>
            <Text style={styles.analyticsStatNumber}>{analytics?.totalSeriesWatched ?? 0}</Text>
            <Text style={styles.analyticsStatLabel}>Series Watched</Text>
          </View>
          <View style={styles.analyticsStatCard}>
            <Text style={styles.analyticsStatNumber}>{analytics?.averageRating?.toFixed(1) ?? 'N/A'}</Text>
            <Text style={styles.analyticsStatLabel}>Avg Rating</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Genre Distribution</Text>
        {analytics?.genreDistribution?.length ? (
          analytics.genreDistribution.map((genre) => (
            <View key={genre.genre} style={styles.genreBar}>
              <Text style={styles.genreName}>{genre.genre}</Text>
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${(genre.count / Math.max(...analytics.genreDistribution.map((entry) => entry.count))) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.genreCount}>{genre.count}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyAnalytics}>No genre data yet</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Last 12 Months</Text>
        {analytics?.monthlyStats?.length ? (
          analytics.monthlyStats.map((month) => (
            <View key={month.month} style={styles.monthRow}>
              <Text style={styles.monthName}>{month.month}</Text>
              <View style={styles.monthBar}>
                {Array.from({ length: month.count }).map((_, index) => (
                  <View key={`${month.month}-${index}`} style={styles.dot} />
                ))}
              </View>
              <Text style={styles.monthCount}>{month.count}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyAnalytics}>No monthly data yet</Text>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
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
  header: {
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 18,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2a2a2a',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 15,
  },
  email: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  bio: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 10,
    textAlign: 'center',
    maxWidth: 250,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopColor: '#242a3a',
    borderTopWidth: 1,
    borderBottomColor: '#242a3a',
    borderBottomWidth: 1,
    backgroundColor: '#11131a',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  section: {
    padding: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreBadge: {
    backgroundColor: '#1a1f2c',
    borderColor: '#2d3446',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  genreText: {
    color: '#fff',
    fontSize: 12,
  },
  analyticsStatsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  analyticsStatCard: {
    flex: 1,
    backgroundColor: '#131722',
    borderColor: '#2a3040',
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyticsStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  analyticsStatLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  genreBar: {
    marginBottom: 15,
  },
  genreName: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 5,
  },
  barBackground: {
    height: 8,
    backgroundColor: '#1a1f2c',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
    flexDirection: 'row',
  },
  barFill: {
    backgroundColor: '#ef4444',
    height: '100%',
  },
  genreCount: {
    color: '#999',
    fontSize: 11,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthName: {
    color: '#fff',
    fontSize: 12,
    width: 60,
  },
  monthBar: {
    flex: 1,
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  monthCount: {
    color: '#999',
    fontSize: 12,
    width: 30,
    textAlign: 'right',
  },
  emptyAnalytics: {
    color: '#666',
    fontSize: 14,
    marginVertical: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#7f1d1d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
