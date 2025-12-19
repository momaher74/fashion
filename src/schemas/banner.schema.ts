import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Multilingual } from '../common/interfaces/multilingual.interface';

export type BannerDocument = Banner & Document;

@Schema({ timestamps: true })
export class Banner {
  @Prop({ type: Object, required: true })
  title: Multilingual;

  @Prop({ type: Object })
  description?: Multilingual;

  @Prop({ required: true })
  image: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: false })
  categoryId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubCategory', required: false })
  subCategoryId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: false })
  productId?: Types.ObjectId;

  @Prop({ default: 0 })
  order: number; // For ordering banners

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  link?: string; // Optional external link

  @Prop({ default: Date.now })
  startDate?: Date;

  @Prop()
  endDate?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);
