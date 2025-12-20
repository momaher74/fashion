import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Multilingual } from '../common/interfaces/multilingual.interface';
import { ProductType } from '../common/enums/product-type.enum';
import { SizeDocument } from './size.schema';
import { ColorDocument } from './color.schema';

export type ProductDocument = Product & Document;

@Schema({ _id: false })
export class ProductVariant {
  @Prop({ type: Types.ObjectId, ref: 'Size', required: true })
  sizeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Color', required: true })
  colorId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  stock: number;

  @Prop({ min: 0 })
  price?: number; // Optional price override for this variant
}

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
  sizes: Types.ObjectId[] | SizeDocument[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Color' }], default: [] })
  colors: Types.ObjectId[] | ColorDocument[];

  @Prop({ type: [ProductVariant], default: [] })
  variants: ProductVariant[];

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubCategory', required: true })
  subCategoryId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: String,
    enum: ProductType,
    default: ProductType.NORMAL,
  })
  type: ProductType;

  @Prop({ default: 0 })
  views: number; // Track product views for popularity

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

