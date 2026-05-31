import { Module } from '@nestjs/common';
import { SkillModule } from '../skill/skill.module';
import { AiGatewayService } from './ai-gateway.service';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AI_PROVIDER_TOKEN } from './interfaces/ai-provider.interface';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';

@Module({
  imports: [SkillModule],
  controllers: [AiController],
  providers: [
    AiGatewayService,
    AiService,
    {
      provide: AI_PROVIDER_TOKEN,
      useClass: process.env.AI_PROVIDER === 'groq' ? GroqProvider : GeminiProvider,
    },
  ],
  exports: [AiGatewayService, AiService],
})
export class AiModule {}
