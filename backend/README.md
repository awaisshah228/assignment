# Expert-Level Express.js API: User Data with Advanced Caching

A high-performance Express.js API featuring an LRU cache implementation, sophisticated rate limiting with burst capacity, and asynchronous queue processing for handling concurrent requests efficiently.

## Features

- **LRU Cache Implementation**: Custom Least Recently Used cache with TTL support
- **Cache Statistics**: Track hits, misses, evictions, and cache size
- **Background Cleanup**: Automatic stale entry removal
- **Rate Limiting**: 10 requests/minute with 5-request burst capacity in 10 seconds
- **Asynchronous Queue**: Prevents duplicate concurrent requests for the same resource
- **Response Time Tracking**: Monitor API performance metrics
- **TypeScript**: Full type safety with strict mode enabled
- **Error Handling**: Comprehensive error responses with meaningful messages

## Quick Start

```bash
pnpm install
pnpm dev
```

The server will start at `http://localhost:3000`

## Production Build

```bash
pnpm build
pnpm start
```

## API Endpoints

### 1. GET /users/:id

Retrieve user data by ID with intelligent caching.

**Request:**
```bash
curl http://localhost:3000/users/1
```

**Response (Cache Miss):**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "cached": false,
  "responseTime": "205ms"
}
```

**Response (Cache Hit):**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "cached": true,
  "responseTime": "2ms"
}
```

**Error Response (404):**
```json
{
  "error": "User not found",
  "message": "User with ID 999 does not exist"
}
```

### 2. POST /users

Create a new user.

**Request:**
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Bob Wilson", "email": "bob@example.com"}'
```

**Response:**
```json
{
  "message": "User created successfully",
  "data": {
    "id": 4,
    "name": "Bob Wilson",
    "email": "bob@example.com"
  }
}
```

### 3. GET /cache-status

Get comprehensive cache statistics.

**Request:**
```bash
curl http://localhost:3000/cache-status
```

**Response:**
```json
{
  "cacheSize": 3,
  "hits": 45,
  "misses": 12,
  "hitRate": "78.95%",
  "evictions": 0,
  "averageResponseTime": "23.45ms"
}
```

### 4. DELETE /cache

Clear the entire cache.

**Request:**
```bash
curl -X DELETE http://localhost:3000/cache
```

**Response:**
```json
{
  "message": "Cache cleared successfully",
  "timestamp": "2025-10-30T12:00:00.000Z"
}
```

## Rate Limiting

The API implements a sophisticated two-tier rate limiting strategy:

### Primary Rate Limit
- **Limit**: 10 requests per minute
- **Window**: 60 seconds
- **Scope**: Per IP address

### Burst Capacity
- **Limit**: 5 requests
- **Window**: 10 seconds
- **Use Case**: Allows short bursts of traffic while preventing abuse

### Rate Limit Response (429)
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Maximum 10 requests per 60 seconds.",
  "retryAfter": 45
}
```

## Architecture

### Project Structure

```
src/
├── cache/
│   └── LRUCache.ts           # LRU cache implementation
├── middleware/
│   └── rateLimiter.ts        # Rate limiting middleware
├── queue/
│   └── AsyncQueue.ts         # Async request queue
├── data/
│   └── mockUsers.ts          # Mock user database
├── types/
│   └── user.ts               # TypeScript interfaces
├── utils/
│   └── responseTracker.ts    # Performance monitoring
└── index.ts                  # Main server file
```

### Key Components

#### 1. LRU Cache (`LRUCache.ts`)

**Strategy**: Least Recently Used with Time-To-Live

**Features**:
- Doubly-linked list for O(1) access and eviction
- HashMap for O(1) key lookup
- Automatic TTL expiration (60 seconds)
- Background cleanup task (runs every 10 seconds)
- Comprehensive statistics tracking

**Implementation Details**:
- **Capacity**: 100 items (configurable)
- **TTL**: 60 seconds (configurable)
- **Eviction**: LRU item removed when capacity exceeded
- **Cleanup**: Stale entries removed automatically

**Trade-offs**:
- **Pros**: Fast access, predictable memory usage, automatic cleanup
- **Cons**: Memory overhead from linked list pointers
- **Alternative**: Redis for distributed caching (not needed for this use case)

#### 2. Rate Limiter (`rateLimiter.ts`)

**Strategy**: Token bucket with burst capacity

**Implementation**:
- Sliding window per client (IP-based)
- Separate tracking for burst and standard limits
- Automatic cleanup of old client records

**How It Works**:
1. Each request timestamp is stored
2. Old timestamps outside the window are removed
3. Burst limit checked first (5 in 10 sec)
4. Then standard limit checked (10 in 60 sec)
5. Request rejected if either limit exceeded

**Trade-offs**:
- **Pros**: Fair, handles burst traffic, IP-based tracking
- **Cons**: Memory usage grows with unique IPs
- **Alternative**: Redis-based rate limiting for multi-server setups

#### 3. Async Queue (`AsyncQueue.ts`)

**Strategy**: Request deduplication with concurrent limit

**Features**:
- Prevents duplicate concurrent requests for same resource
- Limits concurrent operations (max 10)
- Automatic queue processing
- Promise-based API

**How It Works**:
1. Request for user ID arrives
2. Check if same ID is already being fetched
3. If yes, wait for existing request and return same result
4. If no, add to queue and process when capacity available
5. Result shared among all waiting requests

**Benefits**:
- Reduces database load
- Prevents cache stampede
- Improves response time for concurrent requests

**Trade-offs**:
- **Pros**: Efficient resource usage, cache stampede prevention
- **Cons**: Slight latency for queued requests
- **Alternative**: Worker threads for CPU-intensive tasks

#### 4. Response Time Tracker (`responseTracker.ts`)

**Strategy**: Rolling average with sample limit

**Features**:
- Tracks last 1000 response times
- Calculates average response time
- Lightweight memory usage

## Performance Characteristics

### Cache Performance
- **Cache Hit**: ~1-3ms response time
- **Cache Miss**: ~200-210ms (includes DB simulation)
- **Memory**: ~1KB per cached user
- **Capacity**: 100 users (configurable)

### Rate Limiting
- **Overhead**: <1ms per request
- **Memory**: ~100 bytes per unique IP
- **Cleanup**: Runs every 60 seconds

### Concurrent Request Handling
- **Max Concurrent**: 10 simultaneous operations
- **Queue Processing**: Automatic, non-blocking
- **Duplicate Prevention**: Same ID requests share result

## Testing Guide

### 1. Basic Functionality Test

```bash
# Test user retrieval (cache miss)
curl http://localhost:3000/users/1

# Test again (cache hit - should be faster)
curl http://localhost:3000/users/1

# Test non-existent user
curl http://localhost:3000/users/999

# Create new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'
```

### 2. Cache Statistics Test

```bash
# Make several requests
for i in {1..10}; do curl http://localhost:3000/users/1; done

# Check cache status
curl http://localhost:3000/cache-status

# Clear cache
curl -X DELETE http://localhost:3000/cache

# Verify cache cleared
curl http://localhost:3000/cache-status
```

### 3. Rate Limiting Test

```bash
# Test burst limit (5 requests in 10 seconds)
for i in {1..6}; do 
  curl http://localhost:3000/users/1
  echo ""
done

# Test rate limit (10 requests in 60 seconds)
for i in {1..15}; do 
  curl http://localhost:3000/users/$i
  echo ""
  sleep 2
done
```

### 4. Concurrent Request Test

Use Apache Bench or similar tool:

```bash
# Install Apache Bench (if not installed)
# macOS: brew install httpd
# Ubuntu: apt-get install apache2-utils

# Test 100 concurrent requests to same user
ab -n 100 -c 10 http://localhost:3000/users/1

# Check queue statistics
curl http://localhost:3000/cache-status
```

### 5. Performance Measurement

Using `curl` with timing:

```bash
# First request (cache miss)
curl -w "@-" -o /dev/null -s http://localhost:3000/users/1 <<'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
   time_pretransfer:  %{time_pretransfer}\n
      time_redirect:  %{time_redirect}\n
 time_starttransfer:  %{time_starttransfer}\n
                    ----------\n
         time_total:  %{time_total}\n
EOF

# Second request (cache hit)
curl -w "@-" -o /dev/null -s http://localhost:3000/users/1 <<'EOF'
         time_total:  %{time_total}\n
EOF
```

## Monitoring (Bonus Feature)

### Simple Logging

The server logs key events:
- Server start/stop
- Request processing
- Cache operations
- Rate limit violations

### Production Monitoring (Not Implemented)

For production, consider implementing:

**Prometheus Integration:**
```typescript
import promClient from 'prom-client';

const cacheHitCounter = new promClient.Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
});

const responseTimeHistogram = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration',
  buckets: [10, 50, 100, 200, 500, 1000],
});
```

**Metrics to Track:**
- Request rate (requests/sec)
- Response time (p50, p95, p99)
- Cache hit rate
- Error rate
- Queue length
- Memory usage

## Error Handling

All errors return consistent JSON responses:

```json
{
  "error": "Error category",
  "message": "Detailed error message"
}
```

**HTTP Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad request (invalid input)
- `404`: Not found
- `429`: Too many requests (rate limit)
- `500`: Internal server error

## Environment Variables

```bash
PORT=3000                  # Server port
NODE_ENV=development       # Environment
```

## Dependencies

**Production:**
- `express` (^5.1.0): Web framework
- `cors` (^2.8.5): CORS middleware

**Development:**
- `typescript` (^5.9.3): TypeScript compiler
- `@types/node`: Node.js type definitions
- `@types/express`: Express type definitions
- `@types/cors`: CORS type definitions
- `ts-node` (^10.9.2): TypeScript execution
- `nodemon` (^3.1.10): Development auto-reload

## Design Decisions & Trade-offs

### 1. In-Memory Cache vs Redis
**Decision**: In-memory LRU cache  
**Rationale**: 
- Simpler implementation
- Lower latency (no network overhead)
- Sufficient for single-server deployment
- Meets assignment requirements

**Trade-off**: Not suitable for multi-server deployments

### 2. IP-Based Rate Limiting
**Decision**: Use IP address as client identifier  
**Rationale**:
- No authentication required
- Simple to implement
- Effective against basic abuse

**Trade-off**: Multiple users behind same NAT share limits

### 3. Custom Queue vs Bull
**Decision**: Custom AsyncQueue implementation  
**Rationale**:
- Lightweight (no Redis dependency)
- Sufficient for deduplication use case
- Educational value

**Trade-off**: Bull offers more features (persistence, scheduling)

### 4. Mock Database vs Real Database
**Decision**: In-memory mock object  
**Rationale**:
- Assignment requirement
- Simpler setup
- Focuses on caching/rate-limiting logic

**Trade-off**: Not production-ready

## Future Improvements

- [ ] Add authentication/authorization
- [ ] Implement request validation with Zod
- [ ] Add unit tests (Jest)
- [ ] Add integration tests (Supertest)
- [ ] Implement Prometheus metrics
- [ ] Add request logging (Winston/Pino)
- [ ] Database integration (PostgreSQL)
- [ ] Redis cache for distributed systems
- [ ] GraphQL API alternative
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] API documentation (Swagger/OpenAPI)

## License

MIT

## Author

Built as an expert-level take-home assignment demonstrating advanced Express.js patterns.

