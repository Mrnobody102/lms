import { Module } from '@nestjs/common';
import { SkillModule } from '../skill/skill.module';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';

@Module({
  imports: [SkillModule],
  controllers: [ExamController],
  providers: [ExamService],
})
export class ExamModule {}
