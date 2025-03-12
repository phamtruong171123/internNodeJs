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
    connectionLimit: 10, // Giới hạn số connection tối đa
});

// 📂 Thư mục chứa file CSV
const partitionFolder = "F:/Intern NodeJS/internNodeJs/output";

// 🔢 Số file CSV (số luồng sẽ chạy)
const numPartitions = 5;

// 📌 Hàm nhập dữ liệu từ một file CSV vào TiDB
async function importCSVPart(threadId, partitionIndex) {
    const conn = await pool.getConnection();
    const csvFilePath = path.join(partitionFolder, `users_partition_${partitionIndex}.csv`);

    if (!fs.existsSync(csvFilePath)) {
        console.error(`❌ File ${csvFilePath} không tồn tại!`);
        return;
    }

    try {
        await conn.beginTransaction();
        console.log(`🚀 Thread ${threadId} importing ${csvFilePath}...`);

        await conn.query("SET GLOBAL local_infile = 1;");

        const query = `
            LOAD DATA LOCAL INFILE ? 
            INTO TABLE users1 
            FIELDS TERMINATED BY ',' 
            LINES TERMINATED BY '\n' 
            IGNORE 1 LINES 
            (id, name, email, created_at);
        `;

        await conn.query({
            sql: query,
            values: [csvFilePath],
            infileStreamFactory: () => fs.createReadStream(csvFilePath), // Dùng stream để tránh tốn RAM
        });

        await conn.commit();
        console.log(`✅ Thread ${threadId} completed ${csvFilePath}`);
    } catch (error) {
        await conn.rollback();
        console.error(`❌ Thread ${threadId} failed!`, error.message);
    } finally {
        conn.release();
    }
}

// 📌 Hàm chạy 5 luồng song song để nhập dữ liệu
async function runMultiThreadImport() {
    const globalStartTime = Date.now();
    const tasks = [];

    for (let i = 0; i < numPartitions; i++) {
        tasks.push(importCSVPart(i, i)); // Mỗi thread xử lý một file
    }

    await Promise.all(tasks);

    const globalEndTime = Date.now();
    console.log(`🏁 All partitions imported in ${(globalEndTime - globalStartTime) / 1000}s`);
    pool.end();
}

// 🏁 Chạy import
runMultiThreadImport().catch(console.error);
