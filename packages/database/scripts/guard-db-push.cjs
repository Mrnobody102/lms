const nodeEnv = process.env.NODE_ENV;
const allowProductionDbPush = process.env.ALLOW_PRODUCTION_DB_PUSH === 'true';

if (nodeEnv === 'production' && !allowProductionDbPush) {
  console.error(
    [
      'Refusing to run prisma db push with NODE_ENV=production.',
      'Use `pnpm --filter @repo/database db:deploy` for production migrations.',
      'Set ALLOW_PRODUCTION_DB_PUSH=true only for an explicitly approved emergency.',
    ].join('\n'),
  );
  process.exit(1);
}
