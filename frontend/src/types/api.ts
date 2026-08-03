export interface ApiErrorBody {
  error: {
    message: string;
    details?: unknown;
  };
}
