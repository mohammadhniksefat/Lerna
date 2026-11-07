import { DataSource } from 'typeorm';
import { User } from '../src/users/user.entity';

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [User],
    migrations: ['src/database/migrations/*.{ts,js}'],
    synchronize: false,
    logging: true,
  });

  await dataSource.initialize();
  console.log('DataSource initialized');

  await dataSource.runMigrations();
  console.log('Migrations ran successfully');

  await dataSource.destroy();
  console.log('DataSource destroyed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
