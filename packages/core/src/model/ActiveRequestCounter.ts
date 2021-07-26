/**
 * This is not a general purpose metrics interface.
 * It's only purpose is to keep track of active requests
 * so we can perform clean shutdowns of the server.
 */
export interface ActiveRequestCounter {
  numActive: number,
}
