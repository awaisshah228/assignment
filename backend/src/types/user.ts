export interface User {
  id: number;
  name: string;
  email: string;
}

export interface CacheStatusResponse {
  cacheSize: number;
  hits: number;
  misses: number;
  hitRate: string;
  evictions: number;
  averageResponseTime: string;
}

