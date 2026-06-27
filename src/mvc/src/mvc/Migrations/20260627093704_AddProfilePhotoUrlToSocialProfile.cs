using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikerHub.src.mvc.Migrations
{
    /// <inheritdoc />
    public partial class AddProfilePhotoUrlToSocialProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProfilePhotoUrl",
                table: "SocialProfiles",
                type: "varchar(512)",
                maxLength: 512,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProfilePhotoUrl",
                table: "SocialProfiles");
        }
    }
}
