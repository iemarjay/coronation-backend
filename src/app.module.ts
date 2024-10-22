import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration, { auth0Configuration, oktaConfiguration } from 'config';
import { join } from 'path';
import { env } from 'process';
import { UserModule } from 'src/user/user.module';
import { AssetModule } from './asset/asset.module';
import { TeamModule } from './team/team.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration, oktaConfiguration, auth0Configuration],
      cache: env.APP_ENV === 'production',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql',
        host: configService.get('database.host'),
        port: +configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        synchronize: configService.get('env') !== 'production',
        migrationsRun: true,
        migrations: ['dist/migrations/*{.ts,.js}'],
        options: {
          encrypt: true,
          trustServerCertificate: true,
          requestTimeout: 30000,
        },
        logging:
          configService.get('env') === 'development'
            ? 'all'
            : ['query', 'error'],
        entities: [join(__dirname, '**/*.entity{.ts,.js}')],
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'storage/public'),
    }),
    UserModule,
    AssetModule,
    TeamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
