import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  maxRequests: number; // Max requests per window
  windowMs: number; // Time window in ms
  burstRequests: number; // Burst capacity
  burstWindowMs: number; // Burst window in ms
}

interface ClientRecord {
  requests: number[];
  burstRequests: number[];
}

export class RateLimiter {
  private clients: Map<string, ClientRecord>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.clients = new Map();
    this.config = config;

    // Cleanup old records every minute
    setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private getClientId(req: Request): string {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  private cleanup(): void {
    const now = Date.now();
    const { windowMs, burstWindowMs } = this.config;

    this.clients.forEach((record, clientId) => {
      record.requests = record.requests.filter((t) => now - t < windowMs);
      record.burstRequests = record.burstRequests.filter(
        (t) => now - t < burstWindowMs
      );

      if (record.requests.length === 0 && record.burstRequests.length === 0) {
        this.clients.delete(clientId);
      }
    });
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const clientId = this.getClientId(req);
      const now = Date.now();

      let record = this.clients.get(clientId);
      if (!record) {
        record = { requests: [], burstRequests: [] };
        this.clients.set(clientId, record);
      }

      // Clean up old timestamps
      record.requests = record.requests.filter(
        (t) => now - t < this.config.windowMs
      );
      record.burstRequests = record.burstRequests.filter(
        (t) => now - t < this.config.burstWindowMs
      );

      // Check burst limit
      if (record.burstRequests.length >= this.config.burstRequests) {
        res.status(429).json({
          error: 'Too many requests',
          message: `Burst limit exceeded. Maximum ${this.config.burstRequests} requests in ${this.config.burstWindowMs / 1000} seconds.`,
          retryAfter: Math.ceil(
            (record.burstRequests[0] + this.config.burstWindowMs - now) / 1000
          ),
        });
        return;
      }

      // Check rate limit
      if (record.requests.length >= this.config.maxRequests) {
        res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Maximum ${this.config.maxRequests} requests per ${this.config.windowMs / 1000} seconds.`,
          retryAfter: Math.ceil(
            (record.requests[0] + this.config.windowMs - now) / 1000
          ),
        });
        return;
      }

      // Add timestamps
      record.requests.push(now);
      record.burstRequests.push(now);

      next();
    };
  }
}

