import mongoose, { Document, Schema } from 'mongoose';
import fs from 'fs';


const connectMongoDB = async () => {
    if (mongoose.connection.readyState === 1) {
        console.log("✅ MongoDB đã được kết nối.");
        return;
    }
    try {
        await mongoose.connect('mongodb://localhost:27017/mydb');  
        console.log("✅ Kết nối MongoDB thành công!");
    } catch (error) {
        console.error("❌ Lỗi khi kết nối MongoDB:", error);
    }
};

// Định nghĩa interface 
interface Field {
    name: string;
    type: string;
    status: string;
}

interface FieldObject {
    field: Record<string, Field>;
    status: string;
}

interface FieldArray {
    table: string;
    field: Record<string, Field>;
    status: string;
}

// Định nghĩa interface cho JsonData
export interface JsonData {
    _id: mongoose.Types.ObjectId;
    project_id: string;
    field_normal?: Record<string, Field>;
    field_object?: Record<string, FieldObject>;
    field_array?: Record<string, FieldArray>;
    table_old_name?: string;
    table_new_name?: string;
}


class MongoDbDao {
    async getDataFromMapping(projectId: string, table: string): Promise<JsonData | null> {
        try {
            await connectMongoDB();

            // Tạo model động theo tên bảng 
            const DynamicModel = mongoose.models[table] || mongoose.model<JsonData>(
                table, 
                new mongoose.Schema<JsonData>(
                    {
                        project_id: String,
                        field_normal: { type: Map, of: Object },
                        field_object: { type: Map, of: Object },
                        field_array: { type: Map, of: Object },
                        table_old_name: String,
                        table_new_name: String
                    },
                    { collection: table }
                )
            );

            
            const result = await DynamicModel.findOne({ project_id: projectId }).lean() as JsonData | null;

            if (!result) {
                console.log(`⚠️ Không tìm thấy dữ liệu cho bảng: ${table}`);
                return null;
            }

            console.log(" Dữ liệu trả về từ MongoDB:", JSON.stringify(result, null, 2));
            return result;
        } catch (error) {
            console.error(" Lỗi khi truy vấn MongoDB:", error);
            return null;
        }
    }
}

// ✅ Hàm lấy dữ liệu cho nhiều bảng
async function getDataMappingMultiTablesV2(projectId: string, tables: string[]): Promise<any> {
    const mongodbDao = new MongoDbDao();
    let allResults: any[] = [];

    const promises = tables.map(async (table) => {
        let jsonData = await mongodbDao.getDataFromMapping(projectId, table);

        if (!jsonData) {
            console.warn(`⚠️ Không tìm thấy dữ liệu JSON hợp lệ cho bảng: ${table}`);
            allResults.push({ tableOldName: table, tableNewName: "", fields: [] });
            return;
        }

        let rs: any[] = [];

        // Xử lý field_normal
        if (jsonData.field_normal) {
            rs.push(...Object.entries(jsonData.field_normal)
                .filter(([_, v]) => v?.status === "active")
                .map(([k, v]) => ({ rootKey: k, dataType: "normal", mappingFields: [{ [k]: v }] }))
            );
        }

        // Xử lý field_object
        if (jsonData.field_object) {
            rs.push(...Object.entries(jsonData.field_object)
                .filter(([_, v]) => v?.status === "active" && v?.field)
                .map(([k, v]) => ({
                    rootKey: k,
                    dataType: "object",
                    mappingFields: Object.entries(v.field)
                        .filter(([_, value]) => value?.status === "active")
                        .map(([field, value]) => ({ [field]: value }))
                }))
            );
        }

        // Xử lý field_array
        if (jsonData.field_array) {
            rs.push(...Object.entries(jsonData.field_array)
                .filter(([_, v]) => v?.status === "active" && v?.field)
                .map(([k, v]) => ({
                    rootKey: k,
                    dataType: "field-array",
                    mappingFields: Object.entries(v.field)
                        .filter(([_, value]) => value?.status === "active")
                        .map(([field, value]) => ({ [field]: value })),
                    tableAttribute: v.table
                }))
            );
        }

        allResults.push({
            tableOldName: jsonData.table_old_name || table,
            tableNewName: jsonData.table_new_name || table,
            fields: rs
        });
    });

    await Promise.all(promises);
    return allResults;
}

// ✅ Hàm chạy chính
async function main() {
    try {
        const projectId = "614a93e4341f5672f95cblll";
        const tables = ["customer_data", "test1", "test2"];
        const rs = await getDataMappingMultiTablesV2(projectId, tables);

        const outputFilePath = "src/MultiTable_Metadata/output.txt";
        fs.writeFileSync(outputFilePath, JSON.stringify(rs, null, 2), "utf8");
        console.log(`✅ Kết quả đã được ghi vào tệp: ${outputFilePath}`);
    } catch (error) {
        console.error("❌ Lỗi khi chạy hàm:", error);
    }
}


main();
