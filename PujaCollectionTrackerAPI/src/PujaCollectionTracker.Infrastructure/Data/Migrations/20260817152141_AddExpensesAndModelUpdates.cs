using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PujaCollectionTracker.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExpensesAndModelUpdates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "FlatId",
                table: "PaymentCollections",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "Block",
                table: "PaymentCollections",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "PaymentCollections",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CollectedByName",
                table: "PaymentCollections",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "PaymentCollections",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "DonorResidentName",
                table: "PaymentCollections",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FlatNumber",
                table: "PaymentCollections",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Floor",
                table: "PaymentCollections",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "PaymentCollections",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TransactionReference",
                table: "PaymentCollections",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "PaymentCollections",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "PaymentCollections",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Block",
                table: "Flats",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Flats",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Flats",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ExpectedAmount",
                table: "Flats",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "Floor",
                table: "Flats",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Expenses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExpenseDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaymentMode = table.Column<int>(type: "int", nullable: false),
                    PaidToVendor = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BillAttachmentUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RecordedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RecordedByName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Expenses", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Expenses");

            migrationBuilder.DropColumn(
                name: "Block",
                table: "PaymentCollections");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "PaymentCollections");

            migrationBuilder.DropColumn(
                name: "CollectedByName",
                table: "PaymentCollections");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "PaymentCollections");

            migrationBuilder.DropColumn(
                name: "DonorResidentName",
                table: "PaymentCollections");

            migrationBuilder.DropColumn(
                name: "FlatNumber",
                table: "PaymentCollections");

            migrationBuilder.DropColumn(
                name: "Floor",
                table: "PaymentCollections");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "PaymentCollections");

            migrationBuilder.DropColumn(
                name: "TransactionReference",
                table: "PaymentCollections");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "PaymentCollections");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "PaymentCollections");

            migrationBuilder.DropColumn(
                name: "Block",
                table: "Flats");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Flats");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Flats");

            migrationBuilder.DropColumn(
                name: "ExpectedAmount",
                table: "Flats");

            migrationBuilder.DropColumn(
                name: "Floor",
                table: "Flats");

            migrationBuilder.AlterColumn<int>(
                name: "FlatId",
                table: "PaymentCollections",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }
    }
}
