using PujaCollectionTracker.Core.CollectionAggregate;
using PujaCollectionTracker.Core.ExpenseAggregate;
using PujaCollectionTracker.Infrastructure.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace PujaCollectionTracker.Web.Endpoints.Expenses;

public record ExpenseDto(
  int Id,
  DateTime ExpenseDate,
  string Category,
  string Description,
  decimal Amount,
  string PaymentMode,
  string? PaidToVendor,
  string? BillAttachmentUrl,
  string? Remarks,
  string RecordedByUserId,
  string? RecordedByName,
  DateTime CreatedAt);

public record CreateExpenseRequest(
  DateTime ExpenseDate,
  string Category,
  string Description,
  decimal Amount,
  string PaymentMode,
  string? PaidToVendor,
  string? BillAttachmentUrl,
  string? Remarks,
  string? RecordedByUserId,
  string? RecordedByName);

public record UpdateExpenseRequest(
  DateTime ExpenseDate,
  string Category,
  string Description,
  decimal Amount,
  string PaymentMode,
  string? PaidToVendor,
  string? BillAttachmentUrl,
  string? Remarks);

public record ListExpensesQuery(
  string? Category,
  DateTime? StartDate,
  DateTime? EndDate,
  string? Search);

public record ExpenseCategorySummary(
  string Category,
  decimal TotalAmount,
  int Count);

public record ExpenseAttachmentDto(int Id, string? BillAttachmentUrl);

// GET /api/expenses
public class ListExpensesEndpoint(AppDbContext db) : Endpoint<ListExpensesQuery, Results<Ok<List<ExpenseDto>>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Get("/expenses");
    AllowAnonymous();
    Tags("Expenses");
    Summary(s => s.Summary = "Get expense ledger records with date and category filters");
  }

  public override async Task<Results<Ok<List<ExpenseDto>>, ProblemHttpResult>> ExecuteAsync(ListExpensesQuery req, CancellationToken ct)
  {
    var query = db.Expenses.AsNoTracking().Where(e => !e.IsDeleted).AsQueryable();

    if (!string.IsNullOrWhiteSpace(req.Category))
      query = query.Where(e => e.Category == req.Category);

    if (req.StartDate.HasValue)
      query = query.Where(e => e.ExpenseDate >= req.StartDate.Value);

    if (req.EndDate.HasValue)
      query = query.Where(e => e.ExpenseDate <= req.EndDate.Value);

    if (!string.IsNullOrWhiteSpace(req.Search))
    {
      var s = req.Search.ToLower();
      query = query.Where(e =>
        e.Description.ToLower().Contains(s) ||
        e.Category.ToLower().Contains(s) ||
        (e.PaidToVendor != null && e.PaidToVendor.ToLower().Contains(s)) ||
        (e.Remarks != null && e.Remarks.ToLower().Contains(s)));
    }

    // Lightweight projection: excludes heavy BillAttachmentUrl column from SQL query
    var items = await query
      .OrderByDescending(e => e.ExpenseDate)
      .ThenByDescending(e => e.Id)
      .Select(e => new
      {
        e.Id,
        e.ExpenseDate,
        e.Category,
        e.Description,
        e.Amount,
        e.PaymentMode,
        e.PaidToVendor,
        HasAttachment = !string.IsNullOrWhiteSpace(e.BillAttachmentUrl),
        e.Remarks,
        e.RecordedByUserId,
        e.RecordedByName,
        e.CreatedAt
      })
      .ToListAsync(ct);

    var list = items.Select(e => new ExpenseDto(
      e.Id,
      DateTime.SpecifyKind(e.ExpenseDate, DateTimeKind.Utc),
      e.Category,
      e.Description,
      e.Amount,
      e.PaymentMode.ToString(),
      e.PaidToVendor,
      e.HasAttachment ? $"/api/expenses/{e.Id}/attachment" : null,
      e.Remarks,
      e.RecordedByUserId,
      e.RecordedByName,
      DateTime.SpecifyKind(e.CreatedAt, DateTimeKind.Utc))).ToList();

    return TypedResults.Ok(list);
  }
}

// GET /api/expenses/{id}/attachment
public class GetExpenseAttachmentEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<Ok<ExpenseAttachmentDto>, NotFound, ProblemHttpResult>>
{
  public override void Configure()
  {
    Get("/expenses/{id:int}/attachment");
    AllowAnonymous();
    Tags("Expenses");
    Summary(s => s.Summary = "Get full bill attachment data for an expense item on-demand");
  }

  public override async Task<Results<Ok<ExpenseAttachmentDto>, NotFound, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var id = Route<int>("id");
    var expense = await db.Expenses.AsNoTracking()
      .Where(e => e.Id == id && !e.IsDeleted)
      .Select(e => new { e.Id, e.BillAttachmentUrl })
      .FirstOrDefaultAsync(ct);

    if (expense == null || string.IsNullOrWhiteSpace(expense.BillAttachmentUrl))
      return TypedResults.NotFound();

    return TypedResults.Ok(new ExpenseAttachmentDto(expense.Id, expense.BillAttachmentUrl));
  }
}

// POST /api/expenses
public class CreateExpenseEndpoint(AppDbContext db) : Endpoint<CreateExpenseRequest, Results<Created<ExpenseDto>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Post("/expenses");
    AllowAnonymous();
    Tags("Expenses");
    Summary(s => s.Summary = "Record a new expense item");
  }

  public override async Task<Results<Created<ExpenseDto>, ProblemHttpResult>> ExecuteAsync(CreateExpenseRequest req, CancellationToken ct)
  {
    if (req.Amount <= 0)
      return TypedResults.Problem(detail: "Expense amount must be greater than 0", statusCode: 400);

    var mode = Enum.TryParse<PaymentMode>(req.PaymentMode, true, out var parsedMode) ? parsedMode : PaymentMode.Cash;
    var expenseDate = req.ExpenseDate == default ? DateTime.UtcNow : DateTime.SpecifyKind(req.ExpenseDate, DateTimeKind.Utc);
    var now = DateTime.UtcNow;

    var expense = new Expense
    {
      ExpenseDate = expenseDate,
      Category = string.IsNullOrWhiteSpace(req.Category) ? "Miscellaneous" : req.Category.Trim(),
      Description = req.Description.Trim(),
      Amount = req.Amount,
      PaymentMode = mode,
      PaidToVendor = req.PaidToVendor?.Trim(),
      BillAttachmentUrl = req.BillAttachmentUrl?.Trim(),
      Remarks = req.Remarks?.Trim(),
      RecordedByUserId = req.RecordedByUserId ?? "admin_1",
      RecordedByName = req.RecordedByName ?? "Admin",
      CreatedAt = now
    };

    db.Expenses.Add(expense);
    await db.SaveChangesAsync(ct);

    var dto = new ExpenseDto(
      expense.Id,
      DateTime.SpecifyKind(expense.ExpenseDate, DateTimeKind.Utc),
      expense.Category,
      expense.Description,
      expense.Amount,
      expense.PaymentMode.ToString(),
      expense.PaidToVendor,
      expense.BillAttachmentUrl,
      expense.Remarks,
      expense.RecordedByUserId,
      expense.RecordedByName,
      DateTime.SpecifyKind(expense.CreatedAt, DateTimeKind.Utc));

    return TypedResults.Created($"/expenses/{expense.Id}", dto);
  }
}

// PUT /api/expenses/{id}
public class UpdateExpenseEndpoint(AppDbContext db) : Endpoint<UpdateExpenseRequest, Results<Ok<ExpenseDto>, NotFound, ProblemHttpResult>>
{
  public override void Configure()
  {
    Put("/expenses/{id:int}");
    AllowAnonymous();
    Tags("Expenses");
    Summary(s => s.Summary = "Update an existing expense record");
  }

  public override async Task<Results<Ok<ExpenseDto>, NotFound, ProblemHttpResult>> ExecuteAsync(UpdateExpenseRequest req, CancellationToken ct)
  {
    var id = Route<int>("id");
    var expense = await db.Expenses.FindAsync([id], ct);
    if (expense == null) return TypedResults.NotFound();

    if (req.Amount <= 0)
      return TypedResults.Problem(detail: "Expense amount must be greater than 0", statusCode: 400);

    var mode = Enum.TryParse<PaymentMode>(req.PaymentMode, true, out var parsedMode) ? parsedMode : PaymentMode.Cash;
    var expenseDate = req.ExpenseDate == default ? expense.ExpenseDate : DateTime.SpecifyKind(req.ExpenseDate, DateTimeKind.Utc);

    expense.ExpenseDate = expenseDate;
    expense.Category = string.IsNullOrWhiteSpace(req.Category) ? "Miscellaneous" : req.Category.Trim();
    expense.Description = req.Description.Trim();
    expense.Amount = req.Amount;
    expense.PaymentMode = mode;
    expense.PaidToVendor = req.PaidToVendor?.Trim();
    expense.BillAttachmentUrl = string.IsNullOrWhiteSpace(req.BillAttachmentUrl) ? null : req.BillAttachmentUrl.Trim();
    expense.Remarks = req.Remarks?.Trim();

    await db.SaveChangesAsync(ct);

    var dto = new ExpenseDto(
      expense.Id,
      DateTime.SpecifyKind(expense.ExpenseDate, DateTimeKind.Utc),
      expense.Category,
      expense.Description,
      expense.Amount,
      expense.PaymentMode.ToString(),
      expense.PaidToVendor,
      expense.BillAttachmentUrl,
      expense.Remarks,
      expense.RecordedByUserId,
      expense.RecordedByName,
      DateTime.SpecifyKind(expense.CreatedAt, DateTimeKind.Utc));

    return TypedResults.Ok(dto);
  }
}

// DELETE /api/expenses/{id}
public class DeleteExpenseEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<NoContent, NotFound, ProblemHttpResult>>
{
  public override void Configure()
  {
    Delete("/expenses/{id:int}");
    AllowAnonymous();
    Tags("Expenses");
    Summary(s => s.Summary = "Soft delete expense record");
  }

  public override async Task<Results<NoContent, NotFound, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var id = Route<int>("id");
    var e = await db.Expenses.FindAsync([id], ct);
    if (e == null) return TypedResults.NotFound();

    e.IsDeleted = true;
    await db.SaveChangesAsync(ct);
    return TypedResults.NoContent();
  }
}

// GET /api/expenses/category-summary
public class GetExpenseSummaryEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<Ok<List<ExpenseCategorySummary>>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Get("/expenses/category-summary");
    AllowAnonymous();
    Tags("Expenses");
    Summary(s => s.Summary = "Get expenses grouped by category with total amounts");
  }

  public override async Task<Results<Ok<List<ExpenseCategorySummary>>, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var list = await db.Expenses
      .AsNoTracking()
      .GroupBy(e => e.Category)
      .Select(g => new ExpenseCategorySummary(
        g.Key,
        g.Sum(x => x.Amount),
        g.Count()))
      .OrderByDescending(x => x.TotalAmount)
      .ToListAsync(ct);

    return TypedResults.Ok(list);
  }
}
