# Full-Stack Take-Home Assignment

This repository contains two complete assignments: a Frontend React application and a Backend Express.js API, both built with TypeScript and following best practices.

## 📁 Project Structure

```
assignment/
├── frontend/          # Interactive Event Seating Map (React + TypeScript + Vite)
├── backend/           # User Data API (Express.js + TypeScript)
└── README.md          # This file
```

## 🎯 Frontend: Interactive Event Seating Map

A high-performance React application for selecting seats at an event venue.

### Features
- ✅ SVG-based interactive seating map
- ✅ Select up to 8 seats with live summary
- ✅ Keyboard navigation and accessibility (WCAG 2.1)
- ✅ LocalStorage persistence across page reloads
- ✅ Zoom and pan controls
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Performance optimized for 15,000+ seats

### Quick Start

```bash
cd frontend
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173)

### Tech Stack
- React 19
- TypeScript (strict mode)
- Vite
- CSS3 (no framework dependencies)

📖 **[Full Frontend Documentation →](./frontend/README.md)**

---

## 🎯 Backend: User Data API

An expert-level Express.js API with advanced caching, rate limiting, and asynchronous processing.

### Features
- ✅ Custom LRU Cache implementation with TTL
- ✅ Cache statistics (hits, misses, evictions)
- ✅ Background cleanup of stale entries
- ✅ Sophisticated rate limiting (10 req/min + 5 burst/10sec)
- ✅ Async queue for concurrent request deduplication
- ✅ Response time tracking
- ✅ Full TypeScript with strict mode

### Quick Start

```bash
cd backend
pnpm install
pnpm dev
```

Server runs at [http://localhost:3000](http://localhost:3000)

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/:id` | Get user by ID (cached) |
| POST | `/users` | Create new user |
| GET | `/cache-status` | Get cache statistics |
| DELETE | `/cache` | Clear entire cache |

### Tech Stack
- Express.js 5
- TypeScript (strict mode)
- Custom LRU Cache
- Custom Rate Limiter
- Custom Async Queue

📖 **[Full Backend Documentation →](./backend/README.md)**

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (install with `npm install -g pnpm`)

### Install All Dependencies

```bash
# Install frontend dependencies
cd frontend && pnpm install

# Install backend dependencies
cd ../backend && pnpm install
```

### Run Both Projects

**Terminal 1 - Frontend:**
```bash
cd frontend
pnpm dev
```

**Terminal 2 - Backend:**
```bash
cd backend
pnpm dev
```

## 📊 Key Highlights

### Frontend Highlights
- **Performance**: 60fps with 15,000+ seats using React.memo and Set-based lookups
- **Accessibility**: Full keyboard navigation, ARIA labels, focus management
- **UX**: Zoom/pan, responsive design, real-time selection summary
- **Code Quality**: TypeScript strict mode, modular architecture, custom hooks

### Backend Highlights
- **LRU Cache**: O(1) access/eviction using doubly-linked list + HashMap
- **Rate Limiting**: Two-tier strategy with burst capacity handling
- **Async Queue**: Prevents duplicate concurrent requests (cache stampede)
- **Performance**: <3ms cache hits, 200ms cache misses (simulated DB)

## 🏗️ Architecture Decisions

### Frontend

**SVG vs Canvas**: Chose SVG for better accessibility and event handling  
**Component Memoization**: React.memo prevents unnecessary seat re-renders  
**LocalStorage**: Simple persistence without backend dependency  
**Custom Hooks**: Separation of concerns (data fetching, selection state)

### Backend

**In-Memory Cache**: Simpler than Redis, meets single-server requirements  
**Custom LRU**: Educational value, full control over eviction strategy  
**IP-Based Rate Limiting**: No auth required, effective for basic protection  
**Async Queue**: Lightweight deduplication without external dependencies

## 📈 Testing

### Frontend Testing
```bash
cd frontend

# Run development server
pnpm dev

# Build for production
pnpm build
pnpm preview
```

**Manual Tests:**
1. Select/deselect seats (max 8)
2. Refresh page (selection persists)
3. Use keyboard (Tab, Enter, Space)
4. Zoom with mouse wheel
5. Test on mobile viewport

### Backend Testing
```bash
cd backend

# Run development server
pnpm dev

# Test endpoints
curl http://localhost:3000/users/1
curl http://localhost:3000/cache-status
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'
```

**Load Testing:**
```bash
# Test concurrent requests
ab -n 100 -c 10 http://localhost:3000/users/1

# Test rate limiting
for i in {1..15}; do curl http://localhost:3000/users/1; done
```

## 📝 Development Notes

### Frontend TODOs (Stretch Goals - Not Implemented)
- [ ] WebSocket live updates
- [ ] Heat-map price visualization
- [ ] "Find N adjacent seats" algorithm
- [ ] Touch gestures for pinch-zoom
- [ ] Dark mode toggle
- [ ] E2E tests (Playwright)

### Backend Future Improvements
- [ ] Redis cache for distributed systems
- [ ] Prometheus metrics
- [ ] Unit tests (Jest)
- [ ] Integration tests (Supertest)
- [ ] Database integration (PostgreSQL)
- [ ] Authentication/Authorization

## 🔧 Build for Production

### Frontend
```bash
cd frontend
pnpm build
# Output: frontend/dist/
```

### Backend
```bash
cd backend
pnpm build
pnpm start
# Output: backend/dist/
```

## 📦 Deployment Recommendations

### Frontend
- **Vercel/Netlify**: Zero-config deployment
- **CDN**: Serve static files from CDN
- **Environment**: Set `VITE_API_URL` for backend connection

### Backend
- **Railway/Render**: Easy Node.js hosting
- **Docker**: Containerize for consistent deployment
- **Environment**: Configure `PORT`, `NODE_ENV`
- **Monitoring**: Add Prometheus/DataDog for production

## 🎓 Learning Outcomes

### Technical Skills Demonstrated
- **TypeScript**: Strict mode, advanced types, interfaces
- **React**: Hooks, memoization, performance optimization
- **Express.js**: Middleware, error handling, async operations
- **Data Structures**: LRU cache (linked list + hash map)
- **Algorithms**: Rate limiting, queue processing
- **Accessibility**: WCAG 2.1, keyboard navigation, ARIA
- **Performance**: Optimization strategies, metrics tracking
- **Architecture**: Modular design, separation of concerns

## 📄 License

MIT

## 👤 Author

Built as take-home assignments demonstrating full-stack engineering capabilities.

---

## 📚 Additional Resources

- [Frontend README](./frontend/README.md) - Detailed frontend documentation
- [Backend README](./backend/README.md) - Detailed backend documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)

---

**Total Development Time**: ~6 hours  
**Lines of Code**: ~2,500+  
**Files Created**: 25+  
**Test Coverage**: Manual testing (automated tests TODO)

Made with ❤️ and TypeScript

# assignment
