using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikerHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class Ver_1011 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Rides",
                keyColumn: "LocationsJson",
                keyValue: null,
                column: "LocationsJson",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "LocationsJson",
                table: "Rides",
                type: "longtext",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "longtext",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<decimal>(
                name: "AverageSpeed",
                table: "Rides",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "MaxElevation",
                table: "Rides",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "MaxSpeed",
                table: "Rides",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "MinElevation",
                table: "Rides",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "MinSpeed",
                table: "Rides",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalElevation",
                table: "Rides",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AverageSpeed",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "MaxElevation",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "MaxSpeed",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "MinElevation",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "MinSpeed",
                table: "Rides");

            migrationBuilder.DropColumn(
                name: "TotalElevation",
                table: "Rides");

            migrationBuilder.AlterColumn<string>(
                name: "LocationsJson",
                table: "Rides",
                type: "longtext",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "longtext")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
