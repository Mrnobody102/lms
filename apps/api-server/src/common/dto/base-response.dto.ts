export class BaseResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class PaginatedResponse<T> extends BaseResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
