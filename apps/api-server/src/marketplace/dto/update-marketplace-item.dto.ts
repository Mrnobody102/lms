import { PartialType } from '@nestjs/swagger';
import { CreateMarketplaceItemDto } from './create-marketplace-item.dto';

export class UpdateMarketplaceItemDto extends PartialType(CreateMarketplaceItemDto) {}
