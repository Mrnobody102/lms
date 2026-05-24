import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@repo/database';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { AdaptiveLearningService } from './adaptive-learning.service';
import { AdaptiveLearningQueryDto } from './dto/adaptive-learning-query.dto';
import { UpdateAdaptivePathStatusDto } from './dto/update-adaptive-path-status.dto';

@ApiTags('adaptive-learning')
@ApiBearerAuth()
@Controller('adaptive-learning')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdaptiveLearningController {
  constructor(private readonly adaptiveLearningService: AdaptiveLearningService) {}

  @Get('path')
  @Roles(Role.STUDENT, Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'List adaptive learning path items for a learner' })
  listPath(@Query() query: AdaptiveLearningQueryDto, @Request() req: AuthenticatedRequest) {
    return this.adaptiveLearningService.listPath(getScopedTenantId(req), req.user, query);
  }

  @Get('next')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get the next adaptive practice recommendation' })
  getNext(@Query('courseId') courseId: string | undefined, @Request() req: AuthenticatedRequest) {
    return this.adaptiveLearningService.getNext(getScopedTenantId(req), req.user, courseId);
  }

  @Patch('path/:id/status')
  @Roles(Role.STUDENT, Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Update adaptive path item status' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdaptivePathStatusDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.adaptiveLearningService.updateStatus(
      getScopedTenantId(req),
      req.user,
      id,
      dto.status,
    );
  }
}
