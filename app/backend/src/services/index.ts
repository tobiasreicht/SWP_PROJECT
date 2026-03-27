// Recommendation Service - Core Algorithm for Personalized Recommendations

export class RecommendationService {
  /**
   * Get personalized movie recommendations based on user's ratings
   * Algorithm: Content-Based + Collaborative Filtering
   */
  static async getPersonalRecommendations(userId: string, limit: number = 10) {
    try {
      // Step 1: Get user's ratings
      // const userRatings = await Rating.find({ userId }).populate('movieId');

      // Step 2: Extract user's preferences
      // const favoriteGenres = this.extractFavoriteGenres(userRatings);
      // const averageRating = userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length;

      // Step 3: Get unrated movies in favorite genres
      // const unratedMovies = await Movie.find({
      //   genres: { $in: favoriteGenres },
      //   _id: { $nin: userRatings.map(r => r.movieId) }
      // });

      // Step 4: Score and rank movies
      // const scored = unratedMovies.map(movie => ({
      //   ...movie,
      //   score: this.calculateScore(movie, favoriteGenres, averageRating)
      // }));

      // Step 5: Find similar users and add collaborative recommendations
      // const similarUsers = await this.findSimilarUsers(userId, userRatings);
      // const collaborativeRecs = await this.getCollaborativeRecommendations(similarUsers, userRatings);

      return {
        personalRecs: [], // sorted and scored
        collaborativeRecs: [],
      };
    } catch (error) {
      console.error('Recommendation error:', error);
      throw error;
    }
  }

  /**
   * Calculate taste compatibility between two users
   * Returns 0-100 percentage
   */
  static async calculateTasteMatch(userId1: string, userId2: string): Promise<number> {
    try {
      // Get ratings from both users
      // const ratings1 = await Rating.find({ userId: userId1 });
      // const ratings2 = await Rating.find({ userId: userId2 });

      // Find common movies
      // const commonMovies = ratings1.filter(r1 =>
      //   ratings2.some(r2 => r2.movieId.equals(r1.movieId))
      // );

      // If no common movies, similarity is low
      // if (commonMovies.length === 0) return 20;

      // Calculate rating similarity
      // const ratingDifferences = commonMovies.map(r1 => {
      //   const r2 = ratings2.find(r => r.movieId.equals(r1.movieId));
      //   return Math.abs(r1.rating - r2!.rating);
      // });

      // const avgDifference = ratingDifferences.reduce((a, b) => a + b, 0) / ratingDifferences.length;
      // const match = Math.max(0, 100 - (avgDifference * 10));

      return 85; // Example: 85% taste match
    } catch (error) {
      console.error('Taste match calculation error:', error);
      throw error;
    }
  }

  /**
   * Get joint recommendations for two users (what to watch together)
   */
  static async getJointRecommendations(userId1: string, userId2: string) {
    try {
      // Get highly rated movies from both users
      // const user1HighRated = await Rating.find({
      //   userId: userId1,
      //   rating: { $gte: 7 }
      // }).populate('movieId');

      // const user2HighRated = await Rating.find({
      //   userId: userId2,
      //   rating: { $gte: 7 }
      // }).populate('movieId');

      // Find genre overlap
      // Calculate compatibility for each movie
      // Sort by compatibility score

      return {
        jointRecommendations: [],
        averageCompatibility: 0,
      };
    } catch (error) {
      console.error('Joint recommendation error:', error);
      throw error;
    }
  }

  // Helper methods
  private static extractFavoriteGenres(userRatings: any[]): string[] {
    // Count genre occurrences in highly-rated movies
    const genreCounts: Record<string, number> = {};

    userRatings
      .filter((r) => r.rating >= 7)
      .forEach((r) => {
        r.movieId.genres.forEach((g: string) => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      });

    return Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);
  }

  private static calculateScore(
    movie: any,
    favoriteGenres: string[],
    userAverageRating: number
  ): number {
    let score = 0;

    // Genre match (40% of score)
    const genreMatch = movie.genres.filter((g: string) => favoriteGenres.includes(g)).length;
    score += (genreMatch / favoriteGenres.length) * 40;

    // Movie rating quality (40% of score)
    const ratingScore = Math.min(movie.rating / 10, 1) * 40;
    score += ratingScore;

    // Release recency bonus (20% of score)
    const yearsSinceRelease = new Date().getFullYear() - new Date(movie.releaseDate).getFullYear();
    const recencyScore = Math.max(0, 1 - yearsSinceRelease / 20) * 20;
    score += recencyScore;

    return score;
  }

  private static async findSimilarUsers(userId: string, userRatings: any[]) {
    // Find users with similar rating patterns
    // Return top 5-10 similar users
    return [];
  }

  private static async getCollaborativeRecommendations(similarUsers: any[], userRatings: any[]) {
    // Get top-rated movies from similar users
    // Filter out movies already rated by user
    return [];
  }
}

// Analytics Service
export class AnalyticsService {
  /**
   * Calculate user statistics from ratings
   */
  static async getUserStats(userId: string) {
    try {
      // const ratings = await Rating.find({ userId }).populate('movieId');

      return {
        totalWatched: 0,
        totalSeries: 0,
        averageRating: 0,
        mostWatchedGenre: '',
        monthlyActivity: [],
        genreDistribution: {},
      };
    } catch (error) {
      console.error('Analytics error:', error);
      throw error;
    }
  }

  /**
   * Generate monthly viewing statistics
   */
  static async getMonthlyStats(userId: string, months: number = 12) {
    try {
      const stats = [];

      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);

        // Count ratings in this month
        // const count = await Rating.countDocuments({
        //   userId,
        //   createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        // });

        stats.unshift({
          month: date.toLocaleString('default', { month: 'short' }),
          count: 0,
          averageRating: 0,
        });
      }

      return stats;
    } catch (error) {
      console.error('Monthly stats error:', error);
      throw error;
    }
  }

  /**
   * Get genre distribution
   */
  static async getGenreDistribution(userId: string) {
    try {
      // const ratings = await Rating.find({ userId }).populate('movieId');
      // const distribution: Record<string, number> = {};

      // ratings.forEach(r => {
      //   r.movieId.genres.forEach(g => {
      //     distribution[g] = (distribution[g] || 0) + 1;
      //   });
      // });

      return {};
    } catch (error) {
      console.error('Genre distribution error:', error);
      throw error;
    }
  }
}

// Gamification Service
export class GamificationService {
  /**
   * Check and award achievements based on user activity
   */
  static async checkAchievements(userId: string) {
    const achievements = [];

    // const ratings = await Rating.find({ userId });
    // const watchlist = await Watchlist.find({ userId });
    // const friends = await Friend.find({ userId, status: 'accepted' });

    // Achievement 1: First Movie
    // if (ratings.length >= 1) achievements.push('FIRST_MOVIE');

    // Achievement 2: Five Star Rating
    // if (ratings.some(r => r.rating === 10)) achievements.push('FIVE_STAR');

    // Achievement 3: Watchlist Master
    // if (watchlist.length >= 20) achievements.push('WATCHLIST_MASTER');

    // Achievement 4: Social Butterfly
    // if (friends.length >= 10) achievements.push('SOCIAL_BUTTERFLY');

    // Achievement 5: Binge Watcher
    // const thisMonth = new Date();
    // thisMonth.setMonth(thisMonth.getMonth() - 1);
    // const monthlyCount = ratings.filter(r => r.createdAt > thisMonth).length;
    // if (monthlyCount >= 20) achievements.push('BINGE_WATCHER');

    return achievements;
  }

  /**
   * Calculate user level based on activities
   */
  static calculateLevel(ratingCount: number, friendCount: number, watchlistCount: number): number {
    const score = ratingCount * 10 + friendCount * 100 + watchlistCount * 5;
    return Math.floor(score / 100) + 1;
  }
}
