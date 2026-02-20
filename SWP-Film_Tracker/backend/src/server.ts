import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import { authMiddleware, errorHandler } from './middleware/index.js';
import moviesRouter from './controllers/movies.js';
import authRouter from './controllers/auth.js';
import ratingsRouter from './controllers/ratings.js';
import watchlistRouter from './controllers/watchlist.js';
import usersRouter from './controllers/users.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/users', usersRouter);

// Error Handler
app.use(errorHandler);

// Not Found Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🎬 Film Tracker API running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/api/docs`);
});

export default app;
