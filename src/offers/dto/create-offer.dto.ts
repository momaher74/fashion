import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsMongoId,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OfferType } from '../../common/enums/offer-type.enum';
import { OfferScope } from '../../common/enums/offer-scope.enum';

class MultilingualDto {
  @IsString()
  @IsNotEmpty()
  ar: string;

  @IsString()
  @IsNotEmpty()
  en: string;
}

export class CreateOfferDto {
  @ValidateNested()
  @Type(() => MultilingualDto)
  @IsNotEmpty()
  title: MultilingualDto;

  @IsEnum(OfferScope)
  @IsNotEmpty()
  scope: OfferScope;

  @IsMongoId()
  @IsOptional()
  productId?: string;

  @IsEnum(OfferType)
  @IsNotEmpty()
  type: OfferType;

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  value: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  image?: string;
}

