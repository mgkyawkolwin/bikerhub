export class PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;

  constructor(items: T[], page: number, pageSize: number, total: number) {
    this.items = items;
    this.page = page;
    this.pageSize = pageSize;
    this.total = total;
    this.totalPages = Math.max(1, Math.ceil(total / pageSize));
  }
}
