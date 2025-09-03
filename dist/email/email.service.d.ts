import { Model } from 'mongoose';
import { Email, EmailDocument } from './email.model';
import { ImapService } from '../imap/imap.service';
export declare class EmailService {
    private readonly imapService;
    private emailModel;
    private readonly logger;
    constructor(imapService: ImapService, emailModel: Model<EmailDocument>);
    private scheduleEmailChecks;
    checkEmails(): Promise<void>;
    private saveEmailsToDB;
    getConfig(): {
        email: string;
        subject: string;
    };
    triggerManualRecheck(subject?: string): Promise<{
        status: string;
        subject: string;
        found: number;
    }>;
    getLatestResults(limit?: number): Promise<{
        count: number;
        emails: (import("mongoose").Document<unknown, {}, EmailDocument, {}, {}> & Email & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
    }>;
    getResultById(id: string): Promise<(import("mongoose").Document<unknown, {}, EmailDocument, {}, {}> & Email & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | {
        error: string;
    }>;
    getResultsBySubject(subject: string): Promise<{
        count: number;
        emails: (import("mongoose").Document<unknown, {}, EmailDocument, {}, {}> & Email & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
    }>;
}
