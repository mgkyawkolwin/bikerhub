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
            migrationBuilder.DropForeignKey(
                name: "FK_Medias_GarageBikes_OwnerId",
                table: "Medias");

            migrationBuilder.DropIndex(
                name: "IX_Medias_OwnerId",
                table: "Medias");

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

            migrationBuilder.CreateIndex(
                name: "IX_Medias_OwnerId",
                table: "Medias",
                column: "OwnerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Medias_GarageBikes_OwnerId",
                table: "Medias",
                column: "OwnerId",
                principalTable: "GarageBikes",
                principalColumn: "Id");
        }
    }
}
