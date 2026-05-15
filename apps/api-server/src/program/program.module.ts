import { Module } from '@nestjs/common';
import { ProgramService } from './program.service';
import { ProgramController } from './program.controller';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [ProgramController],
  providers: [ProgramService, PrismaService],
  exports: [ProgramService],
})
export class ProgramModule {}
