import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { TypeormModule } from './database/typeorm.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ConfigModule, TypeormModule, AuthModule, UsersModule],
})
export class AppModule {}
