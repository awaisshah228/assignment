interface QueueTask<T> {
  id: string;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export class AsyncQueue {
  private queue: QueueTask<unknown>[];
  private processing: Map<string, Promise<unknown>>;
  private maxConcurrent: number;
  private currentlyProcessing: number;

  constructor(maxConcurrent: number = 10) {
    this.queue = [];
    this.processing = new Map();
    this.maxConcurrent = maxConcurrent;
    this.currentlyProcessing = 0;
  }

  async enqueue<T>(id: string, fn: () => Promise<T>): Promise<T> {
    // If already processing this ID, wait for it
    const existingTask = this.processing.get(id);
    if (existingTask) {
      return existingTask as Promise<T>;
    }

    return new Promise<T>((resolve, reject) => {
      const task: QueueTask<T> = {
        id,
        fn,
        resolve,
        reject,
      };

      this.queue.push(task as QueueTask<unknown>);
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (
      this.currentlyProcessing >= this.maxConcurrent ||
      this.queue.length === 0
    ) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.currentlyProcessing++;

    const promise = (async () => {
      try {
        const result = await task.fn();
        task.resolve(result);
        return result;
      } catch (error) {
        task.reject(
          error instanceof Error ? error : new Error('Unknown error')
        );
        throw error;
      } finally {
        this.processing.delete(task.id);
        this.currentlyProcessing--;
        this.processQueue();
      }
    })();

    this.processing.set(task.id, promise);
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      processing: this.currentlyProcessing,
      pending: this.processing.size,
    };
  }
}

