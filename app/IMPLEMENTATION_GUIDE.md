# FilmTracker: Complete Implementation Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Frontend Setup](#frontend-setup)
4. [Backend Setup](#backend-setup)
5. [Feature Implementation Checklist](#feature-implementation-checklist)
6. [Team Responsibilities](#team-responsibilities)
7. [Development Workflow](#development-workflow)

---

## Project Overview

**FilmTracker** is a Netflix-style web application where users can:
- Track movies and TV series they've watched
- Rate and review content
- Manage watchlists
- Connect with friends and get recommendations
- View detailed analytics of viewing habits
- Discover content based on personal preferences

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| State Management | Zustand |
| HTTP Client | Axios |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB (or PostgreSQL) |
| Authentication | JWT |
| Charts/Analytics | Recharts |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn
- MongoDB (local or Atlas)
- Visual Studio Code

### Quick Start

```bash
# Clone the repository
git clone <repo-url>
cd swp-film-tracker

# Install frontend dependencies
cd SWP-Film_Tracker
npm install

# Install backend dependencies
cd ../backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development servers
# Terminal 1 - Frontend
cd SWP-Film_Tracker
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev
```

---

## Frontend Setup

### Project Structure
```
SWP-Film_Tracker/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── layout/          # Layout wrapper
│   │   ├── movie/           # Movie-related components
│   │   ├── social/          # Social/friend components
│   │   ├── dashboard/       # Analytics components
│   │   └── common/          # Shared utilities
│   ├── pages/               # Page components
│   ├── store/               # Zustand state management
│   ├── types/               # TypeScript types
│   ├── services/            # API services
│   ├── utils/               # Helper functions
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
└── vite.config.ts           # Vite configuration
```

### Key Frontend Features to Implement

#### 1. **Home Page (Hero Section + Content Rows)**
```tsx
// Already implemented in src/pages/Home.tsx
- Hero banner with featured movie
- Trending movies row
- Recent releases row
- Continue watching row
```

#### 2. **Movie Card Component**
Features:
- Hover effects showing full details
- Rating display
- Streaming platform badges
- Add to watchlist button
- Quick play button

#### 3. **Movie Modal**
Features:
- Full movie details
- Star-to-10 rating system
- Review text area
- Watchlist management
- Share functionality
- Streaming platform links

#### 4. **Dashboard**
Features:
- Stats cards (movies watched, avg rating, streak)
- Line charts (rating trends over time)
- Pie chart (genre distribution)
- Top-rated movies list
- Achievement badges

#### 5. **Social Features**
Features:
- Friend list with taste compatibility
- Activity feed from friends
- Joint recommendations
- Taste match percentage
- Common movies counter

### Installing Additional Libraries

```bash
npm install axios react-router-dom zustand recharts lucide-react date-fns clsx
```

### Environment Variables (Frontend)
Create `src/.env.local`:
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=FilmTracker
```

---

## Backend Setup

### Project Structure
```
backend/
├── src/
│   ├── models/           # Database schemas
│   ├── controllers/      # Request handlers
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── types/            # TypeScript types
│   ├── utils/            # Helpers
│   ├── config/           # Configuration
│   └── server.ts         # Express app
├── .env.example          # Environment template
├── package.json
└── tsconfig.json
```

### Database Models

#### User Model
```javascript
{
  email, username, passwordHash,
  displayName, avatar, bio,
  preferences: { favoriteGenres, theme, notifications },
  statistics: { totalWatched, totalSeries, averageRating, mostWatchedGenre },
  createdAt, updatedAt
}
```

#### Movie Model
```javascript
{
  title, description, releaseDate,
  type: 'movie' | 'series',
  genres, director, cast,
  poster, backdrop, runtime, rating,
  streamingPlatforms: [{ platform, url }],
  createdAt, updatedAt
}
```

#### Rating Model
```javascript
{
  userId, movieId, rating (1-10),
  review, watchedDate, isFavorite,
  createdAt, updatedAt
}
```

### Implementing Database Connection

```typescript
// backend/src/config/database.ts
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Connection failed:', error);
    process.exit(1);
  }
};
```

### Key Backend Features to Implement

#### 1. **Authentication**
- User registration with hashed passwords
- Login with JWT token generation
- Token refresh mechanism
- Protected routes middleware

#### 2. **Movie Management**
- Fetch movies with pagination
- Search/filter functionality
- Genre-based filtering
- Trending movies algorithm
- New releases endpoint

#### 3. **Ratings & Reviews**
- Create/update/delete user ratings
- Calculate average ratings
- Filter by rating
- Favorite marking system

#### 4. **Watchlist Management**
- Add/remove from watchlist
- Priority levels (high/medium/low)
- Sort by priority or date added
- Count items

#### 5. **Social Features**
- Friend requests (pending/accepted/blocked)
- Friend list retrieval
- Activity feed generation
- Common movies between friends

#### 6. **Recommendation Engine**
Algorithm:
1. **Content-Based**: Recommend movies similar to highly-rated movies
2. **Collaborative**: Find similar users and recommend their favorites
3. **Taste Match**: Compare user ratings to calculate compatibility (0-100%)

```typescript
// Calculate taste match example
const commonMovies = user1Ratings.filter(r1 =>
  user2Ratings.some(r2 => r2.movieId === r1.movieId)
);

const ratingDifferences = commonMovies.map(r1 => {
  const r2 = user2Ratings.find(r => r.movieId === r1.movieId);
  return Math.abs(r1.rating - r2!.rating);
});

const avgDifference = mean(ratingDifferences);
const tasteMatch = Math.max(0, 100 - avgDifference * 10);
```

#### 7. **Analytics**
- Monthly viewing statistics
- Genre distribution
- Rating trends
- Streak calculations
- Activity timeline

---

## Feature Implementation Checklist

### Phase 1: Core Features (Week 1-2)

#### Frontend
- [ ] Set up project structure
- [ ] Implement UI components (Button, Card, Badge, Input)
- [ ] Create layout (Header, Footer)
- [ ] Build Home page with hero section
- [ ] Implement movie card and row components
- [ ] Create movie modal with rating system
- [ ] Build Explore page with filters
- [ ] Set up routing

#### Backend
- [ ] Initialize Express server
- [ ] Connect MongoDB
- [ ] Implement user authentication
- [ ] Create movie CRUD endpoints
- [ ] Implement rating endpoints
- [ ] Add watchlist endpoints
- [ ] Set up JWT middleware
- [ ] Error handling

### Phase 2: Social & Advanced Features (Week 3-4)

#### Frontend
- [ ] Build Social page
- [ ] Implement friend list component
- [ ] Create activity feed
- [ ] Build taste match display
- [ ] Implement Dashboard with charts
- [ ] Create Profile page
- [ ] Add search functionality

#### Backend
- [ ] Implement friend request system
- [ ] Create activity feed logic
- [ ] Build recommendation engine
- [ ] Implement taste match algorithm
- [ ] Create analytics endpoints
- [ ] Add search/filter endpoints

### Phase 3: Optimization & Deployment (Week 5+)

- [ ] Performance optimization
- [ ] Security hardening
- [ ] UI/UX improvements
- [ ] Test suite
- [ ] API documentation
- [ ] Docker setup
- [ ] Deploy to hosting

---

## Team Responsibilities

### Frontend Developer
**Focus**: UI/UX and user interactions

**Tasks**:
- Build all React components
- Implement routing and navigation
- Create responsive design
- Connect to API endpoints
- Manage client-side state
- Handle form validation
- Optimize performance

**Files to work on**:
- `src/components/**`
- `src/pages/**`
- `src/store/**`
- `src/App.tsx`

### Backend Developer
**Focus**: API and data management

**Tasks**:
- Build Express API structure
- Create database models
- Implement authentication
- Handle CRUD operations
- Manage data relationships
- Implement security features
- Generate API responses

**Files to work on**:
- `backend/src/server.ts`
- `backend/src/models/**`
- `backend/src/controllers/**`
- `backend/src/routes/**`
- `backend/src/middleware/**`

### Logic & Features Developer
**Focus**: Algorithms and complex features

**Tasks**:
- Implement recommendation algorithms
- Calculate taste matching
- Generate analytics/statistics
- Design gamification system
- Optimize database queries
- Create helper functions
- Build utility services

**Files to work on**:
- `backend/src/services/**`
- `backend/src/utils/**`
- Front-end state management logic
- Recommendation algorithms

---

## Development Workflow

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/movie-cards

# Make changes and commit
git add .
git commit -m "feat: add movie card component"

# Push to remote
git push origin feature/movie-cards

# Create Pull Request on GitHub
# Code review → Merge to main
```

### Code Style
- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Comment complex logic

### Testing Checklist
Before pushing code:
- [ ] No console errors
- [ ] TypeScript compiles
- [ ] Visual appearance correct
- [ ] Responsive on mobile
- [ ] API calls working
- [ ] Error handling implemented

### Common Development Tasks

#### Adding a New API Endpoint

1. Create controller function:
```typescript
// backend/src/controllers/index.ts
export class MovieController {
  static async getTrendingMovies(req: any, res: any) {
    // Implementation
  }
}
```

2. Create route:
```typescript
// backend/src/routes/movies.ts
router.get('/trending', MovieController.getTrendingMovies);
```

3. Use in frontend:
```typescript
// src/services/api.ts
export const fetchTrendingMovies = () =>
  axios.get('/movies/trending');
```

#### Adding a New Component

1. Create component file:
```typescript
// src/components/movie/MovieCard.tsx
export const MovieCard: React.FC<Props> = (props) => {
  // JSX
};
```

2. Export from index:
```typescript
// src/components/movie/index.ts
export { MovieCard };
```

3. Use in page:
```typescript
import { MovieCard } from '../components/movie';
// Use <MovieCard />
```

---

## Resources & References

### Documentation
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [Express.js](https://expressjs.com)
- [MongoDB Docs](https://docs.mongodb.com)

### Tools
- VS Code Extensions: ESLint, Prettier, MongoDB for VS Code
- Postman for API testing
- MongoDB Compass for database visualization

### Key Libraries
- `react-router-dom`: Client-side routing
- `zustand`: State management
- `axios`: HTTP client
- `recharts`: Data visualization
- `lucide-react`: Icon library
- `clsx`: Utility for conditional classes

---

## Troubleshooting

### Common Issues

#### "Cannot find module" errors
```bash
# Install missing dependencies
npm install

# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

#### MongoDB connection issues
```bash
# Check if MongoDB is running
# Local: mongod --version
# Atlas: Check connection string in .env
```

#### CORS errors
Add to backend `server.ts`:
```typescript
app.use(cors([{
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}]));
```

#### Port already in use
```bash
# Change port in .env or kill process
# Macfrontend/Linux: lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill
# Windows: netstat -ano | findstr :5000
```

---

## Next Steps

1. **Week 1**: Complete Phase 1 checklist
2. **Week 2**: Review and test Phase 1
3. **Week 3-4**: Implement Phase 2
4. **Week 5+**: Refinement and deployment

Good luck! 🚀
