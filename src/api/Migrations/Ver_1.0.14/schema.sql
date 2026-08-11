START TRANSACTION;
DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260809121602_Ver_1.0.14') THEN

    ALTER TABLE `Directories` DROP COLUMN `IsLiked`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260809121602_Ver_1.0.14') THEN

    ALTER TABLE `Directories` DROP COLUMN `MyRating`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260809121602_Ver_1.0.14') THEN

    ALTER TABLE `Directories` RENAME COLUMN `LikesCount` TO `FavoriteCount`;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260809121602_Ver_1.0.14') THEN

    CREATE TABLE `Favorites` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `EntityId` char(36) COLLATE ascii_general_ci NOT NULL,
        `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
        `CreatedAtUtc` datetime(6) NOT NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `UpdatedAtUtc` datetime(6) NOT NULL,
        `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
        CONSTRAINT `PK_Favorites` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260809121602_Ver_1.0.14') THEN

    CREATE TABLE `Ratings` (
        `Id` char(36) COLLATE ascii_general_ci NOT NULL,
        `EntityId` char(36) COLLATE ascii_general_ci NOT NULL,
        `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
        `Rating` int NOT NULL,
        `CreatedAtUtc` datetime(6) NOT NULL,
        `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `UpdatedAtUtc` datetime(6) NOT NULL,
        `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
        `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
        CONSTRAINT `PK_Ratings` PRIMARY KEY (`Id`)
    ) CHARACTER SET=utf8mb4;

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

DROP PROCEDURE IF EXISTS MigrationsScript;
DELIMITER //
CREATE PROCEDURE MigrationsScript()
BEGIN
    IF NOT EXISTS(SELECT 1 FROM `__EFMigrationsHistory` WHERE `MigrationId` = '20260809121602_Ver_1.0.14') THEN

    INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
    VALUES ('20260809121602_Ver_1.0.14', '9.0.0');

    END IF;
END //
DELIMITER ;
CALL MigrationsScript();
DROP PROCEDURE MigrationsScript;

COMMIT;

