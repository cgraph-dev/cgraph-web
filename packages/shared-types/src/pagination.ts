/** Cursor-based pagination metadata from the API. */
export interface PageInfo {
  readonly has_next_page: boolean;
  readonly has_previous_page: boolean;
  readonly start_cursor: string | null;
  readonly end_cursor: string | null;
  readonly total_count?: number;
}

/** Standard paginated API response envelope. */
export interface PaginatedResponse<T> {
  readonly data: T[];
  readonly page_info: PageInfo;
}
