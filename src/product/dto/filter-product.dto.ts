import { IsOptional, IsString, IsNumber, IsArray, Min, IsEnum, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductSort } from '../../common/enums/product-sort.enum';

export class FilterProductDto {
  @IsOptional()
  @IsMongoId()
  categoryId?: string; // Singular for backward compatibility

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categoryIds?: string[];

  @IsOptional()
  @IsMongoId()
  subCategoryId?: string; // Singular for backward compatibility

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  subCategoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  sizes?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  colors?: string[];

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  offerIds?: string[]; // For filtering by specific discounts/offers

  @IsOptional()
  @IsEnum(ProductSort)
  sortBy?: ProductSort;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  rating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

