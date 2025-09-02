// import { Module, OnModuleInit } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { ImapModule } from './imap/imap.module';
// import { connectMongo } from './mongo/mongo';
// import { EmailModule } from './email/email.module';

// @Module({
//   imports: [ImapModule, EmailModule],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule implements OnModuleInit {
//   async onModuleInit() {
//     // Connect to MongoDB when the application starts
//     await connectMongo();
//   }
// }

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './email/email.module';
import { ImapModule } from './imap/imap.module';
import { EmailSchema } from './email/email.model';

@Module({
  imports: [
    ConfigModule.forRoot(),
    // MongooseModule.forRoot(process.env.MONGODB_URI),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/lucidgrowth'
    ),
    MongooseModule.forFeature([{ name: 'Email', schema: EmailSchema }]),
    EmailModule,
    ImapModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
