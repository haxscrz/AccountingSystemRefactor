using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccountingApi.Data.Migrations
{
    /// <inheritdoc />
    public partial class UserDataIsolation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_pay_tmcard_emp_no_period_year_period_month",
                table: "pay_tmcard");

            migrationBuilder.DropIndex(
                name: "IX_pay_tmcard_trn_flag",
                table: "pay_tmcard");

            migrationBuilder.DropIndex(
                name: "IX_pay_taxtab_exemption_sequence",
                table: "pay_taxtab");

            migrationBuilder.DropIndex(
                name: "IX_pay_master_emp_no",
                table: "pay_master");

            migrationBuilder.DropIndex(
                name: "IX_pay_dept_dep_no",
                table: "pay_dept");

            migrationBuilder.DropIndex(
                name: "IX_fs_schedule_gl_head_acct_code",
                table: "fs_schedule");

            migrationBuilder.DropIndex(
                name: "IX_fs_salebook_j_jv_no",
                table: "fs_salebook");

            migrationBuilder.DropIndex(
                name: "IX_fs_purcbook_j_jv_no",
                table: "fs_purcbook");

            migrationBuilder.DropIndex(
                name: "IX_fs_pournals_j_jv_no_acct_code",
                table: "fs_pournals");

            migrationBuilder.DropIndex(
                name: "IX_fs_journals_j_jv_no",
                table: "fs_journals");

            migrationBuilder.DropIndex(
                name: "IX_fs_effects_gl_report_gl_effect",
                table: "fs_effects");

            migrationBuilder.DropIndex(
                name: "IX_fs_checkvou_j_ck_no_acct_code",
                table: "fs_checkvou");

            migrationBuilder.DropIndex(
                name: "IX_fs_checkmas_j_ck_no",
                table: "fs_checkmas");

            migrationBuilder.DropIndex(
                name: "IX_fs_cashrcpt_j_jv_no",
                table: "fs_cashrcpt");

            migrationBuilder.DropIndex(
                name: "IX_fs_adjstmnt_j_jv_no",
                table: "fs_adjstmnt");

            migrationBuilder.DropIndex(
                name: "IX_fs_accounts_acct_code",
                table: "fs_accounts");

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "pay_tmcard",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "pay_tmcard",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "pay_taxtab",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "pay_taxtab",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "sys_nm",
                table: "pay_sys_id",
                type: "TEXT",
                maxLength: 80,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 80,
                oldDefaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "pay_sys_id",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "pay_sys_id",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "pay_prempaid",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "pay_prempaid",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "pay_master",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "pay_master",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "pay_dept",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "pay_dept",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "fs_sys_id",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "fs_sys_id",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "fs_schedule",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "fs_schedule",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "fs_salebook",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "fs_salebook",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "fs_salebook",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "fs_salebook",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "fs_purcbook",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "fs_purcbook",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "fs_purcbook",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "fs_purcbook",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "fs_pournals",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "fs_pournals",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "fs_journals",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "fs_journals",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "fs_journals",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "fs_journals",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "fs_effects",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "fs_effects",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "fs_checkvou",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "fs_checkvou",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "fs_checkvou",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "fs_checkvou",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "fs_checkmas",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "fs_checkmas",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "fs_checkmas",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "fs_checkmas",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "fs_cashrcpt",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "fs_cashrcpt",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "fs_cashrcpt",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "fs_cashrcpt",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "fs_adjstmnt",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "fs_adjstmnt",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "fs_adjstmnt",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "fs_adjstmnt",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "company_code",
                table: "fs_accounts",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "created_by_user_id",
                table: "fs_accounts",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "app_audit_logs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    user_id = table.Column<int>(type: "INTEGER", nullable: true),
                    username = table.Column<string>(type: "TEXT", maxLength: 80, nullable: true),
                    event_type = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    resource = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    success = table.Column<bool>(type: "INTEGER", nullable: false),
                    ip_address = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    user_agent = table.Column<string>(type: "TEXT", maxLength: 512, nullable: true),
                    details = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_audit_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "app_refresh_tokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    user_id = table.Column<int>(type: "INTEGER", nullable: false),
                    token_hash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    expires_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    revoked_at_utc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    replaced_by_token_hash = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    created_by_ip = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    user_agent = table.Column<string>(type: "TEXT", maxLength: 512, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_refresh_tokens", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "app_users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    username = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    password_hash = table.Column<string>(type: "TEXT", maxLength: 256, nullable: false),
                    password_salt = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    hash_iterations = table.Column<int>(type: "INTEGER", nullable: false),
                    role = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    can_access_fs = table.Column<bool>(type: "INTEGER", nullable: false),
                    can_access_payroll = table.Column<bool>(type: "INTEGER", nullable: false),
                    is_active = table.Column<bool>(type: "INTEGER", nullable: false),
                    failed_login_count = table.Column<int>(type: "INTEGER", nullable: false),
                    profile_image_url = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    preferences_json = table.Column<string>(type: "TEXT", nullable: true),
                    lockout_end_utc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    last_failed_login_utc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    last_login_utc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fs_banks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    bank_no = table.Column<int>(type: "INTEGER", nullable: false),
                    bank_name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    bank_addr = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    bank_acct = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    company_code = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    created_by_user_id = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fs_banks", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fs_signatories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    sign_name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    sign_title = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    is_active = table.Column<bool>(type: "INTEGER", nullable: false),
                    company_code = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    created_by_user_id = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fs_signatories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "fs_supplier",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    sup_no = table.Column<int>(type: "INTEGER", nullable: false),
                    sup_name = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    sup_addr = table.Column<string>(type: "TEXT", maxLength: 250, nullable: true),
                    sup_phone = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    sup_fax = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    sup_contak = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    company_code = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    created_by_user_id = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fs_supplier", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_pay_tmcard_company_code_emp_no_period_year_period_month",
                table: "pay_tmcard",
                columns: new[] { "company_code", "emp_no", "period_year", "period_month" });

            migrationBuilder.CreateIndex(
                name: "IX_pay_tmcard_company_code_trn_flag",
                table: "pay_tmcard",
                columns: new[] { "company_code", "trn_flag" });

            migrationBuilder.CreateIndex(
                name: "IX_pay_taxtab_company_code_exemption_sequence",
                table: "pay_taxtab",
                columns: new[] { "company_code", "exemption", "sequence" });

            migrationBuilder.CreateIndex(
                name: "IX_pay_master_company_code_emp_no",
                table: "pay_master",
                columns: new[] { "company_code", "emp_no" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pay_dept_company_code_dep_no",
                table: "pay_dept",
                columns: new[] { "company_code", "dep_no" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_fs_schedule_company_code_gl_head_acct_code",
                table: "fs_schedule",
                columns: new[] { "company_code", "gl_head", "acct_code" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_salebook_company_code_j_jv_no",
                table: "fs_salebook",
                columns: new[] { "company_code", "j_jv_no" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_purcbook_company_code_j_jv_no",
                table: "fs_purcbook",
                columns: new[] { "company_code", "j_jv_no" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_pournals_company_code_j_jv_no_acct_code",
                table: "fs_pournals",
                columns: new[] { "company_code", "j_jv_no", "acct_code" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_journals_company_code_j_jv_no",
                table: "fs_journals",
                columns: new[] { "company_code", "j_jv_no" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_effects_company_code_gl_report_gl_effect",
                table: "fs_effects",
                columns: new[] { "company_code", "gl_report", "gl_effect" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_checkvou_company_code_j_ck_no_acct_code",
                table: "fs_checkvou",
                columns: new[] { "company_code", "j_ck_no", "acct_code" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_checkmas_company_code_j_ck_no",
                table: "fs_checkmas",
                columns: new[] { "company_code", "j_ck_no" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_cashrcpt_company_code_j_jv_no",
                table: "fs_cashrcpt",
                columns: new[] { "company_code", "j_jv_no" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_adjstmnt_company_code_j_jv_no",
                table: "fs_adjstmnt",
                columns: new[] { "company_code", "j_jv_no" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_accounts_company_code_acct_code",
                table: "fs_accounts",
                columns: new[] { "company_code", "acct_code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_app_audit_logs_created_at_utc",
                table: "app_audit_logs",
                column: "created_at_utc");

            migrationBuilder.CreateIndex(
                name: "IX_app_audit_logs_username_created_at_utc",
                table: "app_audit_logs",
                columns: new[] { "username", "created_at_utc" });

            migrationBuilder.CreateIndex(
                name: "IX_app_refresh_tokens_token_hash",
                table: "app_refresh_tokens",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_app_refresh_tokens_user_id_expires_at_utc",
                table: "app_refresh_tokens",
                columns: new[] { "user_id", "expires_at_utc" });

            migrationBuilder.CreateIndex(
                name: "IX_app_users_username",
                table: "app_users",
                column: "username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_fs_banks_company_code_bank_no",
                table: "fs_banks",
                columns: new[] { "company_code", "bank_no" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_signatories_company_code_sign_name",
                table: "fs_signatories",
                columns: new[] { "company_code", "sign_name" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_supplier_company_code_sup_no",
                table: "fs_supplier",
                columns: new[] { "company_code", "sup_no" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "app_audit_logs");

            migrationBuilder.DropTable(
                name: "app_refresh_tokens");

            migrationBuilder.DropTable(
                name: "app_users");

            migrationBuilder.DropTable(
                name: "fs_banks");

            migrationBuilder.DropTable(
                name: "fs_signatories");

            migrationBuilder.DropTable(
                name: "fs_supplier");

            migrationBuilder.DropIndex(
                name: "IX_pay_tmcard_company_code_emp_no_period_year_period_month",
                table: "pay_tmcard");

            migrationBuilder.DropIndex(
                name: "IX_pay_tmcard_company_code_trn_flag",
                table: "pay_tmcard");

            migrationBuilder.DropIndex(
                name: "IX_pay_taxtab_company_code_exemption_sequence",
                table: "pay_taxtab");

            migrationBuilder.DropIndex(
                name: "IX_pay_master_company_code_emp_no",
                table: "pay_master");

            migrationBuilder.DropIndex(
                name: "IX_pay_dept_company_code_dep_no",
                table: "pay_dept");

            migrationBuilder.DropIndex(
                name: "IX_fs_schedule_company_code_gl_head_acct_code",
                table: "fs_schedule");

            migrationBuilder.DropIndex(
                name: "IX_fs_salebook_company_code_j_jv_no",
                table: "fs_salebook");

            migrationBuilder.DropIndex(
                name: "IX_fs_purcbook_company_code_j_jv_no",
                table: "fs_purcbook");

            migrationBuilder.DropIndex(
                name: "IX_fs_pournals_company_code_j_jv_no_acct_code",
                table: "fs_pournals");

            migrationBuilder.DropIndex(
                name: "IX_fs_journals_company_code_j_jv_no",
                table: "fs_journals");

            migrationBuilder.DropIndex(
                name: "IX_fs_effects_company_code_gl_report_gl_effect",
                table: "fs_effects");

            migrationBuilder.DropIndex(
                name: "IX_fs_checkvou_company_code_j_ck_no_acct_code",
                table: "fs_checkvou");

            migrationBuilder.DropIndex(
                name: "IX_fs_checkmas_company_code_j_ck_no",
                table: "fs_checkmas");

            migrationBuilder.DropIndex(
                name: "IX_fs_cashrcpt_company_code_j_jv_no",
                table: "fs_cashrcpt");

            migrationBuilder.DropIndex(
                name: "IX_fs_adjstmnt_company_code_j_jv_no",
                table: "fs_adjstmnt");

            migrationBuilder.DropIndex(
                name: "IX_fs_accounts_company_code_acct_code",
                table: "fs_accounts");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "pay_tmcard");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "pay_tmcard");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "pay_taxtab");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "pay_taxtab");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "pay_sys_id");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "pay_sys_id");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "pay_prempaid");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "pay_prempaid");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "pay_master");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "pay_master");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "pay_dept");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "pay_dept");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "fs_sys_id");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "fs_sys_id");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "fs_schedule");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "fs_schedule");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "fs_salebook");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "fs_salebook");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "fs_salebook");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "fs_salebook");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "fs_purcbook");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "fs_purcbook");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "fs_purcbook");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "fs_purcbook");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "fs_pournals");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "fs_pournals");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "fs_journals");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "fs_journals");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "fs_journals");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "fs_journals");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "fs_effects");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "fs_effects");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "fs_checkvou");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "fs_checkvou");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "fs_checkvou");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "fs_checkvou");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "fs_checkmas");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "fs_checkmas");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "fs_checkmas");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "fs_checkmas");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "fs_cashrcpt");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "fs_cashrcpt");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "fs_cashrcpt");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "fs_cashrcpt");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "fs_adjstmnt");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "fs_adjstmnt");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "fs_adjstmnt");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "fs_adjstmnt");

            migrationBuilder.DropColumn(
                name: "company_code",
                table: "fs_accounts");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "fs_accounts");

            migrationBuilder.AlterColumn<string>(
                name: "sys_nm",
                table: "pay_sys_id",
                type: "TEXT",
                maxLength: 80,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 80);

            migrationBuilder.CreateIndex(
                name: "IX_pay_tmcard_emp_no_period_year_period_month",
                table: "pay_tmcard",
                columns: new[] { "emp_no", "period_year", "period_month" });

            migrationBuilder.CreateIndex(
                name: "IX_pay_tmcard_trn_flag",
                table: "pay_tmcard",
                column: "trn_flag");

            migrationBuilder.CreateIndex(
                name: "IX_pay_taxtab_exemption_sequence",
                table: "pay_taxtab",
                columns: new[] { "exemption", "sequence" });

            migrationBuilder.CreateIndex(
                name: "IX_pay_master_emp_no",
                table: "pay_master",
                column: "emp_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pay_dept_dep_no",
                table: "pay_dept",
                column: "dep_no",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_fs_schedule_gl_head_acct_code",
                table: "fs_schedule",
                columns: new[] { "gl_head", "acct_code" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_salebook_j_jv_no",
                table: "fs_salebook",
                column: "j_jv_no");

            migrationBuilder.CreateIndex(
                name: "IX_fs_purcbook_j_jv_no",
                table: "fs_purcbook",
                column: "j_jv_no");

            migrationBuilder.CreateIndex(
                name: "IX_fs_pournals_j_jv_no_acct_code",
                table: "fs_pournals",
                columns: new[] { "j_jv_no", "acct_code" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_journals_j_jv_no",
                table: "fs_journals",
                column: "j_jv_no");

            migrationBuilder.CreateIndex(
                name: "IX_fs_effects_gl_report_gl_effect",
                table: "fs_effects",
                columns: new[] { "gl_report", "gl_effect" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_checkvou_j_ck_no_acct_code",
                table: "fs_checkvou",
                columns: new[] { "j_ck_no", "acct_code" });

            migrationBuilder.CreateIndex(
                name: "IX_fs_checkmas_j_ck_no",
                table: "fs_checkmas",
                column: "j_ck_no");

            migrationBuilder.CreateIndex(
                name: "IX_fs_cashrcpt_j_jv_no",
                table: "fs_cashrcpt",
                column: "j_jv_no");

            migrationBuilder.CreateIndex(
                name: "IX_fs_adjstmnt_j_jv_no",
                table: "fs_adjstmnt",
                column: "j_jv_no");

            migrationBuilder.CreateIndex(
                name: "IX_fs_accounts_acct_code",
                table: "fs_accounts",
                column: "acct_code",
                unique: true);
        }
    }
}
