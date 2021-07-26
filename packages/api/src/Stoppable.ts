export interface Stoppable {
  name: string,
  stop(): Promise<void>
}
