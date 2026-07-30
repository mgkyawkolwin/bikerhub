using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikerHub.Migrations
{
    /// <inheritdoc />
    public partial class Ver_1012 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Bike",
                table: "Rides",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Bike",
                table: "Rides");
        }
    }
}
