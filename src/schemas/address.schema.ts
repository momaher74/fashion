import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AddressDocument = Address & Document;

@Schema({ timestamps: true })
export class Address {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    phone: string;

    @Prop({ required: true })
    city: string;

    @Prop({ required: true })
    governorate: string;

    @Prop({ required: true })
    street: string;

    @Prop()
    notes?: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
