import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActivationService } from './activation.service';
import { CreateActivationCodeDto } from './dto/create-activation-code.dto';
import { RedeemActivationCodeDto } from './dto/redeem-activation-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@repo/database';
import { Request } from '@nestjs/common';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';

@ApiTags('Activation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activation')
export class ActivationController {
  constructor(private readonly activationService: ActivationService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new activation code (Admin only)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Activation code created successfully' })
  async create(@Body() createDto: CreateActivationCodeDto, @Request() req: AuthenticatedRequest) {
    return this.activationService.create(createDto, getScopedTenantId(req));
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all activation codes (Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of activation codes' })
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.activationService.findAll(getScopedTenantId(req));
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a specific activation code details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Activation code details' })
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.activationService.findOne(id, getScopedTenantId(req));
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete an activation code' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Activation code deleted' })
  async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.activationService.softDelete(id, getScopedTenantId(req));
  }

  @Post('redeem')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.STUDENT, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Redeem an activation code' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Code redeemed successfully' })
  async redeem(@Body() redeemDto: RedeemActivationCodeDto, @Request() req: AuthenticatedRequest) {
    return this.activationService.redeem(redeemDto, req.user.id, getScopedTenantId(req));
  }
}
