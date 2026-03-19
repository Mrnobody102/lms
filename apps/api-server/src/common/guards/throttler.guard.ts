import { Injectable } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerException, ThrottlerLimitDetail } from "@nestjs/throttler";
import { ExecutionContext } from "@nestjs/common";

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(_context: ExecutionContext, _throttlerLimitDetail: ThrottlerLimitDetail): Promise<void> {
    throw new ThrottlerException("Too many requests, please slow down");
  }
}
