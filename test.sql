CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50),
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');
usersINSERT INTO users (name, email) VALUES ('Bob', 'bob@example.com');

update users set email= 'alice_newgmail@gmail.com' where name= 'Alice';

select * from users where name = 'Alice';

delete from users where name='Bob';

// bật để import được từ file;
set global local_infile = 1;

LOAD DATA LOCAL INFILE 'F:/Intern NodeJS/query mybd/output/users.csv'
INTO TABLE users
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(id, name, email, created_at);








