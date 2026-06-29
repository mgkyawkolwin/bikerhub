using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikerHub.src.mvc.Migrations
{
    /// <inheritdoc />
    public partial class jjkkls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PostMedia_Posts_PostId",
                table: "PostMedia");

            migrationBuilder.DropForeignKey(
                name: "FK_Posts_SocialProfiles_SocialProfileEntityId",
                table: "Posts");

            migrationBuilder.DropForeignKey(
                name: "FK_Posts_Users_UserId",
                table: "Posts");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostComments_Posts_PostId",
                table: "SocialPostComments");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostLikes_Posts_PostId",
                table: "SocialPostLikes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Posts",
                table: "Posts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PostMedia",
                table: "PostMedia");

            migrationBuilder.RenameTable(
                name: "Posts",
                newName: "SocialPosts");

            migrationBuilder.RenameTable(
                name: "PostMedia",
                newName: "SocialPostMedias");

            migrationBuilder.RenameIndex(
                name: "IX_Posts_UserId",
                table: "SocialPosts",
                newName: "IX_SocialPosts_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Posts_SocialProfileEntityId",
                table: "SocialPosts",
                newName: "IX_SocialPosts_SocialProfileEntityId");

            migrationBuilder.RenameIndex(
                name: "IX_PostMedia_PostId",
                table: "SocialPostMedias",
                newName: "IX_SocialPostMedias_PostId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SocialPosts",
                table: "SocialPosts",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SocialPostMedias",
                table: "SocialPostMedias",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostComments_SocialPosts_PostId",
                table: "SocialPostComments",
                column: "PostId",
                principalTable: "SocialPosts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostLikes_SocialPosts_PostId",
                table: "SocialPostLikes",
                column: "PostId",
                principalTable: "SocialPosts",
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
                name: "FK_SocialPosts_SocialProfiles_SocialProfileEntityId",
                table: "SocialPosts",
                column: "SocialProfileEntityId",
                principalTable: "SocialProfiles",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPosts_Users_UserId",
                table: "SocialPosts",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostComments_SocialPosts_PostId",
                table: "SocialPostComments");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostLikes_SocialPosts_PostId",
                table: "SocialPostLikes");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPostMedias_SocialPosts_PostId",
                table: "SocialPostMedias");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPosts_SocialProfiles_SocialProfileEntityId",
                table: "SocialPosts");

            migrationBuilder.DropForeignKey(
                name: "FK_SocialPosts_Users_UserId",
                table: "SocialPosts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SocialPosts",
                table: "SocialPosts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SocialPostMedias",
                table: "SocialPostMedias");

            migrationBuilder.RenameTable(
                name: "SocialPosts",
                newName: "Posts");

            migrationBuilder.RenameTable(
                name: "SocialPostMedias",
                newName: "PostMedia");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPosts_UserId",
                table: "Posts",
                newName: "IX_Posts_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPosts_SocialProfileEntityId",
                table: "Posts",
                newName: "IX_Posts_SocialProfileEntityId");

            migrationBuilder.RenameIndex(
                name: "IX_SocialPostMedias_PostId",
                table: "PostMedia",
                newName: "IX_PostMedia_PostId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Posts",
                table: "Posts",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PostMedia",
                table: "PostMedia",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PostMedia_Posts_PostId",
                table: "PostMedia",
                column: "PostId",
                principalTable: "Posts",
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
                name: "FK_SocialPostComments_Posts_PostId",
                table: "SocialPostComments",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialPostLikes_Posts_PostId",
                table: "SocialPostLikes",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
