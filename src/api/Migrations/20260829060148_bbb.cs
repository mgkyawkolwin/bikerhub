using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikerHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class bbb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReceiverName",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "ReceiverProfilePictureUrl",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "SenderName",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "SenderProfilePictureUrl",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "SentAt",
                table: "ChatMessages");

            migrationBuilder.AddColumn<int>(
                name: "MessageType",
                table: "ChatMessages",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MessageType",
                table: "ChatMessages");

            migrationBuilder.AddColumn<string>(
                name: "ReceiverName",
                table: "ChatMessages",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ReceiverProfilePictureUrl",
                table: "ChatMessages",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "SenderName",
                table: "ChatMessages",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "SenderProfilePictureUrl",
                table: "ChatMessages",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "SentAt",
                table: "ChatMessages",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
