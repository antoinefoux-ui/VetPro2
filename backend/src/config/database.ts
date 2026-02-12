export const databaseConfig = {
  url: process.env.DATABASE_URL || 'postgresql://localhost:5432/vetpro',
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
};
