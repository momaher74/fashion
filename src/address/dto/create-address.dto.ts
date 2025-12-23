import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAddressDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    phone: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    governorate: string;

    @IsString()
    @IsNotEmpty()
    street: string;

    @IsString()
    @IsOptional()
    notes?: string;
}
