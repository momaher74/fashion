import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Multilingual } from '../common/interfaces/multilingual.interface';

export type StoryDocument = Story & Document;

export enum StoryMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

@Schema({ timestamps: true })
export class Story {
  @Prop({ type: Object, required: false })
  title?: Multilingual;

  @Prop({ required: true })
  mediaUrl: string;

  @Prop({ type: String, enum: StoryMediaType, required: true })
  mediaType: StoryMediaType;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: false })
  categoryId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SubCategory', required: false })
  subCategoryId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: false })
  productId?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  seenBy: Types.ObjectId[];

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);
