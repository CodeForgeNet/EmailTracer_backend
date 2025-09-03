import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
export declare class Email extends Document {
    subject: string;
    from: string;
    date: Date;
    body: string;
    receivedChain: string[];
    senderESP: string;
    rawHeaders: string;
    customData: Record<string, any>;
}
export declare const EmailSchema: mongoose.Schema<Email, mongoose.Model<Email, any, any, any, mongoose.Document<unknown, any, Email, any, {}> & Email & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Email, mongoose.Document<unknown, {}, mongoose.FlatRecord<Email>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<Email> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
export type EmailDocument = Email & Document;
export declare const EmailModel: mongoose.Model<EmailDocument, {}, {}, {}, mongoose.Document<unknown, {}, EmailDocument, {}, {}> & Email & mongoose.Document<unknown, any, any, Record<string, any>, {}> & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
