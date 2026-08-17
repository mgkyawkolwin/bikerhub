using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikerHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class StolenBikeReportFieldsUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "StolenBikeReports",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "StolenBikeReports",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Edition",
                table: "StolenBikeReports",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Mileage",
                table: "StolenBikeReports",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "StolenBikeReports",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "StolenDate",
                table: "StolenBikeReports",
                type: "datetime(6)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "City",
                table: "StolenBikeReports");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "StolenBikeReports");

            migrationBuilder.DropColumn(
                name: "Edition",
                table: "StolenBikeReports");

            migrationBuilder.DropColumn(
                name: "Mileage",
                table: "StolenBikeReports");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "StolenBikeReports");

            migrationBuilder.DropColumn(
                name: "StolenDate",
                table: "StolenBikeReports");
        }
    }
}
