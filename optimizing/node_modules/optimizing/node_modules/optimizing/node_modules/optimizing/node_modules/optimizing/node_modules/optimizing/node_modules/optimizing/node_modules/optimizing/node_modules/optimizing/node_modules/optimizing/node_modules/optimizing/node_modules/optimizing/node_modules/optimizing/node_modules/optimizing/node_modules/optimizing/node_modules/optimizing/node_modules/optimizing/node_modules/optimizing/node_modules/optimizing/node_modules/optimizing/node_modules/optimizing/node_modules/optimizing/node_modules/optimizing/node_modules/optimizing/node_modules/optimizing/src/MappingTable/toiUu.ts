import * as fs from "fs";

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

async function getDataMappingOneTableV2(table: string, projectId: string): Promise<any> {
    let rawData;
    try {
        rawData = fs.readFileSync("src/MappingTable/input.txt", "utf8");
    } catch (error) {
        console.error("Lỗi khi đọc file:", error);
        return { tableOldName: table, tableNewName: "", fields: [] };
    }

    let json: { 
        field_normal?: Record<string, Field>, 
        field_object?: Record<string, FieldObject>, 
        field_array?: Record<string, FieldArray>, 
        table_old_name?: string, 
        table_new_name?: string 
    }[] = [];

    try {
        json = JSON.parse(rawData);
    } catch (error) {
        console.error("Lỗi khi parse JSON:", error);
        return { tableOldName: table, tableNewName: "", fields: [] };
    }

    if (!json || json.length === 0 || !json[0]) {
        console.error("Dữ liệu JSON rỗng hoặc không hợp lệ.");
        return { tableOldName: "", tableNewName: "", fields: [] };
    }

    let rs: FieldMapper[] = [];

    // Xử lý field_normal
    rs = Object.entries(json[0]?.field_normal || {})
        .filter(([_, v]) => v?.status === "active")
        .map(([k, v]) => new FieldMapper(k, "normal", [{ [k]: { name: v.name, type: v.type, status: v.status } }]));

    // Xử lý field_object
    rs.push(
        ...Object.entries(json[0]?.field_object || {})
            .filter(([_, v]) => v?.status === "active" && v?.field)
            .map(([k, v]) => new FieldMapper(k, "object", 
                Object.entries(v.field)
                    .filter(([_, value]) => value?.status === "active")
                    .map(([field, value]) => ({ [field]: value }))
            ))
    );

    // Xử lý field_array
    rs.push(
        ...Object.entries(json[0]?.field_array || {})
            .filter(([_, v]) => v?.status === "active" && v?.field)
            .map(([k, v]) => new FieldMapper(k, "array-object", 
                Object.entries(v.field)
                    .filter(([_, value]) => value?.status === "active")
                    .map(([field, value]) => ({ [field]: value })),
                v.table
            ))
    );

    return {
        tableOldName: json[0]?.table_old_name || "data_customer",
        tableNewName: json[0]?.table_new_name || "data_customer",
        fields: rs
    };
}

async function main() {
    console.time("Thời gian thực thi");

    const rs = await getDataMappingOneTableV2("data_customer", "675f9498372a86002433b0b0");
    console.log(JSON.stringify(rs, null, 2));

    console.timeEnd("Thời gian thực thi");
}

main();
