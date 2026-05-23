import { Controller, Get, Param, Patch, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
@UseInterceptors(TransformInterceptor)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: { id: string; tenantId: string },
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.notificationService.getUserNotifications(
      user.tenantId,
      user.id,
      skip ? parseInt(skip, 10) : 0,
      take ? parseInt(take, 10) : 20,
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
