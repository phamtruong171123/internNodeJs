async function getAllFields(): Promise<FieldArray[] | null> {
    console.time("Thời gian thực thi");

    try {
        // Đọc file input.txt
        const rawData = fs.readFileSync("src/input.txt", "utf8");
        const json: any[] = JSON.parse(rawData);

        if (json.length === 0) return null;

        const data = json[0];
        const parentTable = data?.table_new_name ?? "";

        const fieldNormal: FieldArray[] = Object.entries(data?.field_normal as Record<string, Field> ?? {})
    .filter(([_, v]) => v.status !== "deleted")
    .map(([k, v]) => ({
        rootKey: k,
        fieldName: v.name,
        dataType: v.type,
        parentTable,
        tableAttribute: "",
        isAttribute: false
    }));

const fieldObject: FieldArray[] = Object.entries(data?.field_object as Record<string, FieldObject> ?? {})
    .flatMap(([k, v]) =>
        Object.entries(v.field as Record<string, Field> ?? {})
            .filter(([_, value]) => value.status !== "deleted")
            .map(([field, value]) => ({
                rootKey: `${k}.${field}`,
                fieldName: value.name,
                dataType: value.type,
                parentTable,
                tableAttribute: "",
                isAttribute: false
            }))
    );

const fieldArray: FieldArray[] = Object.entries(data?.field_array as Record<string, FieldObject & { table?: string }> ?? {})
    .flatMap(([k, v]) =>
        Object.entries(v.field as Record<string, Field> ?? {})
            .filter(([_, value]) => value.status !== "deleted")
            .map(([field, value]) => ({
                rootKey: `${k}.${field}`,
                fieldName: value.name,
                dataType: value.type,
                parentTable: "",
                tableAttribute: v?.table ?? "",
                isAttribute: true
            }))
    );


        
        const rs = [...fieldNormal, ...fieldObject, ...fieldArray];

        console.timeEnd("Thời gian thực thi");
        return rs.length > 0 ? rs : null;
    } catch (error) {
        console.error("Lỗi khi đọc dữ liệu từ input.txt:", error);
        console.timeEnd("Thời gian thực thi");
        return null;
    }
}