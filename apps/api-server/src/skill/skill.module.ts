import { Module } from '@nestjs/common';
import { SkillController } from './skill.controller';
import { SkillMasteryService } from './skill-mastery.service';
import { SkillService } from './skill.service';

@Module({
  controllers: [SkillController],
  providers: [SkillService, SkillMasteryService],
  exports: [SkillService, SkillMasteryService],
})
export class SkillModule {}
