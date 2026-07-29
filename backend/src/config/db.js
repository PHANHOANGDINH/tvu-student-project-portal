import dotenv from "dotenv";
import sql from "mssql";

dotenv.config({ override: true });

const dbPort = Number(process.env.DB_PORT || 1433);

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || "localhost",
    database: process.env.DB_DATABASE,
    port: dbPort,

    options: {
        ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== "false",
    },

    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },

    connectionTimeout: 15000,
    requestTimeout: 30000,
};

console.log("Đang kết nối SQL Server:", {
    server: dbConfig.server,
    database: dbConfig.database,
    port: dbConfig.port,
    user: dbConfig.user,
});

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then((pool) => {
        console.log("Kết nối SQL Server thành công");
        return pool;
    })
    .catch((error) => {
        console.error("Lỗi kết nối SQL Server:", error);
        throw error;
    });

export { sql, poolPromise };