"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var ImapService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImapService = void 0;
const common_1 = require("@nestjs/common");
const imaps = __importStar(require("imap-simple"));
const mailparser_1 = require("mailparser");
const dotenv = __importStar(require("dotenv"));
const mongo_1 = require("../mongo/mongo");
dotenv.config();
let ImapService = ImapService_1 = class ImapService {
    logger = new common_1.Logger(ImapService_1.name);
    async onModuleInit() {
        try {
            await (0, mongo_1.connectMongo)();
            this.logger.log('MongoDB connected successfully in ImapService');
        }
        catch (error) {
            this.logger.error(`MongoDB connection failed: ${error.message}`);
        }
    }
    extractReceivedChain(rawHeaders) {
        const unfoldedLines = [];
        let currentLine = '';
        for (const line of rawHeaders.split(/\r?\n/)) {
            if (/^\s/.test(line)) {
                currentLine += ' ' + line.trim();
            }
            else {
                if (currentLine && currentLine.toLowerCase().startsWith('received:')) {
                    unfoldedLines.push(currentLine);
                }
                currentLine = line;
            }
        }
        if (currentLine && currentLine.toLowerCase().startsWith('received:')) {
            unfoldedLines.push(currentLine);
        }
        this.logger.log(`Found ${unfoldedLines.length} Received header lines`);
        const chain = unfoldedLines.map((line) => {
            const sourceMatch = line.match(/from\s+([^\s]+)/i);
            const destMatch = line.match(/by\s+([^\s]+)/i);
            const dateMatch = line.match(/;\s*(.*)$/);
            return {
                source: sourceMatch ? sourceMatch[1] : null,
                destination: destMatch ? destMatch[1] : null,
                timestamp: dateMatch ? new Date(dateMatch[1]) : null,
            };
        });
        return chain.reverse();
    }
    detectESP(from, receivedChain) {
        if (from) {
            if (from.includes('gmail.com'))
                return 'Gmail';
            if (from.includes('outlook.com') || from.includes('hotmail.com'))
                return 'Microsoft';
            if (from.includes('yahoo.com'))
                return 'Yahoo';
        }
        if (receivedChain && receivedChain.length > 0) {
            for (const hop of receivedChain) {
                const source = hop.source?.toLowerCase() || '';
                if (source.includes('google') || source.includes('gmail'))
                    return 'Gmail';
                if (source.includes('microsoft') || source.includes('outlook'))
                    return 'Microsoft';
                if (source.includes('icloud') || source.includes('apple'))
                    return 'iCloud';
                if (source.includes('yahoo'))
                    return 'Yahoo';
                if (source.includes('amazonses'))
                    return 'Amazon SES';
                if (source.includes('sendgrid'))
                    return 'SendGrid';
                if (source.includes('mailchimp') || source.includes('mandrill'))
                    return 'Mailchimp';
            }
        }
        return 'Unknown ESP';
    }
    async connectAndFetch(subjectToSearch) {
        const uniqueSubject = subjectToSearch || `LUCIDGROWTH-TEST-${Date.now()}`;
        const emails = [];
        const config = {
            imap: {
                user: process.env.IMAP_USER,
                password: process.env.IMAP_PASS,
                host: process.env.IMAP_HOST || 'imap.gmail.com',
                port: Number(process.env.IMAP_PORT) || 993,
                tls: true,
                authTimeout: 30000,
                tlsOptions: { rejectUnauthorized: false },
            },
        };
        try {
            this.logger.log(`Connecting to IMAP server: ${config.imap.host}:${config.imap.port}`);
            this.logger.log(`Using email account: ${config.imap.user}`);
            if (subjectToSearch) {
                this.logger.log(`Searching for emails with subject: ${subjectToSearch}`);
            }
            else {
                this.logger.log(`Searching for all new emails.`);
            }
            const connection = await imaps.connect(config);
            this.logger.log('Successfully connected to IMAP server');
            await connection.openBox('INBOX');
            this.logger.log('Successfully opened INBOX');
            const searchCriteria = subjectToSearch
                ? [['HEADER', 'SUBJECT', subjectToSearch]]
                : ['ALL'];
            this.logger.log(`Searching with criteria: ${JSON.stringify(searchCriteria)}`);
            const fetchOptions = { bodies: ['HEADER', 'TEXT', ''], markSeen: false };
            const results = await connection.search(searchCriteria, fetchOptions);
            this.logger.log(`Found ${results.length} total emails in inbox`);
            for (const res of results) {
                try {
                    const headerPart = res.parts.find((part) => part.which === 'HEADER');
                    const headers = headerPart ? headerPart.body : null;
                    let rawHeaders = '';
                    if (headerPart && headerPart.body) {
                        Object.keys(headerPart.body).forEach((key) => {
                            if (Array.isArray(headerPart.body[key])) {
                                headerPart.body[key].forEach((value) => {
                                    rawHeaders += `${key}: ${value}\r\n`;
                                });
                            }
                            else {
                                rawHeaders += `${key}: ${headerPart.body[key]}\r\n`;
                            }
                        });
                    }
                    const fullPart = res.parts.find((part) => part.which === '');
                    const full = fullPart ? fullPart.body : null;
                    let emailSubject = '';
                    if (headers && headers.subject) {
                        emailSubject = Array.isArray(headers.subject)
                            ? headers.subject[0]
                            : headers.subject;
                        this.logger.log(`Found email with subject from header: ${emailSubject}`);
                    }
                    if (full) {
                        const parsed = await (0, mailparser_1.simpleParser)(full);
                        emailSubject = parsed.subject || emailSubject;
                        this.logger.log(`Found email with subject from parser: ${emailSubject}`);
                        if (!subjectToSearch ||
                            (emailSubject && emailSubject.includes(subjectToSearch))) {
                            const receivedChain = this.extractReceivedChain(rawHeaders);
                            const fromAddress = parsed.from?.text ||
                                (headers?.from ? headers.from[0] : 'Unknown');
                            const senderESP = this.detectESP(fromAddress, receivedChain);
                            const emailData = {
                                subject: emailSubject,
                                from: fromAddress,
                                date: parsed.date || new Date(),
                                body: parsed.text || '',
                                receivedChain,
                                senderESP,
                            };
                            this.logger.log(`✅ MATCH FOUND! Subject: ${emailSubject}`);
                            this.logger.log(`Found received chain with ${receivedChain.length} hops`);
                            this.logger.log(`Detected ESP: ${senderESP}`);
                            emails.push(emailData);
                        }
                    }
                }
                catch (parseErr) {
                    this.logger.error(`Error parsing email: ${parseErr.message}`);
                }
            }
            this.logger.log(`Returning ${emails.length} emails with matching subject criteria`);
            connection.end();
            return { uniqueSubject, emails };
        }
        catch (err) {
            this.logger.error(`IMAP connection failed: ${err.message}`, err.stack);
            return { uniqueSubject, emails: [] };
        }
    }
};
exports.ImapService = ImapService;
exports.ImapService = ImapService = ImapService_1 = __decorate([
    (0, common_1.Injectable)()
], ImapService);
//# sourceMappingURL=imap.service.js.map