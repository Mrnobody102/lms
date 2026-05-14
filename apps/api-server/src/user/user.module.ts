import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserSessionController } from './user-session.controller';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [UserController, UserSessionController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
