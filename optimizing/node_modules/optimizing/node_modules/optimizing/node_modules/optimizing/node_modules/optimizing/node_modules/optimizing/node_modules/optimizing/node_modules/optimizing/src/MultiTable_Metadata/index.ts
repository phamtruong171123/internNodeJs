import * as fs from "fs";

// 🏗️ Khai báo Interface để ánh xạ dữ liệu
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


class FieldMapper {
    rootKey: string;
    dataType: string;
    mappingFields?: any[];
    tableAttribute?: string;

    constructor(rootKey: string, dataType: string, mappingFields?: any[], tableAttribute?: string) {
        this.rootKey = rootKey;
        this.dataType = dataType;
        this.mappingFields = mappingFields || [];
        this.tableAttribute = tableAttribute || ""; 
    }
}

async function getDataMappingMultiTableV2(projectId: string): Promise<any[]> {
    let rawData;
    try {
        rawData = fs.readFileSync("src/MultiTable_Metadata/input.txt", "utf8");
    } catch (error) {
        console.error(" Lỗi khi đọc file:", error);
        return [];
    }

    let jsonArray: { 
        field_normal?: Record<string, Field>, 
        field_object?: Record<string, FieldObject>, 
        field_array?: Record<string, FieldArray>, 
        table_old_name?: string, 
        table_new_name?: string 
    }[] = [];

    try {
        jsonArray = JSON.parse(rawData);
    } catch (error) {
        console.error(" Lỗi khi parse JSON:", error);
        return [];
    }

    if (!jsonArray || jsonArray.length === 0) {
        console.error(" Dữ liệu JSON rỗng hoặc không hợp lệ.");
        return [];
    }

    let result: any[] = [];

    for (const json of jsonArray) {
        let rs: FieldMapper[] = [];

        //  Xử lý field_normal
        if (json.field_normal) {
            for (let [k, v] of Object.entries(json.field_normal)) {
                if (v?.status === "active") {  
                    let fieldOb = new FieldMapper(k, "normal");
                    fieldOb.mappingFields = [{ [k]: { name: v.name, type: v.type, status: v.status } }];
                    rs.push(fieldOb);
                }
            }
        }

        //  Xử lý field_object
        if (json.field_object) {
            for (let [k, v] of Object.entries(json.field_object)) {
                if (v?.status === "active" && v?.field) {
                    let fieldOb = new FieldMapper(k, "object");
                    fieldOb.mappingFields = Object.entries(v.field)
                        .filter(([_, value]) => value?.status === "active") 
                        .map(([field, value]) => ({ [field]: value }));
                    rs.push(fieldOb);
                }
            }
        }

        //  Xử lý field_array
        if (json.field_array) {
            for (let [k, v] of Object.entries(json.field_array)) {
                if (v?.status === "active" && v?.field) {
                    let fieldOb = new FieldMapper(k, "field-array", [], v.table);
                    fieldOb.mappingFields = Object.entries(v.field)
                        .filter(([_, value]) => value?.status === "active")
                        .map(([field, value]) => ({ [field]: value }));
                    rs.push(fieldOb);
                }
            }
        }

        result.push({
            tableOldName: json?.table_old_name || "unknown_table",
            tableNewName: json?.table_new_name || "unknown_table",
            fields: rs
        });
    }

    return result;
}


async function main() {
    console.time("⏳ Thời gian thực thi");
    try {
        const projectId = "675f9498372a86002433b0b0";
        const rs = await getDataMappingMultiTableV2(projectId);

        // Chuyển đổi kết quả thành chuỗi JSON và ghi vào file output.txt
        const outputFilePath = "src/MultiTable_Metadata/output.txt";
        fs.writeFileSync(outputFilePath, JSON.stringify(rs, null, 2), "utf8");
        console.log(` Kết quả đã được ghi vào tệp: ${outputFilePath}`);

    } catch (error) {
        console.error(" Lỗi khi chạy hàm:", error);
    }
    console.timeEnd(" Thời gian thực thi");
}


main();
