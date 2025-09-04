"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const email_model_1 = require("./email.model");
const imap_service_1 = require("../imap/imap.service");
let EmailService = EmailService_1 = class EmailService {
    imapService;
    emailModel;
    logger = new common_1.Logger(EmailService_1.name);
    constructor(imapService, emailModel) {
        this.imapService = imapService;
        this.emailModel = emailModel;
        this.scheduleEmailChecks();
    }
    scheduleEmailChecks() {
        setInterval(() => {
            this.checkEmails();
        }, 30 * 1000);
    }
    async checkEmails() {
        this.logger.log('Scheduled email check started');
        const result = await this.imapService.connectAndFetch();
        if (result.emails.length > 0) {
            await this.saveEmailsToDB(result.emails);
        }
        this.logger.log(`Check complete. Found ${result.emails.length} new emails`);
    }
    async saveEmailsToDB(emails) {
        this.logger.log(`Attempting to save ${emails.length} emails.`);
        for (const email of emails) {
            this.logger.log(`Checking for existing email with subject: ${email.subject}`);
            const exists = await this.emailModel
                .findOne({
                subject: email.subject,
                from: email.from,
                date: email.date,
            })
                .exec();
            if (exists) {
                this.logger.log(`Email with subject: ${email.subject} already exists. Skipping.`);
            }
            else {
                this.logger.log(`Email with subject: ${email.subject} is new. Saving...`);
                const receivedChainStrings = email.receivedChain
                    ? email.receivedChain.map((hop) => JSON.stringify(hop))
                    : [];
                const newEmail = new this.emailModel({
                    subject: email.subject,
                    from: email.from,
                    date: email.date,
                    body: email.body,
                    receivedChain: receivedChainStrings,
                    senderESP: email.senderESP || 'Unknown',
                    rawHeaders: JSON.stringify(email.rawHeaders || {}),
                    customData: email.customData || {},
                });
                await newEmail.save();
                this.logger.log(`Saved new email: ${email.subject}`);
            }
        }
    }
    getConfig() {
        return {
            email: process.env.IMAP_USER || 'Not configured',
            subject: process.env.DEFAULT_SUBJECT || 'LUCIDGROWTH-TEST',
        };
    }
    async triggerManualRecheck(subject) {
        this.logger.log(`Triggering manual recheck${subject ? ` for subject: ${subject}` : ''}`);
        const result = await this.imapService.connectAndFetch(subject);
        if (result.emails.length > 0) {
            await this.saveEmailsToDB(result.emails);
        }
        return {
            status: 'Recheck completed',
            subject: result.uniqueSubject,
            found: result.emails.length,
        };
    }
    async getAllResults() {
        this.logger.log(`Fetching all email results`);
        const emails = await this.emailModel
            .find()
            .sort({ createdAt: -1 })
            .exec();
        return {
            count: emails.length,
            emails: emails,
        };
    }
    async getResultById(id) {
        this.logger.log(`Fetching email with ID: ${id}`);
        try {
            const email = await this.emailModel.findById(id).exec();
            if (!email) {
                return { error: 'Email not found' };
            }
            return email;
        }
        catch (error) {
            this.logger.error(`Error fetching email: ${error.message}`);
            return { error: 'Invalid email ID format' };
        }
    }
    async getResultsBySubject(subject) {
        this.logger.log(`Fetching emails with subject: ${subject}`);
        const emails = await this.emailModel.find({ subject: subject }).exec();
        return {
            count: emails.length,
            emails: emails,
        };
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, mongoose_1.InjectModel)(email_model_1.Email.name)),
    __metadata("design:paramtypes", [imap_service_1.ImapService,
        mongoose_2.Model])
], EmailService);
//# sourceMappingURL=email.service.js.map