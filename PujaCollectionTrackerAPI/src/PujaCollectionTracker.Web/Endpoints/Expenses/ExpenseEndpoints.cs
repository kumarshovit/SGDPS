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

public record ListExpensesQuery(
  string? Category,
  DateTime? StartDate,
  DateTime? EndDate,
  string? Search);

public record ExpenseCategorySummary(
  string Category,
  decimal TotalAmount,
  int Count);

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
    var query = db.Expenses.AsNoTracking().AsQueryable();

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

    var list = await query
      .OrderByDescending(e => e.ExpenseDate)
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
      .ToListAsync(ct);

    return TypedResults.Ok(list);
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

    var expense = new Expense
    {
      ExpenseDate = req.ExpenseDate == default ? DateTime.UtcNow : req.ExpenseDate,
      Category = string.IsNullOrWhiteSpace(req.Category) ? "Miscellaneous" : req.Category.Trim(),
      Description = req.Description.Trim(),
      Amount = req.Amount,
      PaymentMode = mode,
      PaidToVendor = req.PaidToVendor?.Trim(),
      BillAttachmentUrl = req.BillAttachmentUrl?.Trim(),
      Remarks = req.Remarks?.Trim(),
      RecordedByUserId = req.RecordedByUserId ?? "admin_1",
      RecordedByName = req.RecordedByName ?? "Admin",
      CreatedAt = DateTime.UtcNow
    };

    db.Expenses.Add(expense);
    await db.SaveChangesAsync(ct);

    var dto = new ExpenseDto(
      expense.Id,
      expense.ExpenseDate,
      expense.Category,
      expense.Description,
      expense.Amount,
      expense.PaymentMode.ToString(),
      expense.PaidToVendor,
      expense.BillAttachmentUrl,
      expense.Remarks,
      expense.RecordedByUserId,
      expense.RecordedByName,
      expense.CreatedAt);

    return TypedResults.Created($"/expenses/{expense.Id}", dto);
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
