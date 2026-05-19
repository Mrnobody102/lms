import { Module } from '@nestjs/common';
import { SkillModule } from '../skill/skill.module';
import { SrsModule } from '../srs/srs.module';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';

@Module({
  imports: [SkillModule, SrsModule],
  controllers: [ExamController],
  providers: [ExamService],
})
export class ExamModule {}
