import { Module } from '@nestjs/common';
import { SrsModule } from '../srs/srs.module';
import { StudentController } from './student.controller';
import { StudentTodayService } from './student-today.service';

@Module({
  imports: [SrsModule],
  controllers: [StudentController],
  providers: [StudentTodayService],
})
export class StudentModule {}
