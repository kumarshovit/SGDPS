using PujaCollectionTracker.Core.CollectionAggregate;
using PujaCollectionTracker.Core.ExpenseAggregate;
using PujaCollectionTracker.Core.FlatAggregate;
using PujaCollectionTracker.Infrastructure.Data;
using PujaCollectionTracker.Web.Endpoints.Collections;
using PujaCollectionTracker.Web.Endpoints.Expenses;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace PujaCollectionTracker.Web.Endpoints.Reports;

public record CategoryBreakdown(string Name, decimal Amount, int Count);
public record BlockBreakdown(string Block, decimal Amount, int FlatCount);

public record DashboardKpisResponse(
  decimal TotalCollection,
  decimal CashCollection,
  decimal UpiCollection,
  decimal BankCollection,
  decimal ChequeCollection,
  decimal TotalExpenses,
  decimal CurrentBalance,
  int TotalCollectionsCount,
  int TotalExpensesCount,
  int TotalFlatsCount,
  int PaidFlatsCount,
  List<BlockBreakdown> CollectionsByBlock,
  List<CategoryBreakdown> CollectionsByCategory,
  List<CategoryBreakdown> ExpensesByCategory,
  List<CollectionDto> RecentCollections,
  List<ExpenseDto> RecentExpenses);

public record DefaulterFlatDto(
  int FlatId,
  string Block,
  int Floor,
  string FlatNumber,
  string OwnerName,
  string OwnerPhone,
  decimal ExpectedAmount,
  decimal PaidAmount,
  decimal PendingAmount);

public record DateWiseSummaryDto(
  string Date,
  decimal CollectionsAmount,
  int CollectionsCount,
  decimal ExpensesAmount,
  int ExpensesCount,
  decimal NetChange);

// GET /api/dashboard/kpis
public class GetDashboardKpisEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<Ok<DashboardKpisResponse>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Get("/dashboard/kpis");
    AllowAnonymous();
    Tags("Dashboard");
    Summary(s => s.Summary = "Get complete high-level KPI metrics, breakdowns by block & category, and recent activity");
  }

  public override async Task<Results<Ok<DashboardKpisResponse>, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var collections = await db.PaymentCollections.AsNoTracking().ToListAsync(ct);
    var expenses = await db.Expenses.AsNoTracking().ToListAsync(ct);
    var flats = await db.Flats.AsNoTracking().ToListAsync(ct);

    decimal totalCollection = collections.Sum(c => c.Amount);
    decimal cashInflow = collections.Where(c => c.Mode == PaymentMode.Cash).Sum(c => c.Amount);
    decimal cashOutflow = expenses.Where(e => e.PaymentMode == PaymentMode.Cash).Sum(e => e.Amount);
    decimal cashCollection = cashInflow - cashOutflow;

    decimal upiInflow = collections.Where(c => c.Mode == PaymentMode.UPI).Sum(c => c.Amount);
    decimal upiOutflow = expenses.Where(e => e.PaymentMode == PaymentMode.UPI).Sum(e => e.Amount);
    decimal upiCollection = upiInflow - upiOutflow;

    decimal bankInflow = collections.Where(c => c.Mode == PaymentMode.BankTransfer).Sum(c => c.Amount);
    decimal bankOutflow = expenses.Where(e => e.PaymentMode == PaymentMode.BankTransfer).Sum(e => e.Amount);
    decimal bankCollection = bankInflow - bankOutflow;

    decimal chequeCollection = collections.Where(c => c.Mode == PaymentMode.Cheque).Sum(c => c.Amount);

    decimal totalExpenses = expenses.Sum(e => e.Amount);
    decimal currentBalance = totalCollection - totalExpenses;

    // Collections by Block
    var blockMap = collections
      .Where(c => c.Type == CollectionType.ResidentBlock && !string.IsNullOrWhiteSpace(c.Block))
      .GroupBy(c => c.Block!)
      .Select(g => new BlockBreakdown(g.Key, g.Sum(x => x.Amount), g.Select(x => x.FlatId).Distinct().Count()))
      .OrderByDescending(b => b.Amount)
      .ToList();

    // Collections by Category
    var catMap = collections
      .Where(c => c.Type == CollectionType.SponsorshipOther && !string.IsNullOrWhiteSpace(c.Category))
      .GroupBy(c => c.Category!)
      .Select(g => new CategoryBreakdown(g.Key, g.Sum(x => x.Amount), g.Count()))
      .OrderByDescending(c => c.Amount)
      .ToList();

    // Add Resident Collections as top category if any
    var residentTotal = collections.Where(c => c.Type == CollectionType.ResidentBlock).Sum(x => x.Amount);
    if (residentTotal > 0)
    {
      catMap.Insert(0, new CategoryBreakdown("Resident / Flat Collections", residentTotal, collections.Count(c => c.Type == CollectionType.ResidentBlock)));
    }

    // Expenses by Category
    var expCatMap = expenses
      .GroupBy(e => e.Category)
      .Select(g => new CategoryBreakdown(g.Key, g.Sum(x => x.Amount), g.Count()))
      .OrderByDescending(e => e.Amount)
      .ToList();

    // Flats paid count
    var flatPaidTotals = collections
      .Where(c => c.Type == CollectionType.ResidentBlock && c.FlatId.HasValue)
      .GroupBy(c => c.FlatId!.Value)
      .ToDictionary(g => g.Key, g => g.Sum(x => x.Amount));

    int paidFlatsCount = flats.Count(f => flatPaidTotals.TryGetValue(f.Id, out var paid) && paid >= f.ExpectedAmount && f.ExpectedAmount > 0);

    // Recent Collections (Top 8)
    var recentCollections = collections
      .OrderByDescending(c => c.CollectionDateTime)
      .Take(8)
      .Select(c => new CollectionDto(
        c.Id,
        c.Type.ToString(),
        c.FlatId,
        c.Block,
        c.Floor,
        c.FlatNumber,
        c.Category,
        c.DonorResidentName,
        c.Amount,
        c.Mode.ToString(),
        c.ReceiptNumber ?? $"SGDPS-{c.Id:D6}",
        c.TransactionReference,
        c.CollectionDateTime,
        c.Latitude,
        c.Longitude,
        c.CollectedByUserId,
        c.CollectedByName,
        c.Remarks,
        c.CreatedAt))
      .ToList();

    // Recent Expenses (Top 8)
    var recentExpenses = expenses
      .OrderByDescending(e => e.ExpenseDate)
      .Take(8)
      .Select(e => new ExpenseDto(
        e.Id,
        e.ExpenseDate,
        e.Category,
        e.Description,
        e.Amount,
        e.PaymentMode.ToString(),
        e.PaidToVendor,
        e.BillAttachmentUrl,
        e.Remarks,
        e.RecordedByUserId,
        e.RecordedByName,
        e.CreatedAt))
      .ToList();

    return TypedResults.Ok(new DashboardKpisResponse(
      totalCollection,
      cashCollection,
      upiCollection,
      bankCollection,
      chequeCollection,
      totalExpenses,
      currentBalance,
      collections.Count,
      expenses.Count,
      flats.Count,
      paidFlatsCount,
      blockMap,
      catMap,
      expCatMap,
      recentCollections,
      recentExpenses));
  }
}

// GET /api/reports/defaulters
public class GetDefaultersEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<Ok<List<DefaulterFlatDto>>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Get("/reports/defaulters");
    AllowAnonymous();
    Tags("Reports");
    Summary(s => s.Summary = "Get list of pending/defaulter flats with dues calculation");
  }

  public override async Task<Results<Ok<List<DefaulterFlatDto>>, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var flats = await db.Flats.AsNoTracking().Where(f => f.IsActive).ToListAsync(ct);
    var collections = await db.PaymentCollections
      .AsNoTracking()
      .Where(c => c.Type == CollectionType.ResidentBlock && c.FlatId.HasValue)
      .GroupBy(c => c.FlatId!.Value)
      .Select(g => new { FlatId = g.Key, Total = g.Sum(x => x.Amount) })
      .ToDictionaryAsync(x => x.FlatId, x => x.Total, ct);

    var defaulters = new List<DefaulterFlatDto>();

    foreach (var flat in flats)
    {
      var paid = collections.TryGetValue(flat.Id, out var amt) ? amt : 0m;
      if (paid < flat.ExpectedAmount)
      {
        defaulters.Add(new DefaulterFlatDto(
          flat.Id,
          flat.Block,
          flat.Floor,
          flat.FlatNumber,
          flat.OwnerName,
          flat.OwnerPhone,
          flat.ExpectedAmount,
          paid,
          flat.ExpectedAmount - paid));
      }
    }

    return TypedResults.Ok(defaulters.OrderBy(d => d.Block).ThenBy(d => d.Floor).ThenBy(d => d.FlatNumber).ToList());
  }
}

// GET /api/reports/date-wise
public class GetDateWiseReportEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<Ok<List<DateWiseSummaryDto>>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Get("/reports/date-wise");
    AllowAnonymous();
    Tags("Reports");
    Summary(s => s.Summary = "Get daily financial aggregates of collections vs expenses");
  }

  public override async Task<Results<Ok<List<DateWiseSummaryDto>>, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var collections = await db.PaymentCollections.AsNoTracking().ToListAsync(ct);
    var expenses = await db.Expenses.AsNoTracking().ToListAsync(ct);

    var dates = collections.Select(c => c.CollectionDateTime.ToString("yyyy-MM-dd"))
      .Union(expenses.Select(e => e.ExpenseDate.ToString("yyyy-MM-dd")))
      .Distinct()
      .OrderByDescending(d => d)
      .ToList();

    var result = new List<DateWiseSummaryDto>();

    foreach (var date in dates)
    {
      var dateCollections = collections.Where(c => c.CollectionDateTime.ToString("yyyy-MM-dd") == date).ToList();
      var dateExpenses = expenses.Where(e => e.ExpenseDate.ToString("yyyy-MM-dd") == date).ToList();

      var colTotal = dateCollections.Sum(c => c.Amount);
      var expTotal = dateExpenses.Sum(e => e.Amount);

      result.Add(new DateWiseSummaryDto(
        date,
        colTotal,
        dateCollections.Count,
        expTotal,
        dateExpenses.Count,
        colTotal - expTotal));
    }

    return TypedResults.Ok(result);
  }
}

// GET /api/reports/export/csv
public class ExportCsvReportEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<FileContentHttpResult, ProblemHttpResult>>
{
  public override void Configure()
  {
    Get("/reports/export/csv");
    AllowAnonymous();
    Tags("Reports");
    Summary(s => s.Summary = "Export all collections in CSV spreadsheet format");
  }

  public override async Task<Results<FileContentHttpResult, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var collections = await db.PaymentCollections
      .AsNoTracking()
      .OrderByDescending(c => c.CollectionDateTime)
      .ToListAsync(ct);

    var sb = new StringBuilder();
    sb.AppendLine("Receipt No,Date,Type,Block,Floor,Flat,Category,Resident/Donor,Amount,Payment Mode,Reference No,Collected By,Remarks");

    foreach (var c in collections)
    {
      var date = c.CollectionDateTime.ToString("yyyy-MM-dd HH:mm");
      var receipt = c.ReceiptNumber ?? $"SGDPS-{c.Id:D6}";
      var type = c.Type == CollectionType.ResidentBlock ? "Resident" : "Sponsorship/Other";
      var block = c.Block ?? "";
      var floor = c.Floor?.ToString() ?? "";
      var flat = c.FlatNumber ?? "";
      var category = c.Category ?? "";
      var name = (c.DonorResidentName ?? "").Replace(",", " ");
      var amount = c.Amount.ToString("F2");
      var mode = c.Mode.ToString();
      var refNo = c.TransactionReference ?? "";
      var collector = (c.CollectedByName ?? c.CollectedByUserId).Replace(",", " ");
      var remarks = (c.Remarks ?? "").Replace(",", " ").Replace("\n", " ");

      sb.AppendLine($"\"{receipt}\",\"{date}\",\"{type}\",\"{block}\",\"{floor}\",\"{flat}\",\"{category}\",\"{name}\",{amount},\"{mode}\",\"{refNo}\",\"{collector}\",\"{remarks}\"");
    }

    var bytes = Encoding.UTF8.GetBytes(sb.ToString());
    return TypedResults.File(bytes, "text/csv", $"SGDPS_Collections_{DateTime.UtcNow:yyyyMMdd_HHmm}.csv");
  }
}
