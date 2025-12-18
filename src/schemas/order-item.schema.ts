import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Multilingual } from '../common/interfaces/multilingual.interface';

export type OrderItemDocument = OrderItem & Document;

@Schema()
export class OrderItem {
  @Prop({ required: true })
  productId: string;

  @Prop({ type: Object, required: true })
  name: Multilingual;

  @Prop({ type: Object, required: true })
  description: Multilingual;

  @Prop({ type: [String], required: true })
  images: string[];

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  finalPrice: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  size: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  quantity: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

