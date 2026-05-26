import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { CreateDiscussionReplyDto } from './dto/create-discussion-reply.dto';
import { CreateDiscussionThreadDto } from './dto/create-discussion-thread.dto';
import { DiscussionQueryDto } from './dto/discussion-query.dto';
import { UpdateDiscussionReplyDto } from './dto/update-discussion-reply.dto';
import { UpdateDiscussionThreadDto } from './dto/update-discussion-thread.dto';
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
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a discussion thread' })
  @ApiResponse({ status: 201, description: 'Discussion thread created successfully' })
  createThread(@Body() dto: CreateDiscussionThreadDto, @Request() req: AuthenticatedRequest) {
    return this.discussionService.createThread(getScopedTenantId(req), req.user, dto);
  }

  @Patch(':threadId')
  @ApiOperation({ summary: 'Update a discussion thread authored by the current user' })
  @ApiResponse({ status: 200, description: 'Discussion thread updated successfully' })
  updateThread(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @Body() dto: UpdateDiscussionThreadDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.discussionService.updateThread(threadId, getScopedTenantId(req), req.user, dto);
  }

  @Delete(':threadId')
  @ApiOperation({ summary: 'Delete a discussion thread' })
  @ApiResponse({ status: 200, description: 'Discussion thread deleted successfully' })
  deleteThread(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.discussionService.deleteThread(threadId, getScopedTenantId(req), req.user);
  }

  @Post(':threadId/replies')
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a reply in a discussion thread' })
  @ApiResponse({ status: 201, description: 'Discussion reply created successfully' })
  createReply(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @Body() dto: CreateDiscussionReplyDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.discussionService.createReply(threadId, getScopedTenantId(req), req.user, dto);
  }

  @Patch(':threadId/replies/:replyId')
  @ApiOperation({ summary: 'Update a discussion reply authored by the current user' })
  @ApiResponse({ status: 200, description: 'Discussion reply updated successfully' })
  updateReply(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @Param('replyId', ParseUUIDPipe) replyId: string,
    @Body() dto: UpdateDiscussionReplyDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.discussionService.updateReply(
      threadId,
      replyId,
      getScopedTenantId(req),
      req.user,
      dto,
    );
  }

  @Delete(':threadId/replies/:replyId')
  @ApiOperation({ summary: 'Delete a discussion reply' })
  @ApiResponse({ status: 200, description: 'Discussion reply deleted successfully' })
  deleteReply(
    @Param('threadId', ParseUUIDPipe) threadId: string,
    @Param('replyId', ParseUUIDPipe) replyId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.discussionService.deleteReply(threadId, replyId, getScopedTenantId(req), req.user);
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
