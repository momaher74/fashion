import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.schema';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: MongooseSchema.Types.ObjectId;

    @Prop({ required: true })
    refreshToken: string; // Hashed refresh token

    @Prop({ required: true })
    expiresAt: Date;

    @Prop()
    deviceId?: string;

    @Prop()
    deviceName?: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

// Add index for faster lookups and TTL if we want automatic deletion (optional)
// SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
