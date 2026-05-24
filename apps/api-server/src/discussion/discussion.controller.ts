import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { CreateDiscussionReplyDto } from './dto/create-discussion-reply.dto';
import { CreateDiscussionThreadDto } from './dto/create-discussion-thread.dto';
import { DiscussionQueryDto } from './dto/discussion-query.dto';
import { DiscussionService } from './discussion.service';

@ApiBearerAuth()
@ApiTags('discussions')
@UseGuards(JwtAuthGuard)
@Controller('discussions')
export class DiscussionController {
  constructor(private readonly discussionService: DiscussionService) {}

  @Get()
  @ApiOperation({ summary: 'List discussion threads for a lesson or practice exercise set' })
  @ApiResponse({ status: 200, description: 'Discussion threads retrieved successfully' })
  listThreads(@Query() query: DiscussionQueryDto, @Request() req: AuthenticatedRequest) {
    return this.discussionService.listThreads(getScopedTenantId(req), req.user, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a discussion thread' })
  @ApiResponse({ status: 201, description: 'Discussion thread created successfully' })
  createThread(@Body() dto: CreateDiscussionThreadDto, @Request() req: AuthenticatedRequest) {
    return this.discussionService.createThread(getScopedTenantId(req), req.user, dto);
  }

  @Post(':threadId/replies')
  @ApiOperation({ summary: 'Create a reply in a discussion thread' })
  @ApiResponse({ status: 201, description: 'Discussion reply created successfully' })
  createReply(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @Body() dto: CreateDiscussionReplyDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.discussionService.createReply(threadId, getScopedTenantId(req), req.user, dto);
  }

  @Patch(':threadId/resolve')
  @ApiOperation({ summary: 'Resolve a discussion thread' })
  @ApiResponse({ status: 200, description: 'Discussion thread resolved successfully' })
  resolveThread(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.discussionService.resolveThread(threadId, getScopedTenantId(req), req.user);
  }
}
