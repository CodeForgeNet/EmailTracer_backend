import * as mongoose from 'mongoose';
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Email extends Document {
  @Prop({ type: String, required: true, index: true })
  subject: string;

  @Prop({ type: String, required: true })
  from: string;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String, required: true })
  body: string;

  @Prop({ type: [String], default: [] })
  receivedChain: string[];

  @Prop({ type: String })
  senderESP: string;

  @Prop({ type: String })
  rawHeaders: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  customData: Record<string, any>;
}

export const EmailSchema = SchemaFactory.createForClass(Email);
export type EmailDocument = Email & Document;
export const EmailModel = mongoose.model<EmailDocument>('Email', EmailSchema);