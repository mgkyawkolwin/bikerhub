START TRANSACTION;
ALTER TABLE `Users` ADD `Phone` varchar(32) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `SocialProfiles` ADD `ListingCount` int NOT NULL DEFAULT 0;

ALTER TABLE `SocialProfiles` ADD `PlanCount` int NOT NULL DEFAULT 0;

ALTER TABLE `GarageBikes` ADD `Edition` varchar(100) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `BikeListings` ADD `IsReported` tinyint(1) NOT NULL DEFAULT FALSE;

ALTER TABLE `BikeListings` ADD `IsSold` tinyint(1) NOT NULL DEFAULT FALSE;

CREATE TABLE `GarageBikeServiceHistory` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `GarageBikeId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ServiceType` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `ServiceDate` datetime(6) NOT NULL,
    `Mileage` int NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_GarageBikeServiceHistory` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_GarageBikeServiceHistory_GarageBikes_GarageBikeId` FOREIGN KEY (`GarageBikeId`) REFERENCES `GarageBikes` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_GarageBikeServiceHistory_GarageBikeId_ServiceType_ServiceDate` ON `GarageBikeServiceHistory` (`GarageBikeId`, `ServiceType`, `ServiceDate`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260914114423_Ver_1.0.21', '9.0.0');

COMMIT;

