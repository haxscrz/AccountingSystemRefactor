using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccountingApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingFSFieldsForPRGCompliance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "j_status",
                table: "fs_checkmas");

            migrationBuilder.RenameColumn(
                name: "j_payee",
                table: "fs_checkmas",
                newName: "j_pay_to");

            migrationBuilder.RenameColumn(
                name: "j_particulars",
                table: "fs_checkmas",
                newName: "j_desc");

            migrationBuilder.AddColumn<int>(
                name: "bank_no",
                table: "fs_checkmas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "j_ck_amt",
                table: "fs_checkmas",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "j_jv_no",
                table: "fs_checkmas",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "sup_no",
                table: "fs_checkmas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

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
            migrationBuilder.DropColumn(
                name: "bank_no",
                table: "fs_checkmas");

            migrationBuilder.DropColumn(
                name: "j_ck_amt",
                table: "fs_checkmas");

            migrationBuilder.DropColumn(
                name: "j_jv_no",
                table: "fs_checkmas");

            migrationBuilder.DropColumn(
                name: "sup_no",
                table: "fs_checkmas");

            migrationBuilder.DropColumn(
                name: "initialize",
                table: "fs_accounts");

            migrationBuilder.RenameColumn(
                name: "j_pay_to",
                table: "fs_checkmas",
                newName: "j_payee");

            migrationBuilder.RenameColumn(
                name: "j_desc",
                table: "fs_checkmas",
                newName: "j_particulars");

            migrationBuilder.AddColumn<string>(
                name: "j_status",
                table: "fs_checkmas",
                type: "TEXT",
                maxLength: 30,
                nullable: false,
                defaultValue: "");
        }
    }
}
