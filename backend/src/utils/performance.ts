export class PerformanceTimer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
  }

  end(): void {
    const duration = performance.now() - this.startTime;
    console.log(`[PERF] ${this.label}: ${duration.toFixed(2)}ms`);
  }
}
