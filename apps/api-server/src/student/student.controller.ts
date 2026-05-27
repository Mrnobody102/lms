import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { StudentTodayService } from './student-today.service';

@ApiBearerAuth()
@ApiTags('student')
@Controller('student')
@UseGuards(JwtAuthGuard)
export class StudentController {
  constructor(private readonly todayService: StudentTodayService) {}

  @Get('today')
  @ApiOperation({ summary: 'Get the current student task queue for today' })
  getToday(@Request() req: AuthenticatedRequest) {
    return this.todayService.getToday(getScopedTenantId(req), req.user);
  }
}
