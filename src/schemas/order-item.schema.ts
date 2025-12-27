import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Multilingual } from '../common/interfaces/multilingual.interface';

export type OrderItemDocument = OrderItem & Document;

@Schema()
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

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

  @Prop({ type: Types.ObjectId, ref: 'Size', required: true })
  size: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Color', required: true })
  color: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

