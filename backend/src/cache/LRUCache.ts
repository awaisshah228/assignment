interface CacheNode<T> {
  key: string;
  value: T;
  timestamp: number;
  prev: CacheNode<T> | null;
  next: CacheNode<T> | null;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
}

export class LRUCache<T> {
  private capacity: number;
  private ttl: number;
  private cache: Map<string, CacheNode<T>>;
  private head: CacheNode<T> | null;
  private tail: CacheNode<T> | null;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout;

  constructor(capacity: number = 100, ttl: number = 60000) {
    this.capacity = capacity;
    this.ttl = ttl;
    this.cache = new Map();
    this.head = null;
    this.tail = null;
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      evictions: 0,
    };

    // Background task to clean stale entries every 10 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanupStaleEntries();
    }, 10000);
  }

  private isExpired(node: CacheNode<T>): boolean {
    return Date.now() - node.timestamp > this.ttl;
  }

  private removeNode(node: CacheNode<T>): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }
  }

  private addToHead(node: CacheNode<T>): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }
  }

  private moveToHead(node: CacheNode<T>): void {
    this.removeNode(node);
    this.addToHead(node);
  }

  private evictLRU(): void {
    if (!this.tail) return;

    const key = this.tail.key;
    this.cache.delete(key);
    this.removeNode(this.tail);
    this.stats.size--;
    this.stats.evictions++;
  }

  get(key: string): T | null {
    const node = this.cache.get(key);

    if (!node) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(node)) {
      this.cache.delete(key);
      this.removeNode(node);
      this.stats.size--;
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    this.moveToHead(node);
    return node.value;
  }

  set(key: string, value: T): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // Update existing node
      existingNode.value = value;
      existingNode.timestamp = Date.now();
      this.moveToHead(existingNode);
      return;
    }

    // Create new node
    const newNode: CacheNode<T> = {
      key,
      value,
      timestamp: Date.now(),
      prev: null,
      next: null,
    };

    this.cache.set(key, newNode);
    this.addToHead(newNode);
    this.stats.size++;

    // Evict LRU if over capacity
    if (this.stats.size > this.capacity) {
      this.evictLRU();
    }
  }

  has(key: string): boolean {
    const node = this.cache.get(key);
    if (!node) return false;
    if (this.isExpired(node)) {
      this.cache.delete(key);
      this.removeNode(node);
      this.stats.size--;
      return false;
    }
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.head = null;
    this.tail = null;
    this.stats.size = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private cleanupStaleEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((node, key) => {
      if (now - node.timestamp > this.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      const node = this.cache.get(key);
      if (node) {
        this.cache.delete(key);
        this.removeNode(node);
        this.stats.size--;
      }
    });
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

