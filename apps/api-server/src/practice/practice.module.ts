import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { MediaModule } from '../media/media.module';
import { SkillModule } from '../skill/skill.module';
import { SrsModule } from '../srs/srs.module';
import { AiEvaluationService } from './ai-evaluation.service';
import { AiQuestionGenerationService } from './ai-question-generation.service';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';

@Module({
  imports: [AiModule, MediaModule, SkillModule, SrsModule],
  controllers: [PracticeController],
  providers: [AiEvaluationService, AiQuestionGenerationService, PracticeService],
})
export class PracticeModule {}
