import { PartialType } from '@nestjs/swagger';
import { CreateCourseRunDto } from './create-course-run.dto';

export class UpdateCourseRunDto extends PartialType(CreateCourseRunDto) {}
