import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('database.url'),
        entities: [User],
        migrations: [__dirname + '/migrations/*.{ts,js}'],
        synchronize: false,
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([User]),
  ],
})
export class TypeormModule {}
