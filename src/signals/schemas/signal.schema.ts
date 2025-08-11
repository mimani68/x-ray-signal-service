import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Signal extends Document {
    @Prop({ required: true })
    content: string;

    @Prop({ default: Date.now })
    timestamp: Date;
}

export const SignalSchema = SchemaFactory.createForClass(Signal);