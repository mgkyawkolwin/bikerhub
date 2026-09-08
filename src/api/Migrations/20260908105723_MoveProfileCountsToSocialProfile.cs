using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BikerHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class MoveProfileCountsToSocialProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ListingCount",
                table: "SocialProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PlanCount",
                table: "SocialProfiles",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(@"
                UPDATE SocialProfiles sp
                INNER JOIN Users u ON u.Id = sp.UserId
                SET sp.ListingCount = u.ListingCount;
            ");

            migrationBuilder.Sql(@"
                UPDATE SocialProfiles sp
                LEFT JOIN (
                    SELECT CreatedById AS UserId, COUNT(*) AS PlanCount
                    FROM Plans
                    GROUP BY CreatedById
                ) plan_counts ON plan_counts.UserId = sp.UserId
                SET sp.PlanCount = COALESCE(plan_counts.PlanCount, 0);
            ");

            migrationBuilder.DropColumn(
                name: "ListingCount",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ListingCount",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(@"
                UPDATE Users u
                INNER JOIN SocialProfiles sp ON sp.UserId = u.Id
                SET u.ListingCount = sp.ListingCount;
            ");

            migrationBuilder.DropColumn(
                name: "ListingCount",
                table: "SocialProfiles");

            migrationBuilder.DropColumn(
                name: "PlanCount",
                table: "SocialProfiles");
        }
    }
}
