import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { InfographicsModule } from './infographics/infographics.module';
import { AgentsModule } from './agents/agents.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LinkedInModule } from './linkedin/linkedin.module';

@Module({
  imports: [
    // Config — load root .env (monorepo root is two levels up from apps/api)
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),

    // Queue
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('REDIS_URL'),
      }),
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    InfographicsModule,
    AgentsModule,
    LinkedInModule,
  ],
})
export class AppModule {}
