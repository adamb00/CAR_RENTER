import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url:
      process.env.DATABASE_URL ||
      process.env.DIRECT_URL ||
      'postgresql://postgres.waximdqzopehmgjcpudg:2wfUNZLpsP6sFTOC@aws-1-eu-west-1.pooler.supabase.com:5432/postgres',
  },
});
