import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from '../../common/enums/product-type.enum';

class MultilingualDto {
  @IsString()
  @IsNotEmpty()
  ar: string;

  @IsString()
  @IsNotEmpty()
  en: string;
}

class ProductVariantDto {
  @IsString()
  @IsNotEmpty()
  sizeId: string;

  @IsString()
  @IsNotEmpty()
  colorId: string;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;
}

export class CreateProductDto {
  @ValidateNested()
  @Type(() => MultilingualDto)
  @IsNotEmpty()
  name: MultilingualDto;

  @ValidateNested()
  @Type(() => MultilingualDto)
  @IsNotEmpty()
  description: MultilingualDto;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  images: string[];

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizes?: string[]; // Array of Size ObjectIds

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  colors?: string[]; // Array of Color ObjectIds

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  @IsOptional()
  variants?: ProductVariantDto[];

  @IsString()
  @IsNotEmpty()
  categoryId: string; // Category ObjectId

  @IsString()
  @IsNotEmpty()
  subCategoryId: string; // SubCategory ObjectId

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;
}

