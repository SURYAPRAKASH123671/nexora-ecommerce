CREATE DATABASE IF NOT EXISTS nexora_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'nexora_app'@'localhost' IDENTIFIED BY 'NexoraDev123';
GRANT ALL PRIVILEGES ON nexora_store.* TO 'nexora_app'@'localhost';
FLUSH PRIVILEGES;
