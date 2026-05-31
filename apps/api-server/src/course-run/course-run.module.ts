import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { LearningAccessService } from '../common/services/learning-access.service';
import { CourseRunController } from './course-run.controller';
import { CourseRunService } from './course-run.service';

@Module({
  imports: [PrismaModule],
  controllers: [CourseRunController],
  providers: [CourseRunService, LearningAccessService],
  exports: [CourseRunService],
})
export class CourseRunModule {}
