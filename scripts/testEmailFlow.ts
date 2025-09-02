import * as nodemailer from 'nodemailer';
import * as imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { EmailModel } from 'src/email/email.model';
import { connectMongo } from 'src/mongo/mongo';

dotenv.config();

export interface Email {
  subject: any;
  from: any;
  date: any;
  body: any;
  receivedChain?: ReceivedHop[];
  senderESP?: string;
}

export interface ReceivedHop {
  source: string | null;
  destination: string | null;
  timestamp: Date | null;
}

// Create a logger
const logger = new Logger('EmailTest');

// Detect the email service provider based on headers or domains
function detectESP(from: string, receivedChain: ReceivedHop[]): string {
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
      if (source.includes('google') || source.includes('gmail')) return 'Gmail';
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

async function sendTestEmail(subject: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"LucidGrowth Test" <${process.env.IMAP_USER}>`,
    to: process.env.IMAP_USER,
    subject,
    text: 'This is a test email for LucidGrowth IMAP fetch.',
  });

  console.log(`✅ Test email sent with subject: ${subject}`);
}

// Extract and parse the received chain from raw headers
function extractReceivedChain(rawHeaders: string): ReceivedHop[] {
  const unfoldedLines: string[] = [];
  let currentLine = '';

  // Unfold header lines (some headers span multiple lines)
  for (const line of rawHeaders.split(/\r?\n/)) {
    if (/^\s/.test(line)) {
      currentLine += ' ' + line.trim();
    } else {
      if (currentLine) unfoldedLines.push(currentLine);
      currentLine = line.toLowerCase().startsWith('received:') ? line : '';
    }
  }
  if (currentLine) unfoldedLines.push(currentLine);

  console.log(`Found ${unfoldedLines.length} Received header lines`);

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

  // Email headers are in reverse chronological order, so reverse to get chronological
  return chain.reverse();
}

async function fetchEmail(uniqueSubject: string) {
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
    console.log(`Connecting to IMAP server: ${config.imap.host}`);
    console.log(`Using account: ${config.imap.user}`);

    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');
    console.log('Successfully opened INBOX');

    // Search for all emails and filter by subject locally
    const searchCriteria = ['ALL'];
    const fetchOptions = { bodies: ['HEADER', 'TEXT', ''], markSeen: false };

    const results = await connection.search(searchCriteria, fetchOptions);
    console.log(`Found ${results.length} total emails in inbox`);

    const emails: Email[] = [];

    for (const res of results) {
      const headerPart = res.parts.find((part) => part.which === 'HEADER');
      const full = res.parts.find((part) => part.which === '');

      if (full) {
        try {
          const parsed = await simpleParser(full.body);
          console.log(`Checking email with subject: ${parsed.subject}`);

          if (parsed.subject && parsed.subject.includes(uniqueSubject)) {
            console.log(`✅ MATCH FOUND! Subject: ${parsed.subject}`);

            // Extract raw headers for received chain
            const rawHeaders = headerPart
              ? JSON.stringify(headerPart.body)
              : '';

            // Parse the received chain
            const receivedChain = extractReceivedChain(rawHeaders);
            console.log(`Found ${receivedChain.length} received hops`);

            // Detect ESP
            const senderESP = detectESP(
              parsed.from?.text || 'Unknown',
              receivedChain
            );
            console.log(`Detected ESP: ${senderESP}`);

            const emailData: Email = {
              subject: parsed.subject,
              from: parsed.from?.text,
              date: parsed.date,
              body: parsed.text,
              receivedChain: receivedChain,
              senderESP: senderESP,
            };

            // Save to MongoDB
            try {
              await EmailModel.create({
                ...emailData,
                rawHeaders: rawHeaders,
              });
              console.log(`✅ Email saved to MongoDB: ${parsed.subject}`);
            } catch (dbError) {
              console.error(
                `Failed to save email to MongoDB: ${dbError.message}`
              );
            }

            emails.push(emailData);
          }
        } catch (error) {
          console.error('Error parsing email:', error);
        }
      }
    }

    connection.end();

    if (emails.length > 0) {
      console.log(`Found ${emails.length} matching emails`);
      console.log(
        JSON.stringify({ subjectUsed: uniqueSubject, emails }, null, 2)
      );
      return emails;
    } else {
      console.log(`No emails found with subject: ${uniqueSubject}`);
      return [];
    }
  } catch (error) {
    console.error('IMAP connection failed:', error);
    return [];
  }
}

async function main() {
  try {
    // Connect to MongoDB first
    await connectMongo();

    // Generate a unique subject
    const dynamicSubject = `LUCIDGROWTH-TEST-${Date.now()}`;

    // Send the test email
    await sendTestEmail(dynamicSubject);

    // Wait a bit for email delivery
    console.log('⏱ Waiting 10 seconds for email delivery...');
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Try to fetch the email with retries
    let found = false;
    const maxRetries = 12;

    for (let i = 1; i <= maxRetries; i++) {
      console.log(`Attempt ${i}/${maxRetries} to fetch email...`);
      const emails = await fetchEmail(dynamicSubject);

      if (emails.length > 0) {
        found = true;

        // Log the received chain specifically
        console.log('RECEIVED CHAIN:');
        console.log(JSON.stringify(emails[0].receivedChain, null, 2));

        // Log the detected ESP
        console.log('SENDER ESP:');
        console.log(emails[0].senderESP);

        break;
      }

      if (i < maxRetries) {
        console.log(`⏱ Email not found yet, retrying in 5 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    if (!found) {
      console.log(
        '⚠️ Email did not arrive in the inbox within the expected time.'
      );
      console.log(
        JSON.stringify({ subjectUsed: dynamicSubject, emails: [] }, null, 2)
      );
    }
  } catch (error) {
    console.error('Error in test flow:', error);
  } finally {
    // Close MongoDB connection when done
    await require('mongoose').disconnect();
    console.log('MongoDB connection closed');
  }
}

// Run the main function
main().catch((error) => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});
