require('dotenv').config();
const sql = require('mssql/msnodesqlv8');

const dbServer = process.env.DB_SERVER || 'localhost';
const dbInstance = process.env.DB_INSTANCE || 'MSSQLLocalDB';
const dbName = process.env.DB_DATABASE || 'ActivaMenteDB';
const dbDriver = process.env.DB_DRIVER || 'ODBC Driver 17 for SQL Server';

// Evita errores de DNS (ENOTFOUND) en tedious y resuelve la instancia local mediante ODBC
const serverTarget =
  dbServer.toLowerCase() === 'localhost' && dbInstance.toLowerCase() === 'mssqllocaldb'
    ? `(localdb)\\${dbInstance}`
    : dbServer.includes('\\') || !dbInstance
      ? dbServer
      : `${dbServer}\\${dbInstance}`;

const connectionString =
  process.env.DB_CONNECTION_STRING ||
  `Driver={${dbDriver}};Server=${serverTarget};Database=${dbName};Trusted_Connection=yes;TrustServerCertificate=yes;`;

const dbConfig = {
  connectionString,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

const poolPromise = new sql.ConnectionPool(dbConfig)
  .connect()
  .then(pool => {
    console.log(`✅ Conexión establecida correctamente con SQL Server (${dbName})`);
    return pool;
  })
  .catch(err => {
    console.error('❌ Error crítico al conectar con SQL Server:', err);
    process.exit(1);
  });

module.exports = {
  sql,
  poolPromise,
  dbConfig
};
