export interface ShutdownManager {
  isShuttingDown(): boolean;
  shutdown(): Promise<void>
}
