// src/config/db.js
import dotenv from "dotenv";
import sql from "mssql";

dotenv.config();

const server = process.env.DB_HOST || process.env.DB_SERVER || "localhost";
const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined;
const instanceName = process.env.DB_INSTANCE || undefined;

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server,
    ...(port ? { port } : {}),
    database: process.env.DB_DATABASE,
    options: {
        ...(instanceName ? { instanceName } : {}),
        encrypt: false,
        trustServerCertificate: true,
    },
};

console.log("DB_SERVER:", server);
console.log("DB_PORT:", port || "(default)");
console.log("DB_INSTANCE:", instanceName || "(none)");
console.log("DB_DATABASE:", process.env.DB_DATABASE);

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then((pool) => {
        console.log("Ket noi SQL Server thanh cong");
        return pool;
    })
    .catch((err) => {
        console.error("Loi ket noi SQL Server:", err);
        throw err;
    });

export { sql, poolPromise };