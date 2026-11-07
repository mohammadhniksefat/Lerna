import { DataSource } from 'typeorm';
import { User } from './src/users/user.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User],
  migrations: ['./src/database/migrations/*.{ts,js}'],
  synchronize: false,
  logging: false,
});
