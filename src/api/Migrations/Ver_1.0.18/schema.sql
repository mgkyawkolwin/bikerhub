START TRANSACTION;
ALTER TABLE `ChatMessages` DROP COLUMN `ReceiverName`;

ALTER TABLE `ChatMessages` DROP COLUMN `ReceiverProfilePictureUrl`;

ALTER TABLE `ChatMessages` DROP COLUMN `SenderName`;

ALTER TABLE `ChatMessages` DROP COLUMN `SenderProfilePictureUrl`;

ALTER TABLE `ChatMessages` DROP COLUMN `SentAt`;

ALTER TABLE `Blogs` DROP COLUMN `Author`;

ALTER TABLE `Blogs` DROP COLUMN `ImageUrl`;

ALTER TABLE `Blogs` DROP COLUMN `Summary`;

ALTER TABLE `Messages` ADD `ParentMessageId` char(36) COLLATE ascii_general_ci NULL;

ALTER TABLE `Medias` ADD `BlogEntityId` char(36) COLLATE ascii_general_ci NULL;

ALTER TABLE `ChatMessages` ADD `MessageType` int NOT NULL DEFAULT 0;

UPDATE `Blogs` SET `Content` = ''
WHERE `Content` IS NULL;
SELECT ROW_COUNT();


ALTER TABLE `Blogs` MODIFY COLUMN `Content` longtext CHARACTER SET utf8mb4 NOT NULL;

ALTER TABLE `Blogs` ADD `AuthorName` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT '';

ALTER TABLE `Blogs` ADD `CoverImageUrl` varchar(512) CHARACTER SET utf8mb4 NOT NULL DEFAULT '';

ALTER TABLE `Blogs` ADD `PostTypeId` char(36) COLLATE ascii_general_ci NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

CREATE TABLE `Plans` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Title` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `Description` varchar(500) CHARACTER SET utf8mb4 NOT NULL,
    `Distance` decimal(65,30) NOT NULL,
    `Duration` decimal(65,30) NOT NULL,
    `Elevation` decimal(65,30) NOT NULL,
    `TripDateTimeUtc` datetime(6) NOT NULL,
    `LocationsJson` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Plans` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `PlanRiderEntity` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `PlanId` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `Confirmed` tinyint(1) NOT NULL,
    `PlanEntityId` char(36) COLLATE ascii_general_ci NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_PlanRiderEntity` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_PlanRiderEntity_Plans_PlanEntityId` FOREIGN KEY (`PlanEntityId`) REFERENCES `Plans` (`Id`)
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_Medias_BlogEntityId` ON `Medias` (`BlogEntityId`);

CREATE INDEX `IX_PlanRiderEntity_PlanEntityId` ON `PlanRiderEntity` (`PlanEntityId`);

ALTER TABLE `Medias` ADD CONSTRAINT `FK_Medias_Blogs_BlogEntityId` FOREIGN KEY (`BlogEntityId`) REFERENCES `Blogs` (`Id`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260831110148_Ver_1.0.18', '9.0.0');

COMMIT;

