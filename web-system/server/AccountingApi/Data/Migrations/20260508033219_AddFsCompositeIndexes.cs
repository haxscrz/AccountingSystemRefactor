using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccountingApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFsCompositeIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "assigned_companies_json",
                table: "app_users",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "app_announcement_reactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    announcement_id = table.Column<int>(type: "INTEGER", nullable: false),
                    user_id = table.Column<int>(type: "INTEGER", nullable: false),
                    username = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    reaction_type = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_announcement_reactions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "app_announcements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    author_id = table.Column<int>(type: "INTEGER", nullable: false),
                    author_username = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    body = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    image_data = table.Column<string>(type: "TEXT", nullable: true),
                    priority = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    target_type = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    target_users_json = table.Column<string>(type: "TEXT", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    expires_at_utc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_announcements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "app_support_tickets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    from_username = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    message = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    resolved_by = table.Column<string>(type: "TEXT", maxLength: 80, nullable: true),
                    admin_notes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    resolved_at_utc = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_support_tickets", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_fs_pournals_company_code_j_jv_no",
                table: "fs_pournals",
                columns: new[] { "company_code", "j_jv_no" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_checkvou_company_code_j_ck_no",
                table: "fs_checkvou",
                columns: new[] { "company_code", "j_ck_no" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "app_announcement_reactions");

            migrationBuilder.DropTable(
                name: "app_announcements");

            migrationBuilder.DropTable(
                name: "app_support_tickets");

            migrationBuilder.DropIndex(
                name: "IX_fs_pournals_company_code_j_jv_no",
                table: "fs_pournals");

            migrationBuilder.DropIndex(
                name: "IX_fs_checkvou_company_code_j_ck_no",
                table: "fs_checkvou");

            migrationBuilder.DropColumn(
                name: "assigned_companies_json",
                table: "app_users");
        }
    }
}
