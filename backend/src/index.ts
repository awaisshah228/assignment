import express, { Request, Response } from 'express';
import cors from 'cors';
import { LRUCache } from './cache/LRUCache';
import { RateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { AsyncQueue } from './queue/AsyncQueue';
import { mockUsers, simulateDbCall } from './data/mockUsers';
import { User, CacheStatusResponse } from './types/user';
import { ResponseTimeTracker } from './utils/responseTracker';
import { NotFoundError } from './errors/not-found-error';
import { BadRequestError } from './errors/bad-request-error';
import { ValidationError } from './errors/validation-error';

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
      testAsyncError: 'GET /test-async-error',
    },
  });
});

// Test endpoint: intentionally trigger an async error
app.get('/test-async-error', async (_req: Request, _res: Response): Promise<void> => {
  await new Promise((_resolve, reject) =>
    setTimeout(() => reject(new BadRequestError('Async test error (expected)')), 10)
  );
});

// GET /users/:id - Retrieve user data with caching
app.get('/users/:id', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const userId = parseInt(req.params.id, 10);

  if (isNaN(userId)) {
    throw new BadRequestError('User ID must be a number');
  }

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
      throw new NotFoundError(`User with ID ${userId} does not exist`);
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
});

// POST /users - Create a new user
app.post('/users', async (req: Request, res: Response): Promise<void> => {
  const { name, email } = req.body;

  const errors = [];
  if (!name) errors.push({ field: 'name', message: 'Name is required' });
  if (!email) errors.push({ field: 'email', message: 'Email is required' });

  if (errors.length > 0) {
    throw new ValidationError(errors);
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

// 404 handler
app.use((_req: Request, _res: Response) => {
  throw new NotFoundError('The requested endpoint does not exist');
});

// Error handling middleware (must be last)
app.use(errorHandler);

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

