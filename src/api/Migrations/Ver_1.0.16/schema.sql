START TRANSACTION;
ALTER TABLE `StolenBikeReports` DROP COLUMN `ImagesJson`;

ALTER TABLE `StolenBikeReports` DROP COLUMN `Km`;

ALTER TABLE `StolenBikeReports` DROP COLUMN `Location`;

ALTER TABLE `StolenBikeReports` DROP COLUMN `Price`;

ALTER TABLE `StolenBikeReports` DROP COLUMN `Title`;

ALTER TABLE `BikeListings` DROP COLUMN `IsFavorite`;

ALTER TABLE `BikeListings` DROP COLUMN `IsLiked`;

ALTER TABLE `BikeListings` DROP COLUMN `Km`;

ALTER TABLE `BikeListings` DROP COLUMN `Location`;

ALTER TABLE `BikeListings` DROP COLUMN `Phone`;

ALTER TABLE `BikeListings` DROP COLUMN `SellerId`;

ALTER TABLE `StolenBikeReports` RENAME COLUMN `ReportedAt` TO `StolenDate`;

ALTER TABLE `BikeListings` RENAME COLUMN `SellerName` TO `SellerPhone`;

ALTER TABLE `StolenBikeReports` MODIFY COLUMN `Year` int NOT NULL DEFAULT 0;

UPDATE `StolenBikeReports` SET `Type` = ''
WHERE `Type` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `StolenBikeReports` MODIFY COLUMN `Type` longtext CHARACTER SET utf8mb4 NOT NULL;

UPDATE `StolenBikeReports` SET `Model` = ''
WHERE `Model` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `StolenBikeReports` MODIFY COLUMN `Model` varchar(100) CHARACTER SET utf8mb4 NOT NULL;

UPDATE `StolenBikeReports` SET `Make` = ''
WHERE `Make` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `StolenBikeReports` MODIFY COLUMN `Make` varchar(100) CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `StolenBikeReports` MODIFY COLUMN `Cc` int NOT NULL DEFAULT 0;

ALTER TABLE `StolenBikeReports` ADD `City` varchar(100) CHARACTER SET utf8mb4 NOT NULL DEFAULT '';

ALTER TABLE `StolenBikeReports` ADD `Country` varchar(100) CHARACTER SET utf8mb4 NOT NULL DEFAULT '';

ALTER TABLE `StolenBikeReports` ADD `Edition` varchar(100) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `StolenBikeReports` ADD `Mileage` int NOT NULL DEFAULT 0;

ALTER TABLE `StolenBikeReports` ADD `Phone` varchar(50) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `BikeListings` MODIFY COLUMN `Year` int NOT NULL DEFAULT 0;

UPDATE `BikeListings` SET `Type` = ''
WHERE `Type` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `BikeListings` MODIFY COLUMN `Type` longtext CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `BikeListings` MODIFY COLUMN `Rating` double NOT NULL DEFAULT 0.0;

ALTER TABLE `BikeListings` MODIFY COLUMN `Price` decimal(65,30) NOT NULL DEFAULT 0.0;

UPDATE `BikeListings` SET `Model` = ''
WHERE `Model` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `BikeListings` MODIFY COLUMN `Model` varchar(100) CHARACTER SET utf8mb4 NOT NULL;

UPDATE `BikeListings` SET `Mileage` = ''
WHERE `Mileage` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `BikeListings` MODIFY COLUMN `Mileage` longtext CHARACTER SET utf8mb4 NOT NULL;

UPDATE `BikeListings` SET `Make` = ''
WHERE `Make` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `BikeListings` MODIFY COLUMN `Make` varchar(100) CHARACTER SET utf8mb4 NOT NULL;

UPDATE `BikeListings` SET `Edition` = ''
WHERE `Edition` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `BikeListings` MODIFY COLUMN `Edition` varchar(50) CHARACTER SET utf8mb4 NOT NULL;

UPDATE `BikeListings` SET `Cc` = ''
WHERE `Cc` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `BikeListings` MODIFY COLUMN `Cc` longtext CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `BikeListings` ADD `SellerCity` longtext CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `BikeListings` ADD `SellerCountry` longtext CHARACTER SET utf8mb4 NOT NULL;

CREATE TABLE `Likes` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `EntityId` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Likes` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260818092101_Ver_1.0.16', '9.0.0');

COMMIT;

