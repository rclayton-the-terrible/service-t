export interface Startable {
  name: string,
  start(): Promise<void>
}
