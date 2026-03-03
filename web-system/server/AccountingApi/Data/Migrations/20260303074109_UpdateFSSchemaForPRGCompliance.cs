using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccountingApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateFSSchemaForPRGCompliance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add missing columns to fs_checkmas
            migrationBuilder.AddColumn<string>(
                name: "j_jv_no",
                table: "fs_checkmas",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "j_ck_amt",
                table: "fs_checkmas",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "bank_no",
                table: "fs_checkmas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "sup_no",
                table: "fs_checkmas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            // Rename j_payee to j_pay_to
            migrationBuilder.RenameColumn(
                name: "j_payee",
                table: "fs_checkmas",
                newName: "j_pay_to");

            // Rename j_particulars to j_desc
            migrationBuilder.RenameColumn(
                name: "j_particulars",
                table: "fs_checkmas",
                newName: "j_desc");

            // Remove j_status column (not in original PRG)
            migrationBuilder.DropColumn(
                name: "j_status",
                table: "fs_checkmas");

            // Add initialize column to fs_accounts
            migrationBuilder.AddColumn<bool>(
                name: "initialize",
                table: "fs_accounts",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reverse fs_checkmas changes
            migrationBuilder.RenameColumn(
                name: "j_pay_to",
                table: "fs_checkmas",
                newName: "j_payee");

            migrationBuilder.RenameColumn(
                name: "j_desc",
                table: "fs_checkmas",
                newName: "j_particulars");

            migrationBuilder.DropColumn(
                name: "j_jv_no",
                table: "fs_checkmas");

            migrationBuilder.DropColumn(
                name: "j_ck_amt",
                table: "fs_checkmas");

            migrationBuilder.DropColumn(
                name: "bank_no",
                table: "fs_checkmas");

            migrationBuilder.DropColumn(
                name: "sup_no",
                table: "fs_checkmas");

            migrationBuilder.AddColumn<string>(
                name: "j_status",
                table: "fs_checkmas",
                type: "TEXT",
                maxLength: 30,
                nullable: false,
                defaultValue: "U");

            // Reverse fs_accounts changes
            migrationBuilder.DropColumn(
                name: "initialize",
                table: "fs_accounts");
        }
    }
}
