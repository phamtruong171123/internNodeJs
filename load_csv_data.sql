CREATE PROCEDURE load_csv_data(IN file_path VARCHAR(255))
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT '❌ Dữ liệu import thất bại' AS message;
    END;

    START TRANSACTION;

    SET @query = CONCAT(
        "LOAD DATA LOCAL INFILE '", file_path, "' ",
        "INTO TABLE users ",
        "FIELDS TERMINATED BY ',' ",
        "LINES TERMINATED BY '\n' ",
        "IGNORE 1 LINES ",
        "(id, name, email, created_at)"
    );

    PREPARE stmt FROM @query;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;

    COMMIT;
    SELECT 'Import thành công!' AS message;
END;