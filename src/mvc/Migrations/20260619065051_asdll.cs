using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikerHub.Migrations
{
    /// <inheritdoc />
    public partial class asdll : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.CreateTable(
                name: "SocialProfileFriends",
                columns: table => new
                {
                    ProfileId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    FriendId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialProfileFriends", x => new { x.ProfileId, x.FriendId });
                    table.ForeignKey(
                        name: "FK_SocialProfileFriends_SocialProfiles_FriendId",
                        column: x => x.FriendId,
                        principalTable: "SocialProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SocialProfileFriends_SocialProfiles_ProfileId",
                        column: x => x.ProfileId,
                        principalTable: "SocialProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_SocialProfileFollows_FollowingProfileId",
                table: "SocialProfileFollows",
                column: "FollowingProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_SocialProfileFriends_FriendId",
                table: "SocialProfileFriends",
                column: "FriendId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SocialProfileFollows");

            migrationBuilder.DropTable(
                name: "SocialProfileFriends");
        }
    }
}
