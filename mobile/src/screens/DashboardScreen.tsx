import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { analyticsAPI } from '../services/api';
import { AnalyticsData } from '../types';

export function DashboardScreen() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const [dashboardRes, genresRes, monthlyRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getGenreDistribution(),
        analyticsAPI.getMonthlyStats(),
      ]);

      setAnalytics({
        totalMoviesWatched: dashboardRes.data.totalMoviesWatched,
        totalSeriesWatched: dashboardRes.data.totalSeriesWatched,
        averageRating: dashboardRes.data.averageRating,
        genreDistribution: genresRes.data,
        monthlyStats: monthlyRes.data,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
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

  if (!analytics) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load analytics</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Dashboard</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{analytics.totalMoviesWatched}</Text>
          <Text style={styles.statLabel}>Movies Watched</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{analytics.totalSeriesWatched}</Text>
          <Text style={styles.statLabel}>Series Watched</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{analytics.averageRating?.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg Rating</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Genre Distribution</Text>
        {analytics.genreDistribution.length > 0 ? (
          analytics.genreDistribution.map((genre) => (
            <View key={genre.genre} style={styles.genreBar}>
              <Text style={styles.genreName}>{genre.genre}</Text>
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${(genre.count / Math.max(...analytics.genreDistribution.map(g => g.count))) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.genreCount}>{genre.count}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No data yet</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Last 12 Months</Text>
        {analytics.monthlyStats.length > 0 ? (
          analytics.monthlyStats.map((month) => (
            <View key={month.month} style={styles.monthRow}>
              <Text style={styles.monthName}>{month.month}</Text>
              <View style={styles.monthBar}>
                {Array.from({ length: month.count }).map((_, i) => (
                  <View key={i} style={styles.dot} />
                ))}
              </View>
              <Text style={styles.monthCount}>{month.count}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No data yet</Text>
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
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
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
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 5,
    flexDirection: 'row',
  },
  barFill: {
    backgroundColor: '#dc2626',
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
    backgroundColor: '#dc2626',
    borderRadius: 4,
  },
  monthCount: {
    color: '#999',
    fontSize: 12,
    width: 30,
    textAlign: 'right',
  },
  noDataText: {
    color: '#666',
    fontSize: 14,
    marginVertical: 20,
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
