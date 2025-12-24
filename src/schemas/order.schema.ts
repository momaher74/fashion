import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../common/enums/order-status.enum';
import { PaymentMethod } from '../common/enums/payment-method.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { OrderItem, OrderItemSchema } from './order-item.schema';
import { ShippingType } from '../common/enums/shipping-type.enum';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop()
  paymentTransactionId?: string;

  @Prop({ type: Object })
  shippingAddress: {
    name: string;
    phone: string;
    city: string;
    governorate: string;
    country: string;
    street: string;
    notes?: string;
  };

  @Prop({ type: String, enum: ShippingType, default: ShippingType.NORMAL })
  shippingType: ShippingType;

  @Prop()
  notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

