import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Email, EmailDocument } from './email.model';
import { ImapService } from '../imap/imap.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly imapService: ImapService,
    @InjectModel(Email.name) private emailModel: Model<EmailDocument>
  ) {
    // Initialize scheduled email checks
    this.scheduleEmailChecks();
  }

  // Schedule periodic email checks
  private scheduleEmailChecks() {
    setInterval(() => {
      this.checkEmails();
    }, 30 * 1000); // 30 seconds
  }

  // Periodic email check method
  async checkEmails() {
    this.logger.log('Scheduled email check started');
    const result = await this.imapService.connectAndFetch();

    // Process and save new emails
    if (result.emails.length > 0) {
      await this.saveEmailsToDB(result.emails);
    }

    this.logger.log(`Check complete. Found ${result.emails.length} new emails`);
  }

  // Save emails to database
  //   private async saveEmailsToDB(emails: any[]) {
  //     this.logger.log(`Attempting to save ${emails.length} emails.`);
  //     for (const email of emails) {
  //       this.logger.log(
  //         `Checking for existing email with subject: ${email.subject}`
  //       );
  //       const exists = await this.emailModel
  //         .findOne({
  //           subject: email.subject,
  //           from: email.from,
  //           date: email.date,
  //         })
  //         .exec();

  //       if (exists) {
  //         this.logger.log(
  //           `Email with subject: ${email.subject} already exists. Skipping.`
  //         );
  //       } else {
  //         this.logger.log(
  //           `Email with subject: ${email.subject} is new. Saving...`
  //         );
  //         const newEmail = new this.emailModel({
  //           subject: email.subject,
  //           from: email.from,
  //           date: email.date,
  //           body: email.body,
  //           receivedChain: email.receivedChain || [],
  //           senderESP: email.senderESP || 'Unknown',
  //           rawHeaders: JSON.stringify(email.rawHeaders || {}),
  //           customData: email.customData || {},
  //         });

  //         await newEmail.save();
  //         this.logger.log(`Saved new email: ${email.subject}`);
  //       }
  //     }
  //   }
  private async saveEmailsToDB(emails: any[]) {
    this.logger.log(`Attempting to save ${emails.length} emails.`);
    for (const email of emails) {
      this.logger.log(
        `Checking for existing email with subject: ${email.subject}`
      );
      const exists = await this.emailModel
        .findOne({
          subject: email.subject,
          from: email.from,
          date: email.date,
        })
        .exec();

      if (exists) {
        this.logger.log(
          `Email with subject: ${email.subject} already exists. Skipping.`
        );
      } else {
        this.logger.log(
          `Email with subject: ${email.subject} is new. Saving...`
        );

        // Transform receivedChain to strings
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

  // Get configuration (existing method)
  getConfig() {
    return {
      email: process.env.IMAP_USER || 'Not configured',
      subject: process.env.DEFAULT_SUBJECT || 'LUCIDGROWTH-TEST',
    };
  }

  // Trigger a manual recheck for emails (existing method)
  async triggerManualRecheck(subject?: string) {
    this.logger.log(
      `Triggering manual recheck${subject ? ` for subject: ${subject}` : ''}`
    );
    const result = await this.imapService.connectAndFetch(subject);

    // Save any found emails
    if (result.emails.length > 0) {
      await this.saveEmailsToDB(result.emails);
    }

    return {
      status: 'Recheck completed',
      subject: result.uniqueSubject,
      found: result.emails.length,
    };
  }

  // Get all processed emails
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

  // Get a specific email by ID (existing method)
  async getResultById(id: string) {
    this.logger.log(`Fetching email with ID: ${id}`);
    try {
      const email = await this.emailModel.findById(id).exec();

      if (!email) {
        return { error: 'Email not found' };
      }

      return email;
    } catch (error) {
      this.logger.error(`Error fetching email: ${error.message}`);
      return { error: 'Invalid email ID format' };
    }
  }

  // Get emails by subject
  async getResultsBySubject(subject: string) {
    this.logger.log(`Fetching emails with subject: ${subject}`);
    const emails = await this.emailModel.find({ subject: subject }).exec();
    return {
      count: emails.length,
      emails: emails,
    };
  }
}
