import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import * as dotenv from 'dotenv';
import { connectMongo } from '../mongo/mongo';

dotenv.config();

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

@Injectable()
export class ImapService implements OnModuleInit {
  private readonly logger = new Logger(ImapService.name);

  async onModuleInit() {
    try {
      await connectMongo();
      this.logger.log('MongoDB connected successfully in ImapService');
    } catch (error) {
      this.logger.error(`MongoDB connection failed: ${error.message}`);
    }
  }

  // Extract and parse the received chain from raw headers
  extractReceivedChain(rawHeaders: string): ReceivedHop[] {
    const unfoldedLines: string[] = [];
    let currentLine = '';

    // Unfold header lines (some headers span multiple lines)
    for (const line of rawHeaders.split(/\r?\n/)) {
      if (/^\s/.test(line)) {
        currentLine += ' ' + line.trim();
      } else {
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

    // Parse each received line into structured data
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

    return chain.reverse(); // Reverse to get chronological order
  }

  // Detect the email service provider based on headers or domains
  detectESP(from: string, receivedChain: ReceivedHop[]): string {
    // Simple detection based on email domain
    if (from) {
      if (from.includes('gmail.com')) return 'Gmail';
      if (from.includes('outlook.com') || from.includes('hotmail.com'))
        return 'Microsoft';
      if (from.includes('yahoo.com')) return 'Yahoo';
    }

    // Check received chain for better detection
    if (receivedChain && receivedChain.length > 0) {
      for (const hop of receivedChain) {
        const source = hop.source?.toLowerCase() || '';
        if (source.includes('google') || source.includes('gmail'))
          return 'Gmail';
        if (source.includes('microsoft') || source.includes('outlook'))
          return 'Microsoft';
        if (source.includes('yahoo')) return 'Yahoo';
        if (source.includes('amazonses')) return 'Amazon SES';
        if (source.includes('sendgrid')) return 'SendGrid';
        if (source.includes('mailchimp') || source.includes('mandrill'))
          return 'Mailchimp';
      }
    }

    return 'Unknown ESP';
  }

  async connectAndFetch(uniqueSubject?: string): Promise<{
    uniqueSubject: string;
    emails: Email[];
  }> {
    // Generate a unique subject if none provided
    uniqueSubject = uniqueSubject || `LUCIDGROWTH-TEST-${Date.now()}`;
    const emails: Email[] = [];

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
      this.logger.log(
        `Connecting to IMAP server: ${config.imap.host}:${config.imap.port}`
      );
      this.logger.log(`Using email account: ${config.imap.user}`);
      this.logger.log(`Searching for emails with subject: ${uniqueSubject}`);

      const connection = await imaps.connect(config);
      this.logger.log('Successfully connected to IMAP server');

      await connection.openBox('INBOX');
      this.logger.log('Successfully opened INBOX');

      const searchCriteria = ['ALL'];
      this.logger.log(
        `Searching with criteria: ${JSON.stringify(searchCriteria)}`
      );

      const fetchOptions = { bodies: ['HEADER', 'TEXT', ''], markSeen: false };
      const results = await connection.search(searchCriteria, fetchOptions);
      this.logger.log(`Found ${results.length} total emails in inbox`);

      for (const res of results) {
        try {
          const headerPart = res.parts.find((part) => part.which === 'HEADER');
          const headers = headerPart ? headerPart.body : null;

          // Get raw headers for processing
          // const rawHeaders = headerPart ? JSON.stringify(headerPart.body) : '';
          let rawHeaders = '';
          if (headerPart && headerPart.body) {
            // Convert header object to string format
            Object.keys(headerPart.body).forEach((key) => {
              if (Array.isArray(headerPart.body[key])) {
                headerPart.body[key].forEach((value) => {
                  rawHeaders += `${key}: ${value}\r\n`;
                });
              } else {
                rawHeaders += `${key}: ${headerPart.body[key]}\r\n`;
              }
            });
          }

          // Get the full message part
          const fullPart = res.parts.find((part) => part.which === '');
          const full = fullPart ? fullPart.body : null;

          let emailSubject = '';

          // Try to get subject from header
          if (headers && headers.subject) {
            emailSubject = Array.isArray(headers.subject)
              ? headers.subject[0]
              : headers.subject;
            this.logger.log(
              `Found email with subject from header: ${emailSubject}`
            );
          }

          // If we have a full message, parse it for more reliable data
          if (full) {
            const parsed = await simpleParser(full);
            emailSubject = parsed.subject || emailSubject;

            this.logger.log(
              `Found email with subject from parser: ${emailSubject}`
            );

            // If the subject matches our unique subject, process this email
            if (emailSubject && emailSubject.includes(uniqueSubject)) {
              // Parse the received chain
              const receivedChain = this.extractReceivedChain(rawHeaders);

              // Detect the ESP
              const fromAddress =
                parsed.from?.text ||
                (headers?.from ? headers.from[0] : 'Unknown');
              const senderESP = this.detectESP(fromAddress, receivedChain);

              const emailData: Email = {
                subject: emailSubject,
                from: fromAddress,
                date: parsed.date || new Date(),
                body: parsed.text || '',
                receivedChain,
                senderESP,
              };

              this.logger.log(`✅ MATCH FOUND! Subject: ${emailSubject}`);
              this.logger.log(
                `Found received chain with ${receivedChain.length} hops`
              );
              this.logger.log(`Detected ESP: ${senderESP}`);
              emails.push(emailData);
            }
          }
        } catch (parseErr) {
          this.logger.error(`Error parsing email: ${parseErr.message}`);
        }
      }

      this.logger.log(
        `Returning ${emails.length} emails with matching subject criteria`
      );
      connection.end();
      return { uniqueSubject, emails };
    } catch (err) {
      this.logger.error(`IMAP connection failed: ${err.message}`, err.stack);
      return { uniqueSubject, emails: [] };
    }
  }
}
