import { DataSource } from 'typeorm';

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();

  const migrations = await dataSource.query(
    `SELECT * FROM "migrations" ORDER BY "id" DESC LIMIT 5`,
  );
  console.log('applied migrations:', JSON.stringify(migrations, null, 2));

  const columns = await dataSource.query(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_name = 'users'
     ORDER BY ordinal_position`,
  );
  console.log('users columns:', JSON.stringify(columns, null, 2));

  await dataSource.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
