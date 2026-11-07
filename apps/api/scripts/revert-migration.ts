import { DataSource } from 'typeorm';

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    migrations: ['src/database/migrations/*.{ts,js}'],
    synchronize: false,
    logging: true,
  });

  await dataSource.initialize();
  console.log('DataSource initialized');

  await dataSource.undoLastMigration();
  console.log('Migration reverted successfully');

  await dataSource.destroy();
  console.log('DataSource destroyed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
