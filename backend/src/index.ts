import express, { Request, Response } from 'express';
import cors from 'cors';
import { LRUCache } from './cache/LRUCache';
import { RateLimiter } from './middleware/rateLimiter';
import { AsyncQueue } from './queue/AsyncQueue';
import { mockUsers, simulateDbCall } from './data/mockUsers';
import { User, CacheStatusResponse } from './types/user';
import { ResponseTimeTracker } from './utils/responseTracker';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize cache (60 second TTL, 100 item capacity)
const userCache = new LRUCache<User>(100, 60000);

// Initialize rate limiter (10 req/min, 5 burst in 10sec)
const rateLimiter = new RateLimiter({
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  burstRequests: 5,
  burstWindowMs: 10000, // 10 seconds
});

// Initialize async queue
const requestQueue = new AsyncQueue(10);

// Response time tracker
const responseTracker = new ResponseTimeTracker();

// Apply rate limiting to all routes
app.use(rateLimiter.middleware());

// Health check endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'User Data API with Advanced Caching',
    version: '1.0.0',
    endpoints: {
      getUser: 'GET /users/:id',
      createUser: 'POST /users',
      clearCache: 'DELETE /cache',
      cacheStatus: 'GET /cache-status',
    },
  });
});

// GET /users/:id - Retrieve user data with caching
app.get('/users/:id', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    res.status(400).json({
      error: 'Invalid user ID',
      message: 'User ID must be a number',
    });
    return;
  }

  try {
    // Check cache first
    const cachedUser = userCache.get(userId.toString());
    if (cachedUser) {
      const responseTime = Date.now() - startTime;
      responseTracker.track(responseTime);
      res.json({
        data: cachedUser,
        cached: true,
        responseTime: `${responseTime}ms`,
      });
      return;
    }

    // Use queue to handle concurrent requests efficiently
    const user = await requestQueue.enqueue(userId.toString(), async () => {
      // Check cache again in case it was populated while waiting
      const cachedWhileWaiting = userCache.get(userId.toString());
      if (cachedWhileWaiting) {
        return cachedWhileWaiting;
      }

      // Simulate database call
      const userData = mockUsers[userId];
      if (!userData) {
        throw new Error('User not found');
      }

      const result = await simulateDbCall(userData, 200);
      
      // Update cache
      userCache.set(userId.toString(), result);
      
      return result;
    });

    const responseTime = Date.now() - startTime;
    responseTracker.track(responseTime);

    res.json({
      data: user,
      cached: false,
      responseTime: `${responseTime}ms`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      res.status(404).json({
        error: 'User not found',
        message: `User with ID ${userId} does not exist`,
      });
      return;
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return;
    }
  }
});

// POST /users - Create a new user
app.post('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      res.status(400).json({
        error: 'Invalid request',
        message: 'Name and email are required',
      });
      return;
    }

    // Generate new ID
    const existingIds = Object.keys(mockUsers).map(Number);
    const newId = Math.max(...existingIds, 0) + 1;

    const newUser: User = {
      id: newId,
      name,
      email,
    };

    // Add to mock data
    mockUsers[newId] = newUser;

    // Add to cache
    userCache.set(newId.toString(), newUser);

    res.status(201).json({
      message: 'User created successfully',
      data: newUser,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
});

// DELETE /cache - Clear entire cache
app.delete('/cache', (_req: Request, res: Response): void => {
  userCache.clear();
  responseTracker.reset();

  res.json({
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString(),
  });
});

// GET /cache-status - Get cache statistics
app.get('/cache-status', (_req: Request, res: Response): void => {
  const stats = userCache.getStats();
  const totalRequests = stats.hits + stats.misses;
  const hitRate =
    totalRequests > 0 ? ((stats.hits / totalRequests) * 100).toFixed(2) : '0';

  const response: CacheStatusResponse = {
    cacheSize: stats.size,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: `${hitRate}%`,
    evictions: stats.evictions,
    averageResponseTime: `${responseTracker.getAverage().toFixed(2)}ms`,
  };

  res.json(response);
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: unknown) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Cache TTL: 60 seconds`);
  console.log(`🔒 Rate Limit: 10 requests/minute, 5 burst/10 seconds`);
  console.log(`⚡ Async Queue: Max 10 concurrent operations`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  userCache.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  userCache.destroy();
  process.exit(0);
});

