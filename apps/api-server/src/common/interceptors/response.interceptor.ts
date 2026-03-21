import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

interface WrappedResponse<T> {
  success: boolean;
  data?: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, WrappedResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<WrappedResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Always wrap consistently so the api-client can always unwrap the same way.
        // For paginated responses, data is already { data: T, meta: {...} }, so spread it.
        if (data && typeof data === "object" && "data" in data && "meta" in data) {
          return { success: true, ...(data as object) } as WrappedResponse<T>;
        }
        return { success: true, data };
      }),
    );
  }
}
