using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikerHub.Migrations
{
    /// <inheritdoc />
    public partial class ioe : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FriendRequests_SocialProfiles_FromProfileId",
                table: "FriendRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_FriendRequests_SocialProfiles_ToProfileId",
                table: "FriendRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_Posts_SocialProfiles_SocialProfileId",
                table: "Posts");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostComments_SocialProfiles_CreatedByProfileId",
                table: "SocialPostComments");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostLikes_SocialProfiles_LikedByProfileId",
                table: "SocialPostLikes");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFriends_SocialProfiles_FriendId",
                table: "SocialProfileFriends");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFriends_SocialProfiles_ProfileId",
                table: "SocialProfileFriends");

            migrationBuilder.DropTable(
                name: "SocialProfileFollows");

            migrationBuilder.RenameColumn(
                name: "FriendId",
                table: "SocialProfileFriends",
                newName: "FriendUserId");

            migrationBuilder.RenameColumn(
                name: "ProfileId",
                table: "SocialProfileFriends",
                newName: "SocialProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialProfileFriends_FriendId",
                table: "SocialProfileFriends",
                newName: "IX_SocialProfileFriends_FriendUserId");

            migrationBuilder.RenameColumn(
                name: "LikedByProfileId",
                table: "SocialPostLikes",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostLikes_LikedByProfileId",
                table: "SocialPostLikes",
                newName: "IX_SocialPostLikes_UserId");

            migrationBuilder.RenameColumn(
                name: "CreatedByProfileId",
                table: "SocialPostComments",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostComments_CreatedByProfileId",
                table: "SocialPostComments",
                newName: "IX_SocialPostComments_UserId");

            migrationBuilder.RenameColumn(
                name: "SocialProfileId",
                table: "Posts",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Posts_SocialProfileId",
                table: "Posts",
                newName: "IX_Posts_UserId");

            migrationBuilder.RenameColumn(
                name: "ToProfileId",
                table: "FriendRequests",
                newName: "ToUserId");

            migrationBuilder.RenameColumn(
                name: "FromProfileId",
                table: "FriendRequests",
                newName: "FromUserId");

            migrationBuilder.RenameIndex(
                name: "IX_FriendRequests_ToProfileId",
                table: "FriendRequests",
                newName: "IX_FriendRequests_ToUserId");

            migrationBuilder.RenameIndex(
                name: "IX_FriendRequests_FromProfileId",
                table: "FriendRequests",
                newName: "IX_FriendRequests_FromUserId");

            migrationBuilder.AddColumn<Guid>(
                name: "SocialProfileEntityId",
                table: "Posts",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateTable(
                name: "SocialProfileFollowers",
                columns: table => new
                {
                    SocialProfileId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    FollowerUserId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialProfileFollowers", x => new { x.SocialProfileId, x.FollowerUserId });
                    table.ForeignKey(
                        name: "FK_SocialProfileFollowers_SocialProfiles_SocialProfileId",
                        column: x => x.SocialProfileId,
                        principalTable: "SocialProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SocialProfileFollowers_Users_FollowerUserId",
                        column: x => x.FollowerUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "SocialProfileFollowing",
                columns: table => new
                {
                    SocialProfileId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    FollowingUserId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialProfileFollowing", x => new { x.SocialProfileId, x.FollowingUserId });
                    table.ForeignKey(
                        name: "FK_SocialProfileFollowing_SocialProfiles_SocialProfileId",
                        column: x => x.SocialProfileId,
                        principalTable: "SocialProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SocialProfileFollowing_Users_FollowingUserId",
                        column: x => x.FollowingUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_SocialProfileEntityId",
                table: "Posts",
                column: "SocialProfileEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_SocialProfileFollowers_FollowerUserId",
                table: "SocialProfileFollowers",
                column: "FollowerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SocialProfileFollowing_FollowingUserId",
                table: "SocialProfileFollowing",
                column: "FollowingUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_FriendRequests_Users_FromUserId",
                table: "FriendRequests",
                column: "FromUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FriendRequests_Users_ToUserId",
                table: "FriendRequests",
                column: "ToUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_SocialProfiles_SocialProfileEntityId",
                table: "Posts",
                column: "SocialProfileEntityId",
                principalTable: "SocialProfiles",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_Users_UserId",
                table: "Posts",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostComments_Users_UserId",
                table: "SocialPostComments",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostLikes_Users_UserId",
                table: "SocialPostLikes",
                column: "UserId",
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FriendRequests_Users_FromUserId",
                table: "FriendRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_FriendRequests_Users_ToUserId",
                table: "FriendRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_Posts_SocialProfiles_SocialProfileEntityId",
                table: "Posts");

            migrationBuilder.DropForeignKey(
                name: "FK_Posts_Users_UserId",
                table: "Posts");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostComments_Users_UserId",
                table: "SocialPostComments");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostLikes_Users_UserId",
                table: "SocialPostLikes");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFriends_SocialProfiles_SocialProfileId",
                table: "SocialProfileFriends");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialProfileFriends_Users_FriendUserId",
                table: "SocialProfileFriends");

            migrationBuilder.DropTable(
                name: "SocialProfileFollowers");

            migrationBuilder.DropTable(
                name: "SocialProfileFollowing");

            migrationBuilder.DropIndex(
                name: "IX_Posts_SocialProfileEntityId",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "SocialProfileEntityId",
                table: "Posts");

            migrationBuilder.RenameColumn(
                name: "FriendUserId",
                table: "SocialProfileFriends",
                newName: "FriendId");

            migrationBuilder.RenameColumn(
                name: "SocialProfileId",
                table: "SocialProfileFriends",
                newName: "ProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialProfileFriends_FriendUserId",
                table: "SocialProfileFriends",
                newName: "IX_SocialProfileFriends_FriendId");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "SocialPostLikes",
                newName: "LikedByProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostLikes_UserId",
                table: "SocialPostLikes",
                newName: "IX_SocialPostLikes_LikedByProfileId");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "SocialPostComments",
                newName: "CreatedByProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostComments_UserId",
                table: "SocialPostComments",
                newName: "IX_SocialPostComments_CreatedByProfileId");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Posts",
                newName: "SocialProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_Posts_UserId",
                table: "Posts",
                newName: "IX_Posts_SocialProfileId");

            migrationBuilder.RenameColumn(
                name: "ToUserId",
                table: "FriendRequests",
                newName: "ToProfileId");

            migrationBuilder.RenameColumn(
                name: "FromUserId",
                table: "FriendRequests",
                newName: "FromProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_FriendRequests_ToUserId",
                table: "FriendRequests",
                newName: "IX_FriendRequests_ToProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_FriendRequests_FromUserId",
                table: "FriendRequests",
                newName: "IX_FriendRequests_FromProfileId");

            migrationBuilder.CreateTable(
                name: "SocialProfileFollows",
                columns: table => new
                {
                    FollowerProfileId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    FollowingProfileId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialProfileFollows", x => new { x.FollowerProfileId, x.FollowingProfileId });
                    table.ForeignKey(
                        name: "FK_SocialProfileFollows_SocialProfiles_FollowerProfileId",
                        column: x => x.FollowerProfileId,
                        principalTable: "SocialProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SocialProfileFollows_SocialProfiles_FollowingProfileId",
                        column: x => x.FollowingProfileId,
                        principalTable: "SocialProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_SocialProfileFollows_FollowingProfileId",
                table: "SocialProfileFollows",
                column: "FollowingProfileId");

            migrationBuilder.AddForeignKey(
                name: "FK_FriendRequests_SocialProfiles_FromProfileId",
                table: "FriendRequests",
                column: "FromProfileId",
                principalTable: "SocialProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FriendRequests_SocialProfiles_ToProfileId",
                table: "FriendRequests",
                column: "ToProfileId",
                principalTable: "SocialProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_SocialProfiles_SocialProfileId",
                table: "Posts",
                column: "SocialProfileId",
                principalTable: "SocialProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostComments_SocialProfiles_CreatedByProfileId",
                table: "SocialPostComments",
                column: "CreatedByProfileId",
                principalTable: "SocialProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostLikes_SocialProfiles_LikedByProfileId",
                table: "SocialPostLikes",
                column: "LikedByProfileId",
                principalTable: "SocialProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfileFriends_SocialProfiles_FriendId",
                table: "SocialProfileFriends",
                column: "FriendId",
                principalTable: "SocialProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialProfileFriends_SocialProfiles_ProfileId",
                table: "SocialProfileFriends",
                column: "ProfileId",
                principalTable: "SocialProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
