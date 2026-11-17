const FIRST_BATCH_SIZE = 5;
const MIN_QUEUE_SIZE = 10;
const MAX_PER_BATCH = 20;

export class AudioOutputBatcher {
  private queue: string[] = [];
  private isFirstBatch = true;

  public push(chunk: string): string[] | undefined {
    this.queue.push(chunk);

    const isReady = this.isFirstBatch ? this.queue.length >= FIRST_BATCH_SIZE : this.queue.length > MIN_QUEUE_SIZE;
    if (!isReady) return undefined;

    this.isFirstBatch = false;
    return this.queue.splice(0, MAX_PER_BATCH).filter((queued) => queued);
  }

  public flush(): string[] {
    this.isFirstBatch = true;
    return this.queue.splice(0).filter((queued) => queued);
  }
}
