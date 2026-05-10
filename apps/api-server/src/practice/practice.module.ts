import { Module } from '@nestjs/common';
import { AiEvaluationService } from './ai-evaluation.service';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';

@Module({
  controllers: [PracticeController],
  providers: [AiEvaluationService, PracticeService],
})
export class PracticeModule {}
