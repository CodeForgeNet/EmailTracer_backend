import { Injectable, Logger } from '@nestjs/common';
// import { EmailModel, IEmail } from './email.model';
import { EmailModel } from './email.model';
import { ImapService } from '../imap/imap.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly imapService: ImapService) {}

  // Get configuration
  getConfig() {
    return {
      email: process.env.IMAP_USER || 'Not configured',
      subject: process.env.DEFAULT_SUBJECT || 'LUCIDGROWTH-TEST',
    };
  }

  // Trigger a manual recheck for emails
  async triggerManualRecheck(subject?: string) {
    this.logger.log(
      `Triggering manual recheck${subject ? ` for subject: ${subject}` : ''}`
    );
    const result = await this.imapService.connectAndFetch(subject);
    return {
      status: 'Recheck completed',
      subject: result.uniqueSubject,
      found: result.emails.length,
    };
  }

  // Get the latest processed emails
  async getLatestResults(limit = 10) {
    this.logger.log(`Fetching latest ${limit} email results`);
    const emails = await EmailModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return {
      count: emails.length,
      emails: emails,
    };
  }

  // Get a specific email by ID
  async getResultById(id: string) {
    this.logger.log(`Fetching email with ID: ${id}`);
    try {
      const email = await EmailModel.findById(id).exec();

      if (!email) {
        return { error: 'Email not found' };
      }

      return email;
    } catch (error) {
      this.logger.error(`Error fetching email: ${error.message}`);
      return { error: 'Invalid email ID format' };
    }
  }
}
