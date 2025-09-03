import { OnModuleInit } from '@nestjs/common';
export interface Email {
    subject: string;
    from: string;
    date: Date;
    body: string;
    receivedChain?: ReceivedHop[];
    senderESP?: string;
}
export interface ReceivedHop {
    source: string | null;
    destination: string | null;
    timestamp: Date | null;
}
export declare class ImapService implements OnModuleInit {
    private readonly logger;
    onModuleInit(): Promise<void>;
    extractReceivedChain(rawHeaders: string): ReceivedHop[];
    detectESP(from: string, receivedChain: ReceivedHop[]): string;
    connectAndFetch(subjectToSearch?: string): Promise<{
        uniqueSubject: string;
        emails: Email[];
    }>;
}
