import { EmailService } from './email.service';
export declare class EmailController {
    private readonly emailService;
    constructor(emailService: EmailService);
    getConfig(): {
        email: string;
        subject: string;
    };
    checkEmails(): Promise<void>;
    getAllEmails(): Promise<{
        count: number;
        emails: (import("mongoose").Document<unknown, {}, import("./email.model").EmailDocument, {}, {}> & import("./email.model").Email & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
    }>;
    getEmailById(id: string): Promise<(import("mongoose").Document<unknown, {}, import("./email.model").EmailDocument, {}, {}> & import("./email.model").Email & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | {
        error: string;
    }>;
    recheckEmails(subject?: string): Promise<{
        status: string;
        subject: string;
        found: number;
    }>;
    getEmailsBySubject(subject: string): Promise<{
        count: number;
        emails: (import("mongoose").Document<unknown, {}, import("./email.model").EmailDocument, {}, {}> & import("./email.model").Email & import("mongoose").Document<unknown, any, any, Record<string, any>, {}> & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
    }>;
}
