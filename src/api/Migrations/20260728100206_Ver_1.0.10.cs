using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikerHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class Ver_1010 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Title",
                table: "BikeListings");

            migrationBuilder.AddColumn<string>(
                name: "Edition",
                table: "BikeListings",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Edition",
                table: "BikeListings");

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "BikeListings",
                type: "varchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "")
                .Annotation("MySql:CharSet", "utf8mb4");
        }
    }
}
