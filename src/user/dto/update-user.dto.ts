import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Language } from '../../common/enums/language.enum';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(Language)
  @IsOptional()
  language?: Language;

  @IsString()
  @IsOptional()
  fcmToken?: string;
}

