import pandas as pd # type: ignore

# 📂 Đường dẫn file gốc
input_csv = r"F:/Intern NodeJS/internNodeJs/output\users1.csv"


# 🔹 Đọc file CSV
df = pd.read_csv(input_csv)

# 🔢 Số lượng partition (đã tạo trong MySQL/TiDB)
num_partitions = 5

# 🔄 Chia file CSV thành từng partition theo MOD(id, 5)
for i in range(num_partitions):
    partition_df = df[df['id'] % num_partitions == i]
    output_file = f"F:/Intern NodeJS/internNodeJs/output/users_partition_{i}.csv"
    partition_df.to_csv(output_file, index=False)
    print(f"✅ Created partition file: {output_file} ({len(partition_df)} rows)")
