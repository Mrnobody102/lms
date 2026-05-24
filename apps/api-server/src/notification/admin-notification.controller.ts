import { Body, Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { Role } from '@repo/database';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { NotificationService } from './notification.service';
import { BroadcastNotificationDto } from './dto/broadcast.dto';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@UseInterceptors(TransformInterceptor)
export class AdminNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('broadcast')
  async broadcast(
    @CurrentUser() admin: { id: string; tenantId: string },
    @Body() dto: BroadcastNotificationDto,
  ) {
    return this.notificationService.broadcast(admin.tenantId, dto);
  }
}
