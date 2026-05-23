import { Controller, Get, Param, Patch, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: { id: string; tenantId: string },
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationService.getUserNotifications(
      user.tenantId,
      user.id,
      query.skip,
      query.take,
    );
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: { id: string; tenantId: string }) {
    await this.notificationService.markAllAsRead(user.tenantId, user.id);
    return { success: true };
  }

  @Patch(':id/read')
  async markAsRead(@CurrentUser() user: { id: string; tenantId: string }, @Param('id') id: string) {
    return this.notificationService.markAsRead(user.tenantId, user.id, id);
  }
}
