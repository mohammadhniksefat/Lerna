import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Course } from '../courses/course.entity';
import { Section } from '../courses/section.entity';
import { Chapter } from '../courses/chapter.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('database.url'),
        entities: [User, Course, Section, Chapter],
        migrations: [__dirname + '/migrations/*.{ts,js}'],
        synchronize: false,
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([User, Course, Section, Chapter]),
  ],
})
export class TypeormModule {}
