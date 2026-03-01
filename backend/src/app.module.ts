import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { CoinsModule } from './coins/coins.module';
import { DepositsModule } from './deposits/deposits.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AdminModule } from './admin/admin.module';
import { MarketModule } from './market/market.module';
import { SettingsModule } from './settings/settings.module';
import { EmailModule } from './email/email.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MarketingModule } from './marketing/marketing.module';
// ChatModule disabled on Vercel serverless (no WebSocket support)
// import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60') * 1000,
      limit: parseInt(process.env.RATE_LIMIT_MAX || '600'),
    }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    WalletsModule,
    CoinsModule,
    DepositsModule,
    WithdrawalsModule,
    TransactionsModule,
    AdminModule,
    MarketModule,
    SettingsModule,
    EmailModule,
    NotificationsModule,
    MarketingModule,
  ],
  providers: [
    // ThrottlerGuard disabled in dev — re-enable for production
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}
