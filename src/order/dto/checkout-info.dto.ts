import { IsNumber, IsNotEmpty, IsEnum } from 'class-validator';
import { ShippingType } from '../../common/enums/shipping-type.enum';
import { PaymentMethod } from '../../common/enums/payment-method.enum';

export class CheckoutInfoDto {
    @IsEnum(ShippingType)
    @IsNotEmpty()
    shippingType: ShippingType;

    @IsEnum(PaymentMethod)
    @IsNotEmpty()
    paymentMethod: PaymentMethod;
}
