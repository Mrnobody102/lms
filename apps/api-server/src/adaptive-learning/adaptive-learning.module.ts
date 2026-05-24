import { Module } from '@nestjs/common';
import { AdaptiveLearningController } from './adaptive-learning.controller';
import { AdaptiveLearningService } from './adaptive-learning.service';

@Module({
  controllers: [AdaptiveLearningController],
  providers: [AdaptiveLearningService],
  exports: [AdaptiveLearningService],
})
export class AdaptiveLearningModule {}
