import { createPool } from "mysql2/promise";
import dotenv from "dotenv";
import * as fs from "fs";
import path from "path";

dotenv.config(); // Load biến môi trường từ .env

// 🔌 Kết nối TiDB với Connection Pool
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
    multipleStatements: true,
    connectionLimit: 10 // Giới hạn số connection tối đa
});

// 📂 Đường dẫn thư mục chứa file CSV đã chia theo partition
const partitionFolder = path.resolve("F:/Intern NodeJS/internNodeJs/output");

// 🔢 Số lượng partition (đã tạo trong MySQL/TiDB)
const numPartitions = 5;

// 📌 Hàm nhập dữ liệu từ file CSV vào TiDB
async function importCSVPart(threadId, partitionIndex) {
    const conn = await pool.getConnection();
    const startTime = Date.now();

    // 📂 File CSV của partition
    const csvFilePath = path.join(partitionFolder, `users_partition_${partitionIndex}.csv`);

    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(csvFilePath)) {
        console.error(`❌ File ${csvFilePath} không tồn tại!`);
        return;
    }

    try {
        await conn.beginTransaction();
        console.log(`🚀 Thread ${threadId} importing file ${csvFilePath}...`);

        await conn.query("SET GLOBAL local_infile = 1;");

        // ✅ Chạy `LOAD DATA LOCAL INFILE` để nhập file CSV của partition
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
            values: [csvFilePath],
            infileStreamFactory: () => fs.createReadStream(csvFilePath) // Stream file để tránh tốn RAM
        });

        await conn.commit();
        const endTime = Date.now();
        console.log(`✅ Thread ${threadId} completed file ${csvFilePath} in ${(endTime - startTime) / 1000}s`);
    } catch (error) {
        await conn.rollback();
        console.error(`❌ Thread ${threadId} failed!`, error.message);
    } finally {
        conn.release();
    }
}

// 📌 Hàm chạy 5 luồng song song để nhập dữ liệu từ 5 file CSV
async function runMultiThreadImport() {
    const globalStartTime = Date.now();
    const tasks = [];

    for (let i = 0; i < numPartitions; i++) {
        tasks.push(importCSVPart(i, i)); // Mỗi thread xử lý 1 file CSV
    }

    await Promise.all(tasks);

    const globalEndTime = Date.now();
    console.log(`🏁 All partitions imported in ${(globalEndTime - globalStartTime) / 1000}s`);

    
}

// 🏁 Chạy import với 5 file CSV
runMultiThreadImport().catch(console.error);
