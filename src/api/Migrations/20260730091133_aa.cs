using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikerHub.Migrations
{
    /// <inheritdoc />
    public partial class aa : Migration
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
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
