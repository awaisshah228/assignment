export class ResponseTimeTracker {
  private responseTimes: number[];
  private maxSamples: number;

  constructor(maxSamples: number = 1000) {
    this.responseTimes = [];
    this.maxSamples = maxSamples;
  }

  track(timeMs: number): void {
    this.responseTimes.push(timeMs);
    if (this.responseTimes.length > this.maxSamples) {
      this.responseTimes.shift();
    }
  }

  getAverage(): number {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.responseTimes.length;
  }

  reset(): void {
    this.responseTimes = [];
  }
}

