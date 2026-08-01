CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
    `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
) CHARACTER SET=utf8mb4;

START TRANSACTION;
ALTER DATABASE CHARACTER SET utf8mb4;

CREATE TABLE `BikeListings` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Title` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `Make` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Model` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Year` int NULL,
    `Price` decimal(65,30) NULL,
    `Cc` longtext CHARACTER SET utf8mb4 NULL,
    `Type` longtext CHARACTER SET utf8mb4 NULL,
    `SellerId` longtext CHARACTER SET utf8mb4 NULL,
    `SellerName` longtext CHARACTER SET utf8mb4 NULL,
    `Location` longtext CHARACTER SET utf8mb4 NULL,
    `Rating` double NULL,
    `RatingCount` int NOT NULL,
    `Phone` longtext CHARACTER SET utf8mb4 NULL,
    `ImageUrl` varchar(512) CHARACTER SET utf8mb4 NULL,
    `ImagesJson` longtext CHARACTER SET utf8mb4 NULL,
    `Mileage` longtext CHARACTER SET utf8mb4 NULL,
    `Km` longtext CHARACTER SET utf8mb4 NULL,
    `Vin` longtext CHARACTER SET utf8mb4 NULL,
    `Description` longtext CHARACTER SET utf8mb4 NULL,
    `FavoritesCount` int NOT NULL,
    `IsFavorite` tinyint(1) NOT NULL,
    `IsLiked` tinyint(1) NOT NULL,
    `LikeCount` int NOT NULL,
    `ViewCount` int NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_BikeListings` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Blogs` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Title` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `Summary` varchar(500) CHARACTER SET utf8mb4 NULL,
    `Content` longtext CHARACTER SET utf8mb4 NULL,
    `ImageUrl` varchar(512) CHARACTER SET utf8mb4 NULL,
    `Author` varchar(100) CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Blogs` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Challenges` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Title` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NULL,
    `CoverImageUrl` varchar(512) CHARACTER SET utf8mb4 NULL,
    `ImageUrl` varchar(512) CHARACTER SET utf8mb4 NULL,
    `NoOfParticipants` int NOT NULL,
    `StartDate` datetime(6) NOT NULL,
    `EndDate` datetime(6) NOT NULL,
    `IsEnded` tinyint(1) NOT NULL,
    `IsStarted` tinyint(1) NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Challenges` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `ChatMessages` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `SenderId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ReceiverId` char(36) COLLATE ascii_general_ci NOT NULL,
    `SenderName` longtext CHARACTER SET utf8mb4 NULL,
    `SenderProfilePictureUrl` longtext CHARACTER SET utf8mb4 NULL,
    `ReceiverName` longtext CHARACTER SET utf8mb4 NULL,
    `ReceiverProfilePictureUrl` longtext CHARACTER SET utf8mb4 NULL,
    `TextMessage` longtext CHARACTER SET utf8mb4 NULL,
    `SentAt` datetime(6) NOT NULL,
    `Sent` tinyint(1) NOT NULL,
    `Delivered` tinyint(1) NOT NULL,
    `Read` tinyint(1) NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_ChatMessages` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Directories` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Name` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `Address` varchar(300) CHARACTER SET utf8mb4 NULL,
    `City` varchar(100) CHARACTER SET utf8mb4 NULL,
    `State` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Country` varchar(100) CHARACTER SET utf8mb4 NULL,
    `PostalCode` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Phone` varchar(50) CHARACTER SET utf8mb4 NULL,
    `Email` varchar(256) CHARACTER SET utf8mb4 NULL,
    `LogoUrl` varchar(512) CHARACTER SET utf8mb4 NULL,
    `CoverImageUrl` varchar(512) CHARACTER SET utf8mb4 NULL,
    `GoogleMapUrl` varchar(512) CHARACTER SET utf8mb4 NULL,
    `BusinessType` varchar(100) CHARACTER SET utf8mb4 NULL,
    `IsLiked` tinyint(1) NOT NULL,
    `LikesCount` int NOT NULL,
    `Rating` double NULL,
    `RatingCount` int NULL,
    `MyRating` double NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Directories` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `GarageBikes` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Title` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `Make` varchar(50) CHARACTER SET utf8mb4 NULL,
    `Model` varchar(50) CHARACTER SET utf8mb4 NULL,
    `Year` int NULL,
    `Cc` longtext CHARACTER SET utf8mb4 NULL,
    `Type` longtext CHARACTER SET utf8mb4 NULL,
    `ImagesJson` longtext CHARACTER SET utf8mb4 NULL,
    `Mileage` longtext CHARACTER SET utf8mb4 NULL,
    `Km` longtext CHARACTER SET utf8mb4 NULL,
    `Vin` longtext CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_GarageBikes` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Groups` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Title` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `Icon` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Description` longtext CHARACTER SET utf8mb4 NULL,
    `LogoUrl` longtext CHARACTER SET utf8mb4 NULL,
    `CoverPhotoUrl` longtext CHARACTER SET utf8mb4 NULL,
    `IsPrivate` tinyint(1) NOT NULL,
    `MembersCount` int NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Groups` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `LookUps` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Category` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Code` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Value` varchar(256) CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_LookUps` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Messages` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Title` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Body` longtext CHARACTER SET utf8mb4 NULL,
    `DateTimeUTC` datetime(6) NOT NULL,
    `Read` tinyint(1) NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Messages` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `News` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Headline` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `Summary` varchar(500) CHARACTER SET utf8mb4 NULL,
    `Content` longtext CHARACTER SET utf8mb4 NULL,
    `ImageUrl` varchar(512) CHARACTER SET utf8mb4 NULL,
    `Source` varchar(200) CHARACTER SET utf8mb4 NULL,
    `DateTimeUTC` datetime(6) NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_News` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Rides` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Name` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NULL,
    `Distance` decimal(65,30) NOT NULL,
    `Duration` decimal(65,30) NOT NULL,
    `LocationsJson` longtext CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Rides` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Routes` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Name` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NULL,
    `Distance` decimal(65,30) NOT NULL,
    `Duration` decimal(65,30) NOT NULL,
    `OsrmResponseJson` longtext CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Routes` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `StolenBikeReports` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Title` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `Make` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Model` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Year` int NULL,
    `Price` decimal(65,30) NULL,
    `Cc` longtext CHARACTER SET utf8mb4 NULL,
    `Km` longtext CHARACTER SET utf8mb4 NULL,
    `Vin` longtext CHARACTER SET utf8mb4 NULL,
    `Type` longtext CHARACTER SET utf8mb4 NULL,
    `Description` longtext CHARACTER SET utf8mb4 NULL,
    `ImagesJson` longtext CHARACTER SET utf8mb4 NULL,
    `ReportedAt` datetime(6) NOT NULL,
    `Location` longtext CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_StolenBikeReports` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Users` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserName` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `DisplayName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Email` varchar(256) CHARACTER SET utf8mb4 NOT NULL,
    `Address` varchar(200) CHARACTER SET utf8mb4 NULL,
    `City` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Rating` double NULL,
    `RatingCount` int NULL,
    `ProfilePictureUrl` varchar(512) CHARACTER SET utf8mb4 NULL,
    `PasswordHash` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Users` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Medias` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `OwnerId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ObjectName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ContentType` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Size` bigint NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_Medias` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Medias_GarageBikes_OwnerId` FOREIGN KEY (`OwnerId`) REFERENCES `GarageBikes` (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `ChallengeParticipants` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `DistanceInKm` decimal(65,30) NOT NULL,
    `ChallengeId` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_ChallengeParticipants` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ChallengeParticipants_Challenges_ChallengeId` FOREIGN KEY (`ChallengeId`) REFERENCES `Challenges` (`Id`),
    CONSTRAINT `FK_ChallengeParticipants_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `FriendRequests` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `FromUserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ToUserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `Status` int NOT NULL,
    `RespondedAtUTC` datetime(6) NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_FriendRequests` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_FriendRequests_Users_FromUserId` FOREIGN KEY (`FromUserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_FriendRequests_Users_ToUserId` FOREIGN KEY (`ToUserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `SocialProfiles` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `CoverPhotoUrl` varchar(512) CHARACTER SET utf8mb4 NULL,
    `ProfilePhotoUrl` varchar(512) CHARACTER SET utf8mb4 NULL,
    `Bio` longtext CHARACTER SET utf8mb4 NULL,
    `FollowersCount` int NOT NULL,
    `FollowingCount` int NOT NULL,
    `GarageCount` int NOT NULL,
    `RidesCount` int NOT NULL,
    `GarageDistance` longtext CHARACTER SET utf8mb4 NULL,
    `GarageDuration` longtext CHARACTER SET utf8mb4 NULL,
    `GarageElevation` longtext CHARACTER SET utf8mb4 NULL,
    `RideDistance` longtext CHARACTER SET utf8mb4 NULL,
    `RideDuration` longtext CHARACTER SET utf8mb4 NULL,
    `RideElevation` longtext CHARACTER SET utf8mb4 NULL,
    `SocialLinksJson` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_SocialProfiles` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_SocialProfiles_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `SocialPosts` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `Content` longtext CHARACTER SET utf8mb4 NULL,
    `LoveCount` int NOT NULL,
    `CommentCount` int NOT NULL,
    `ShareCount` int NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `SocialProfileEntityId` char(36) COLLATE ascii_general_ci NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_SocialPosts` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_SocialPosts_SocialProfiles_SocialProfileEntityId` FOREIGN KEY (`SocialProfileEntityId`) REFERENCES `SocialProfiles` (`Id`),
    CONSTRAINT `FK_SocialPosts_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `SocialProfileFollowers` (
    `SocialProfileId` char(36) COLLATE ascii_general_ci NOT NULL,
    `FollowerUserId` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_SocialProfileFollowers` PRIMARY KEY (`SocialProfileId`, `FollowerUserId`),
    CONSTRAINT `FK_SocialProfileFollowers_SocialProfiles_SocialProfileId` FOREIGN KEY (`SocialProfileId`) REFERENCES `SocialProfiles` (`Id`),
    CONSTRAINT `FK_SocialProfileFollowers_Users_FollowerUserId` FOREIGN KEY (`FollowerUserId`) REFERENCES `Users` (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `SocialProfileFollowing` (
    `SocialProfileId` char(36) COLLATE ascii_general_ci NOT NULL,
    `FollowingUserId` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_SocialProfileFollowing` PRIMARY KEY (`SocialProfileId`, `FollowingUserId`),
    CONSTRAINT `FK_SocialProfileFollowing_SocialProfiles_SocialProfileId` FOREIGN KEY (`SocialProfileId`) REFERENCES `SocialProfiles` (`Id`),
    CONSTRAINT `FK_SocialProfileFollowing_Users_FollowingUserId` FOREIGN KEY (`FollowingUserId`) REFERENCES `Users` (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `SocialProfileFriends` (
    `SocialProfileId` char(36) COLLATE ascii_general_ci NOT NULL,
    `FriendUserId` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_SocialProfileFriends` PRIMARY KEY (`SocialProfileId`, `FriendUserId`),
    CONSTRAINT `FK_SocialProfileFriends_SocialProfiles_SocialProfileId` FOREIGN KEY (`SocialProfileId`) REFERENCES `SocialProfiles` (`Id`),
    CONSTRAINT `FK_SocialProfileFriends_Users_FriendUserId` FOREIGN KEY (`FriendUserId`) REFERENCES `Users` (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `SocialPostComments` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `PostId` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `ParentCommentId` char(36) COLLATE ascii_general_ci NULL,
    `Content` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_SocialPostComments` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_SocialPostComments_SocialPostComments_ParentCommentId` FOREIGN KEY (`ParentCommentId`) REFERENCES `SocialPostComments` (`Id`),
    CONSTRAINT `FK_SocialPostComments_SocialPosts_PostId` FOREIGN KEY (`PostId`) REFERENCES `SocialPosts` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_SocialPostComments_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `SocialPostLikes` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `PostId` char(36) COLLATE ascii_general_ci NOT NULL,
    `UserId` char(36) COLLATE ascii_general_ci NOT NULL,
    `LikedAtUTC` datetime(6) NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_SocialPostLikes` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_SocialPostLikes_SocialPosts_PostId` FOREIGN KEY (`PostId`) REFERENCES `SocialPosts` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_SocialPostLikes_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `SocialPostMedias` (
    `Id` char(36) COLLATE ascii_general_ci NOT NULL,
    `PostId` char(36) COLLATE ascii_general_ci NOT NULL,
    `MediaGuid` char(36) COLLATE ascii_general_ci NOT NULL,
    `ObjectName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `OriginalFileName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ContentType` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Size` bigint NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CreatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `UpdatedById` char(36) COLLATE ascii_general_ci NOT NULL,
    `RowVersion` char(36) COLLATE ascii_general_ci NOT NULL,
    CONSTRAINT `PK_SocialPostMedias` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_SocialPostMedias_SocialPosts_PostId` FOREIGN KEY (`PostId`) REFERENCES `SocialPosts` (`Id`)
) CHARACTER SET=utf8mb4;

CREATE UNIQUE INDEX `IX_ChallengeParticipants_ChallengeId_UserId` ON `ChallengeParticipants` (`ChallengeId`, `UserId`);

CREATE INDEX `IX_ChallengeParticipants_UserId` ON `ChallengeParticipants` (`UserId`);

CREATE INDEX `IX_FriendRequests_FromUserId` ON `FriendRequests` (`FromUserId`);

CREATE INDEX `IX_FriendRequests_ToUserId` ON `FriendRequests` (`ToUserId`);

CREATE INDEX `IX_Medias_OwnerId` ON `Medias` (`OwnerId`);

CREATE INDEX `IX_SocialPostComments_ParentCommentId` ON `SocialPostComments` (`ParentCommentId`);

CREATE INDEX `IX_SocialPostComments_PostId` ON `SocialPostComments` (`PostId`);

CREATE INDEX `IX_SocialPostComments_UserId` ON `SocialPostComments` (`UserId`);

CREATE INDEX `IX_SocialPostLikes_PostId` ON `SocialPostLikes` (`PostId`);

CREATE INDEX `IX_SocialPostLikes_UserId` ON `SocialPostLikes` (`UserId`);

CREATE INDEX `IX_SocialPostMedias_PostId` ON `SocialPostMedias` (`PostId`);

CREATE INDEX `IX_SocialPosts_SocialProfileEntityId` ON `SocialPosts` (`SocialProfileEntityId`);

CREATE INDEX `IX_SocialPosts_UserId` ON `SocialPosts` (`UserId`);

CREATE INDEX `IX_SocialProfileFollowers_FollowerUserId` ON `SocialProfileFollowers` (`FollowerUserId`);

CREATE INDEX `IX_SocialProfileFollowing_FollowingUserId` ON `SocialProfileFollowing` (`FollowingUserId`);

CREATE INDEX `IX_SocialProfileFriends_FriendUserId` ON `SocialProfileFriends` (`FriendUserId`);

CREATE INDEX `IX_SocialProfiles_UserId` ON `SocialProfiles` (`UserId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260726122343_Ver_1.0.0', '9.0.0');

COMMIT;

