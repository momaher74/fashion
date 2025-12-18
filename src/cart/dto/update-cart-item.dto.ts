import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;
}

