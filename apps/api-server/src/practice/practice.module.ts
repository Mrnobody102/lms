import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AiEvaluationService } from './ai-evaluation.service';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';

@Module({
  imports: [AiModule],
  controllers: [PracticeController],
  providers: [AiEvaluationService, PracticeService],
})
export class PracticeModule {}
