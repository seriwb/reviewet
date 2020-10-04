CREATE DATABASE reviewet CHARACTER SET utf8mb4;
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'admin';
CREATE USER 'admin'@'127.0.0.1' IDENTIFIED BY 'admin';
GRANT ALL ON *.* TO 'admin'@'%' WITH GRANT OPTION;
GRANT ALL ON *.* TO 'admin'@'localhost' WITH GRANT OPTION;
GRANT ALL ON *.* TO 'admin'@'127.0.0.1' WITH GRANT OPTION;
FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS `review` (
    `id` bigint(20) NOT NULL COMMENT 'レビューID',
    `kind` VARCHAR(255) COMMENT 'アプリのOS種別',
    `app_name` VARCHAR(255) COMMENT 'アプリ名',
    `code` VARCHAR(2) COMMENT '言語／国コード',
    `title` VARCHAR(255) COMMENT 'レビュータイトル',
    `message` TEXT COMMENT 'レビュー内容',
    `rating` INT(1) UNSIGNED COMMENT '評価',
    `posted_at` VARCHAR(255) COMMENT 'レビュー投稿日（日付の文字列）',
    `version` VARCHAR(255) COMMENT 'レビューしたアプリのバージョン',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登録日時',
    PRIMARY KEY (`id`, `kind`),
    INDEX `idx_review_01` (`app_name`),
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='レビュー情報';
