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

  // POST /email/recheck
  @Post('recheck')
  triggerRecheck(@Query('subject') subject?: string) {
    return this.emailService.triggerManualRecheck(subject);
  }

  // GET /email/results
  @Get('results')
  getLatestResults(@Query('limit') limit?: number) {
    return this.emailService.getLatestResults(limit);
  }

  // GET /email/results/:id
  @Get('results/:id')
  getResultById(@Param('id') id: string) {
    return this.emailService.getResultById(id);
  }
}
