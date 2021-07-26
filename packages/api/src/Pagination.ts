export type PaginationOptions = {
  offset?: number,
  limit?: number,
}

export type PaginatedSet<T> = {
  offset: number,
  limit: number,
  total: number,
  items: Array<T>,
}
