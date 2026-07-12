// src/config/db.js
import dotenv from "dotenv";
import sql from "mssql";

dotenv.config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    // Tên máy
    server: "DESKTOP-LMCBPM1",

    database: process.env.DB_DATABASE,

    options: {
        instanceName: "SQLEXPRESS", // Thêm dòng này
        encrypt: false,
        trustServerCertificate: true,
    },
};

console.log("DB_SERVER:", process.env.DB_SERVER);
console.log("DB_DATABASE:", process.env.DB_DATABASE);

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then((pool) => {
        console.log("Kết nối SQL Server thành công");
        return pool;
    })
    .catch((err) => {
        console.error("Lỗi kết nối SQL Server:", err);
        throw err;
    });

export { sql, poolPromise };
