import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsMongoId,
  Min,
} from 'class-validator';

export class AddToCartDto {
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @IsMongoId()
  @IsNotEmpty()
  size: string; // Size ObjectId

  @IsMongoId()
  @IsNotEmpty()
  color: string; // Color ObjectId

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;
}

