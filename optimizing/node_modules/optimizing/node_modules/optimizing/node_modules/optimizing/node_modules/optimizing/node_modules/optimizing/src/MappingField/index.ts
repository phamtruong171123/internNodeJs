import mongoose, { Document, Schema } from 'mongoose';
import fs from 'fs';


const connectMongoDB = async () => {
    if (mongoose.connection.readyState === 1) {
        //console.log("✅ MongoDB đã được kết nối.");
        return;
    }
    try {
        await mongoose.connect('mongodb://localhost:27017/mydb');  
       // console.log("✅ Kết nối MongoDB thành công!");
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

// ✅ Class để truy vấn MongoDB
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
    
                //console.log(" Dữ liệu trả về từ MongoDB:", JSON.stringify(result, null, 2));
                return result;
            } catch (error) {
                console.error(" Lỗi khi truy vấn MongoDB:", error);
                return null;
            }
        }

    // ✅ Hàm lấy mapping của một trường
    async getFieldMapping(projectId: string, table: string, key: string) {
        try {
            await connectMongoDB();

            // Lấy dữ liệu mapping từ bảng
            const jsonData = await this.getDataFromMapping(projectId, table);

            if (!jsonData) {
                return { status: 0, message: "get data unsuccessful", data: null };
            }

            let fieldName = key;
            let tableAttribute = "";
            let parentTable = table;
            let isAttribute = false;
            let fieldRoot = "";
            let dataType = "unknown";

            // Nếu key không chứa dấu chấm, tìm trong field_normal
            if (!key.includes(".")) {
                if (jsonData.field_normal && jsonData.field_normal[key]) {
                    const field = jsonData.field_normal[key];
                    return {
                        status: 1,
                        message: "get data success !",
                        data: {
                            fieldName: key,
                            tableAttribute: "",
                            parentTable: table,
                            isAttribute: false,
                            fieldRoot: "",
                            dataType: field.type || "unknown"
                        }
                    };
                }
            } else {
                // Nếu key chứa dấu chấm (dạng `object.field`)
                const [rootField, subField] = key.split(".");

                // Kiểm tra trong field_object
                if (jsonData.field_object && jsonData.field_object[rootField]) {
                    const objectField = jsonData.field_object[rootField];
                    if (objectField.field[subField]) {
                        const field = objectField.field[subField];
                        return {
                            status: 1,
                            message: "get data success !",
                            data: {
                                fieldName: subField,
                                tableAttribute: "",
                                parentTable: table,
                                isAttribute: true,
                                fieldRoot: rootField,
                                dataType: field.type || "unknown"
                            }
                        };
                    }
                }

                // Kiểm tra trong field_array (array-object)
                if (jsonData.field_array && jsonData.field_array[rootField]) {
                    const arrayField = jsonData.field_array[rootField];
                    if (arrayField.field[subField]) {
                        const field = arrayField.field[subField];
                        return {
                            status: 1,
                            message: "get data success !",
                            data: {
                                fieldName: subField,
                                tableAttribute: arrayField.table || "",
                                parentTable: table,
                                isAttribute: true,
                                fieldRoot: rootField,
                                dataType: field.type || "unknown"
                            }
                        };
                    }
                }
            }

            // Nếu không tìm thấy key trong mapping
            return { status: 0, message: `Không tìm thấy key '${key}' trong bảng '${table}'`, data: null };

        } catch (error) {
            console.error("❌ Lỗi khi lấy field mapping:", error);
            return { status: 0, message: "Lỗi hệ thống", data: null };
        }
    }
}

// ✅ Hàm chạy chính
async function main() {
    try {
        const mongodbDao = new MongoDbDao();
        const projectId = "614a93e4341f5672f95cblll";
        const table = "customer_data";

        // Test lấy field_normal
        console.log(await mongodbDao.getFieldMapping(projectId, table, "first_source_ad_param_4"));

        // Test lấy field trong object
        console.log(await mongodbDao.getFieldMapping(projectId, table, "created_by.sale_id"));

        // Test lấy field trong array-object
        console.log(await mongodbDao.getFieldMapping(projectId, table, "array1.field"));
        

    } catch (error) {
        console.error("❌ Lỗi khi chạy hàm:", error);
    }
}

// 🚀 Chạy chương trình
main();
