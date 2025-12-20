import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsObject } from 'class-validator';
import { Multilingual } from '../../common/interfaces/multilingual.interface';

export class CreateBannerDto {
    @IsObject()
    title: Multilingual;

    @IsOptional()
    @IsObject()
    description?: Multilingual;

    @IsOptional()
    @IsString()
    image?: string; // Can be provided as URL or will be populated from file upload

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsString()
    subCategoryId?: string;

    @IsOptional()
    @IsString()
    productId?: string;

    @IsOptional()
    @IsNumber()
    order?: number;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    link?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}
