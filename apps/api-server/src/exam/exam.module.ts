import { Module } from '@nestjs/common';
import { MediaModule } from '../media/media.module';
import { SkillModule } from '../skill/skill.module';
import { SrsModule } from '../srs/srs.module';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';

@Module({
  imports: [MediaModule, SkillModule, SrsModule],
  controllers: [ExamController],
  providers: [ExamService],
})
export class ExamModule {}
