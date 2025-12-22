import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OfferType } from '../common/enums/offer-type.enum';
import { OfferScope } from '../common/enums/offer-scope.enum';
import { Multilingual } from '../common/interfaces/multilingual.interface';

export type OfferDocument = Offer & Document;

@Schema({ timestamps: true })
export class Offer {
  @Prop({ type: Object, required: true })
  title: Multilingual;

  @Prop()
  image?: string;

  @Prop({ type: String, enum: OfferScope, required: true })
  scope: OfferScope;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: false })
  productId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: false })
  categoryId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubCategory', required: false })
  subCategoryId?: Types.ObjectId;

  @Prop({ type: String, enum: OfferType, required: true })
  type: OfferType;

  @Prop({ required: true, min: 0 })
  value: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);

