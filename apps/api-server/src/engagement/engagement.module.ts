import { Module } from '@nestjs/common';
import { AdminVideoEngagementController } from './admin-video-engagement.controller';
import { LessonVideoEngagementController } from './lesson-video-engagement.controller';
import { VideoEngagementService } from './video-engagement.service';

@Module({
  controllers: [LessonVideoEngagementController, AdminVideoEngagementController],
  providers: [VideoEngagementService],
  exports: [VideoEngagementService],
})
export class EngagementModule {}
