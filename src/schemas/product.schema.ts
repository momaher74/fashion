import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Multilingual } from '../common/interfaces/multilingual.interface';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: Object, required: true })
  name: Multilingual;

  @Prop({ type: Object, required: true })
  description: Multilingual;

  @Prop({ type: [String], required: true })
  images: string[];

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, default: 'EGP' })
  currency: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Size' }], default: [] })
  sizes: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Color' }], default: [] })
  colors: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubCategory', required: true })
  subCategoryId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

