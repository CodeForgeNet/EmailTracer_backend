import * as mongoose from 'mongoose';

export interface ReceivedHop {
  source: string | null;
  destination: string | null;
  timestamp: Date | null;
}

export interface IEmail {
  subject: string;
  from: string;
  date: Date;
  body: string;
  receivedChain?: ReceivedHop[];
  senderESP?: string;
  rawHeaders: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailSchema = new mongoose.Schema<IEmail>(
  {
    subject: { type: String, required: true, index: true },
    from: { type: String, required: true },
    date: { type: Date, required: true },
    body: { type: String, required: true },
    receivedChain: [
      {
        source: { type: String, default: null },
        destination: { type: String, default: null },
        timestamp: { type: Date, default: null },
      },
    ],
    senderESP: { type: String },
    rawHeaders: { type: String },
  },
  { timestamps: true }
);

// Create or get the model
export const EmailModel =
  mongoose.models.Email || mongoose.model<IEmail>('Email', EmailSchema);
