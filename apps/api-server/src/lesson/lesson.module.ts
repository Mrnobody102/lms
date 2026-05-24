import { Module } from '@nestjs/common';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { SrsModule } from '../srs/srs.module';

@Module({
  imports: [SrsModule],
  controllers: [LessonController],
  providers: [LessonService],
})
export class LessonModule {}
