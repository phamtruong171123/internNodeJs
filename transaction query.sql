SHOW VARIABLES LIKE 'autocommit';
SET autocommit = 0;

-- test rollback

START TRANSACTION;
INSERT INTO users (name, email) VALUES ('Alice1', 'alice@example.com');
INSERT INTO users (name, email) VALUES ('Bob', 'bob@example.com');
commit;
select count(*) from users;

delete from users;
ROLLBACK;


