using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikerHub.Migrations
{
    /// <inheritdoc />
    public partial class laldf : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChallengeParticipants_Challenges_ChallengeId",
                table: "ChallengeParticipants");

            migrationBuilder.DropForeignKey(
                name: "FK_ChallengeParticipants_Users_UserId",
                table: "ChallengeParticipants");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostMedias_SocialPosts_PostId",
                table: "SocialPostMedias");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFollowers_SocialProfiles_SocialProfileId",
                table: "SocialProfileFollowers");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFollowers_Users_FollowerUserId",
                table: "SocialProfileFollowers");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFollowing_SocialProfiles_SocialProfileId",
                table: "SocialProfileFollowing");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFollowing_Users_FollowingUserId",
                table: "SocialProfileFollowing");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFriends_SocialProfiles_SocialProfileId",
                table: "SocialProfileFriends");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFriends_Users_FriendUserId",
                table: "SocialProfileFriends");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfiles_Users_UserId",
                table: "SocialProfiles");

            migrationBuilder.CreateTable(
                name: "Medias",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    OwnerId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ObjectName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ContentType = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Size = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreatedById = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedById = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    RowVersion = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Medias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Medias_GarageBikes_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "GarageBikes",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Medias_OwnerId",
                table: "Medias",
                column: "OwnerId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChallengeParticipants_Challenges_ChallengeId",
                table: "ChallengeParticipants",
                column: "ChallengeId",
                principalTable: "Challenges",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ChallengeParticipants_Users_UserId",
                table: "ChallengeParticipants",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostMedias_SocialPosts_PostId",
                table: "SocialPostMedias",
                column: "PostId",
                principalTable: "SocialPosts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfileFollowers_SocialProfiles_SocialProfileId",
                table: "SocialProfileFollowers",
                column: "SocialProfileId",
                principalTable: "SocialProfiles",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfileFollowers_Users_FollowerUserId",
                table: "SocialProfileFollowers",
                column: "FollowerUserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfileFollowing_SocialProfiles_SocialProfileId",
                table: "SocialProfileFollowing",
                column: "SocialProfileId",
                principalTable: "SocialProfiles",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfileFollowing_Users_FollowingUserId",
                table: "SocialProfileFollowing",
                column: "FollowingUserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfileFriends_SocialProfiles_SocialProfileId",
                table: "SocialProfileFriends",
                column: "SocialProfileId",
                principalTable: "SocialProfiles",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfileFriends_Users_FriendUserId",
                table: "SocialProfileFriends",
                column: "FriendUserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfiles_Users_UserId",
                table: "SocialProfiles",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChallengeParticipants_Challenges_ChallengeId",
                table: "ChallengeParticipants");

            migrationBuilder.DropForeignKey(
                name: "FK_ChallengeParticipants_Users_UserId",
                table: "ChallengeParticipants");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostMedias_SocialPosts_PostId",
                table: "SocialPostMedias");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFollowers_SocialProfiles_SocialProfileId",
                table: "SocialProfileFollowers");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFollowers_Users_FollowerUserId",
                table: "SocialProfileFollowers");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFollowing_SocialProfiles_SocialProfileId",
                table: "SocialProfileFollowing");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFollowing_Users_FollowingUserId",
                table: "SocialProfileFollowing");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFriends_SocialProfiles_SocialProfileId",
                table: "SocialProfileFriends");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFriends_Users_FriendUserId",
                table: "SocialProfileFriends");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfiles_Users_UserId",
                table: "SocialProfiles");

            migrationBuilder.DropTable(
                name: "Medias");

            migrationBuilder.AddForeignKey(
                name: "FK_ChallengeParticipants_Challenges_ChallengeId",
                table: "ChallengeParticipants",
                column: "ChallengeId",
                principalTable: "Challenges",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ChallengeParticipants_Users_UserId",
                table: "ChallengeParticipants",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostMedias_SocialPosts_PostId",
                table: "SocialPostMedias",
                column: "PostId",
                principalTable: "SocialPosts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfileFollowers_SocialProfiles_SocialProfileId",
                table: "SocialProfileFollowers",
                column: "SocialProfileId",
                principalTable: "SocialProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfileFollowers_Users_FollowerUserId",
                table: "SocialProfileFollowers",
                column: "FollowerUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfileFollowing_SocialProfiles_SocialProfileId",
                table: "SocialProfileFollowing",
                column: "SocialProfileId",
                principalTable: "SocialProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfileFollowing_Users_FollowingUserId",
                table: "SocialProfileFollowing",
                column: "FollowingUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfileFriends_SocialProfiles_SocialProfileId",
                table: "SocialProfileFriends",
                column: "SocialProfileId",
                principalTable: "SocialProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfileFriends_Users_FriendUserId",
                table: "SocialProfileFriends",
                column: "FriendUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfiles_Users_UserId",
                table: "SocialProfiles",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
