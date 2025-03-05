#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>

#define NUM_USERS 1000000  // 1 triệu người
#define MAX_NAME_LENGTH 50

// Danh sách họ, tên đệm, và tên có sẵn
const char *firstNames[] = {"Nguyen", "Tran", "Le", "Pham", "Hoang", "Phan", "Vu", "Dang", "Bui", "Do"};
const char *middleNames[] = {"Van", "Thi", "Minh", "Duc", "Huu", "Quang", "Anh", "Xuan", "Bao", "Ngoc"};
const char *lastNames[] = {"Anh", "Binh", "Chien", "Dai", "Dung", "Huy", "Khanh", "Lam", "Linh", "Nam"};

#define FIRST_NAME_COUNT (sizeof(firstNames) / sizeof(firstNames[0]))
#define MIDDLE_NAME_COUNT (sizeof(middleNames) / sizeof(middleNames[0]))
#define LAST_NAME_COUNT (sizeof(lastNames) / sizeof(lastNames[0]))

void generateUser(int id, char *fullName, char *email, char *createdAt) {
    // Chọn ngẫu nhiên họ, tên đệm, tên
    const char *firstName = firstNames[rand() % FIRST_NAME_COUNT];
    const char *middleName = middleNames[rand() % MIDDLE_NAME_COUNT];
    const char *lastName = lastNames[rand() % LAST_NAME_COUNT];

    // Ghép thành họ tên đầy đủ
    snprintf(fullName, MAX_NAME_LENGTH, "%s %s %s", firstName, middleName, lastName);

    // Tạo email theo tên + số ngẫu nhiên
    int randomNum = rand() % 10000;  // Số ngẫu nhiên để tránh trùng email
    snprintf(email, MAX_NAME_LENGTH, "%s.%s%d@gmail.com", firstName, lastName, randomNum);

    // Sinh ngày tạo (created_at) trong khoảng 5 năm gần đây
    time_t now = time(NULL);
    time_t randomTime = now - (rand() % (5 * 365 * 24 * 3600)); // Trừ ngẫu nhiên tối đa 5 năm

    struct tm *timeinfo = localtime(&randomTime);
    strftime(createdAt, 20, "%Y-%m-%d %H:%M:%S", timeinfo);
}

int main() {
    FILE *file = fopen("users1.csv", "w");
    if (file == NULL) {
        printf("Không thể mở file để ghi!\n");
        return 1;
    }

    srand(time(NULL));  // Khởi tạo seed cho số ngẫu nhiên

    // Ghi tiêu đề CSV
    fprintf(file, "id,full_name,email,created_at\n");

    // Tạo dữ liệu 1 triệu user
    for (int i = 1; i <= NUM_USERS; i++) {
        char fullName[MAX_NAME_LENGTH];
        char email[MAX_NAME_LENGTH];
        char createdAt[20];

        generateUser(i, fullName, email, createdAt);
        fprintf(file, "%d,%s,%s,%s\n", i, fullName, email, createdAt);

        // Hiển thị tiến trình sau mỗi 100.000 dòng
        if (i % 100000 == 0) {
            printf("Đã tạo %d user...\n", i);
        }
    }

    fclose(file);
    printf("✅ Đã tạo xong 1 triệu user trong file 'users.csv'!\n");

    return 0;
}
