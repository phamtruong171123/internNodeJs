import { createPool } from "mysql2/promise";
import dotenv from "dotenv";
import * as fs from "fs";
import path from "path";

dotenv.config(); // Load biến môi trường từ .env

// 🔌 Tạo kết nối đến TiDB bằng connection pool
const pool = createPool({
    host: process.env.TIDB_HOST || '127.0.0.1',
    port: process.env.TIDB_PORT || 4000,
    user: process.env.TIDB_USER || 'root',
    password: process.env.TIDB_PASSWORD || '',
    database: process.env.TIDB_DATABASE || 'mydb',
    ssl: process.env.TIDB_ENABLE_SSL === 'true' ? {
        minVersion: 'TLSv1.2',
        ca: process.env.TIDB_CA_PATH ? fs.readFileSync(process.env.TIDB_CA_PATH) : undefined
    } : null,
    multipleStatements: true // Cho phép chạy nhiều câu SQL
});

async function queryTest(){
    const conn = await pool.getConnection();
    const [rows, fields] = await conn.query("SELECT count(*) FROM users");
    console.log(rows);
    conn.release();
}

// 📌 Hàm import dữ liệu từ file CSV
async function importUsersFromCSV(filePath) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction(); // Bắt đầu transaction

        console.log("📂 Import dữ liệu từ CSV...");

       
        await conn.query("SET GLOBAL local_infile = 1;");

        // ✅ Thực thi truy vấn với `infileStreamFactory`
        const query = `
            LOAD DATA LOCAL INFILE ? 
            INTO TABLE users 
            FIELDS TERMINATED BY ',' 
            LINES TERMINATED BY '\n' 
            IGNORE 1 LINES 
            (id, name, email, created_at);
        `;

        await conn.query({
            sql: query,
            values: [filePath],
            infileStreamFactory: () => fs.createReadStream(filePath) // 
        });

        await conn.commit(); // Xác nhận transaction nếu không có lỗi
        console.log("✅ Dữ liệu đã được import thành công!");

    } catch (error) {
        await conn.rollback(); // Rollback nếu có lỗi
        console.error("❌ Import thất bại, rollback dữ liệu!", error.message);
    } finally {
        conn.release(); // Giải phóng kết nối
    }
}


const csvFilePath = path.resolve("F:/Intern NodeJS/internNodeJs/query mybd/output/users1.csv");

// 🏁 Gọi hàm import
//importUsersFromCSV(csvFilePath);

queryTest();
