import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImapModule } from './imap/imap.module';
import { connectMongo } from './mongo/mongo';
import { EmailModule } from './email/email.module';

@Module({
  imports: [ImapModule, EmailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {
    // Connect to MongoDB when the application starts
    await connectMongo();
  }
}
