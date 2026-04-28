import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
    // @ts-ignore — directUrl missing from Prisma 7.5.0 types but honored at runtime
    directUrl: process.env.DATABASE_URL_UNPOOLED,
  },
});
