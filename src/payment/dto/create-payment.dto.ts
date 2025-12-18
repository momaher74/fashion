import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class CreatePaymentDto {
  @IsMongoId()
  @IsNotEmpty()
  orderId: string;
}

