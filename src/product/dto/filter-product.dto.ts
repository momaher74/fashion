import { IsOptional, IsString, IsNumber, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Language } from '../../common/enums/language.enum';

export class FilterProductDto {
  @IsOptional()
  @IsString()
  categoryId?: string; // Category ObjectId

  @IsOptional()
  @IsString()
  subCategoryId?: string; // SubCategory ObjectId

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

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
}

