using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AccountingApi.Data.Migrations
{
    public partial class AddPayDept : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(name: "pay_dept",columns: table => new {Id = table.Column<int>(type: "INTEGER", nullable: false).Annotation("Sqlite:Autoincrement", true),dep_no = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),dep_nm = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),reg_pay = table.Column<decimal>(type: "TEXT", nullable: false),ot_pay = table.Column<decimal>(type: "TEXT", nullable: false),hol_pay = table.Column<decimal>(type: "TEXT", nullable: false),oth_pay1 = table.Column<decimal>(type: "TEXT", nullable: false),oth_pay3 = table.Column<decimal>(type: "TEXT", nullable: false),lvenc_pay = table.Column<decimal>(type: "TEXT", nullable: false),lsenc_pay = table.Column<decimal>(type: "TEXT", nullable: false),grs_pay = table.Column<decimal>(type: "TEXT", nullable: false),tax = table.Column<decimal>(type: "TEXT", nullable: false),oth_pay2 = table.Column<decimal>(type: "TEXT", nullable: false),sss_ee = table.Column<decimal>(type: "TEXT", nullable: false),sss_er = table.Column<decimal>(type: "TEXT", nullable: false),med_ee = table.Column<decimal>(type: "TEXT", nullable: false),med_er = table.Column<decimal>(type: "TEXT", nullable: false),pgbg_ee = table.Column<decimal>(type: "TEXT", nullable: false),pgbg_er = table.Column<decimal>(type: "TEXT", nullable: false),ec_er = table.Column<decimal>(type: "TEXT", nullable: false),pbg_loan = table.Column<decimal>(type: "TEXT", nullable: false),sss_loan = table.Column<decimal>(type: "TEXT", nullable: false),cal_loan = table.Column<decimal>(type: "TEXT", nullable: false),comp_loan = table.Column<decimal>(type: "TEXT", nullable: false),commodloan = table.Column<decimal>(type: "TEXT", nullable: false),oth_ded1 = table.Column<decimal>(type: "TEXT", nullable: false),oth_ded2 = table.Column<decimal>(type: "TEXT", nullable: false),oth_ded3 = table.Column<decimal>(type: "TEXT", nullable: false),oth_ded4 = table.Column<decimal>(type: "TEXT", nullable: false),oth_ded5 = table.Column<decimal>(type: "TEXT", nullable: false),oth_ded6 = table.Column<decimal>(type: "TEXT", nullable: false),oth_ded7 = table.Column<decimal>(type: "TEXT", nullable: false),oth_ded8 = table.Column<decimal>(type: "TEXT", nullable: false),oth_ded9 = table.Column<decimal>(type: "TEXT", nullable: false),oth_ded10 = table.Column<decimal>(type: "TEXT", nullable: false),emp_ctr = table.Column<int>(type: "INTEGER", nullable: false),net_pay = table.Column<decimal>(type: "TEXT", nullable: false),bontot = table.Column<decimal>(type: "TEXT", nullable: false),bontax = table.Column<decimal>(type: "TEXT", nullable: false),updated_at = table.Column<DateTime>(type: "TEXT", nullable: false)},constraints: table => { table.PrimaryKey("PK_pay_dept", x => x.Id); });
            migrationBuilder.CreateIndex(name: "IX_pay_dept_dep_no", table: "pay_dept", column: "dep_no", unique: true);
        }
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "pay_dept");
        }
    }
}