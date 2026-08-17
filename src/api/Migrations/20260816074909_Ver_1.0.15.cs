using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikerHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class Ver_1015 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "BikeListings");

            migrationBuilder.DropColumn(
                name: "ImagesJson",
                table: "BikeListings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "BikeListings",
                type: "varchar(512)",
                maxLength: 512,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ImagesJson",
                table: "BikeListings",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }
    }
}
