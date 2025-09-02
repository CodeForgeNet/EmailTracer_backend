import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // GET /email/config
  @Get('config')
  getConfig() {
    return this.emailService.getConfig();
  }

  // POST /email/check
  @Post('check')
  checkEmails() {
    return this.emailService.checkEmails();
  }

  // GET /email/:id
  @Get(':id')
  getEmailById(@Param('id') id: string) {
    return this.emailService.getResultById(id);
  }

  // POST /email/recheck
  @Post('recheck')
  recheckEmails(@Query('subject') subject?: string) {
    return this.emailService.triggerManualRecheck(subject);
  }
}