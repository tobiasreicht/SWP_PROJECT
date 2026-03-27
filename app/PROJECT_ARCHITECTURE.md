# Netflix-Style Movie & Series Tracker - Project Architecture

## 📁 Folder Structure

```
swp-film-tracker/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Input.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── movie/
│   │   │   │   ├── MovieCard.tsx
│   │   │   │   ├── MovieRow.tsx
│   │   │   │   ├── MovieModal.tsx
│   │   │   │   └── StreamingBadges.tsx
│   │   │   ├── social/
│   │   │   │   ├── FriendList.tsx
│   │   │   │   ├── FriendCard.tsx
│   │   │   │   ├── ActivityFeed.tsx
│   │   │   │   └── RecommendationCard.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCard.tsx
│   │   │   │   ├── GenreChart.tsx
│   │   │   │   ├── RatingChart.tsx
│   │   │   │   └── ActivityChart.tsx
│   │   │   └── common/
│   │   │       ├── RatingSelector.tsx
│   │   │       ├── GenreFilter.tsx
│   │   │       └── SearchBar.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Explore.tsx
│   │   │   ├── Watchlist.tsx
│   │   │   ├── Social.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── Auth.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useMovies.ts
│   │   │   ├── useUser.ts
│   │   │   ├── useRecommendations.ts
│   │   │   └── useFriends.ts
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── MovieContext.tsx
│   │   │   └── UserContext.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── movieService.ts
│   │   │   ├── userService.ts
│   │   │   ├── socialService.ts
│   │   │   └── recommendationService.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   └── formatters.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Movie.ts
│   │   │   ├── Rating.ts
│   │   │   ├── Watchlist.ts
│   │   │   ├── Friend.ts
│   │   │   ├── Recommendation.ts
│   │   │   └── Achievement.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── movies.ts
│   │   │   ├── users.ts
│   │   │   ├── ratings.ts
│   │   │   ├── watchlists.ts
│   │   │   ├── friends.ts
│   │   │   ├── recommendations.ts
│   │   │   └── social.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── movieController.ts
│   │   │   ├── userController.ts
│   │   │   ├── ratingController.ts
│   │   │   ├── watchlistController.ts
│   │   │   ├── friendController.ts
│   │   │   ├── recommendationController.ts
│   │   │   └── analyticsController.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── movieService.ts
│   │   │   ├── userService.ts
│   │   │   ├── recommendationService.ts
│   │   │   ├── socialService.ts
│   │   │   ├── analyticsService.ts
│   │   │   └── notificationService.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── validation.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── validators.ts
│   │   │   └── helpers.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── jwt.ts
│   │   │   └── env.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── server.ts
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
│   └── .gitignore
```

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String,
  username: String,
  password: String (hashed),
  displayName: String,
  avatar: String,
  bio: String,
  preferences: {
    favoriteGenres: [String],
    theme: String,
    notifications: Boolean
  },
  statistics: {
    totalMoviesWatched: Number,
    totalSeriesWatched: Number,
    averageRating: Number,
    mostWatchedGenre: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Movies Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  releaseDate: Date,
  type: "movie" | "series",
  genres: [String],
  director: String,
  cast: [String],
  poster: String,
  backdrop: String,
  runtime: Number,
  rating: Number, // IMDb/TMDB rating
  streamingPlatforms: [{
    platform: String,
    url: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### Ratings Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  movieId: ObjectId,
  rating: Number, // 1-10
  review: String,
  watchedDate: Date,
  isFavorite: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Watchlist Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  movieId: ObjectId,
  priority: "high" | "medium" | "low",
  addedAt: Date,
  notes: String
}
```

### Friends Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  friendId: ObjectId,
  status: "pending" | "accepted" | "blocked",
  createdAt: Date,
  tasteMatch: Number // 0-100%
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user

### Movies
- `GET /api/movies` - Get all movies (with pagination, filters)
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/search?q=title` - Search movies
- `GET /api/movies/genre/:genre` - Get movies by genre
- `GET /api/movies/trending` - Get trending movies
- `GET /api/movies/new` - Get latest releases

### Ratings & Watchlist
- `POST /api/ratings` - Rate a movie
- `GET /api/ratings/user/:userId` - Get user's ratings
- `PUT /api/ratings/:id` - Update rating
- `DELETE /api/ratings/:id` - Delete rating
- `POST /api/watchlist` - Add to watchlist
- `GET /api/watchlist/:userId` - Get user's watchlist
- `DELETE /api/watchlist/:id` - Remove from watchlist

### Users & Profile
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/statistics` - Get user statistics

### Friends & Social
- `POST /api/friends/add` - Send friend request
- `GET /api/friends/:userId` - Get user's friends
- `PUT /api/friends/:id/accept` - Accept friend request
- `DELETE /api/friends/:id` - Remove friend
- `GET /api/friends/:userId/activity` - Get friend activity feed
- `GET /api/friends/:userId/common` - Get common movies with friend

### Recommendations
- `GET /api/recommendations/user` - Get personalized recommendations
- `GET /api/recommendations/friends` - Get recommendations from friends
- `GET /api/recommendations/taste-match/:friendId` - Get taste compatibility
- `GET /api/recommendations/joint/:friendId` - Get joint recommendations

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics
- `GET /api/analytics/genre-distribution` - Genre statistics
- `GET /api/analytics/monthly` - Monthly watch statistics

## 🎨 Design System

### Colors (Netflix Dark Theme)
- Primary: `#E50914` (Netflix Red)
- Secondary: `#221F1F` (Netflix Black)
- Accent: `#564D4D` (Dark Gray)
- Text: `#FFFFFF` (White)
- Muted: `#808080` (Gray)

### Typography
- Heading: 'Segoe UI', system fonts
- Body: 'Segoe UI', system fonts

### Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

## 👥 Team Distribution

### Frontend Developer
- UI Components (Button, Card, Modal, etc.)
- Page layouts and routing
- Movie/Series display components
- Rating and list features
- Responsive design implementation

### Backend Developer
- REST API structure
- Authentication (JWT)
- Database models and queries
- User management
- Movie/Rating/Watchlist endpoints

### Logic & Features Developer
- Recommendation algorithms
- Taste matching system
- Analytics and statistics
- Gamification system
- Data processing and transformations

## 🚀 Tech Stack Summary

**Frontend**
- React 19.2
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios/Fetch

**Backend**
- Node.js
- Express.js
- TypeScript
- MongoDB/PostgreSQL
- JWT Authentication
- Mongoose/TypeORM

**Infrastructure**
- Docker support
- Environment configuration
- Error handling
- Logging system
