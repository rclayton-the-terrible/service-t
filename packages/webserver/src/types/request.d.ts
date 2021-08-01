declare global {
  namespace Express {
    interface Request {
      id: string,
    }
    interface Response {
      locals: {
        deps?: Record<string, unknown>,
      }
    }
  }
}
