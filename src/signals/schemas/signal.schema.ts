import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Signal extends Document {

  @Prop({ required: true })
  deviceId: string;

  @Prop({ type: [[Number, [Number, Number, Number]]], required: true })
  data: Array<[number, [number, number, number]]>;

  @Prop({ required: true })
  time: number;
  
}