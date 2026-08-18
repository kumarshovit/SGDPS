using PujaCollectionTracker.Core.CollectionAggregate;
using PujaCollectionTracker.Core.FlatAggregate;
using PujaCollectionTracker.Infrastructure.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace PujaCollectionTracker.Web.Endpoints.Flats;

public record FlatDto(
  int Id,
  string Block,
  int Floor,
  string FlatNumber,
  string OwnerName,
  string OwnerPhone,
  string? Email,
  decimal ExpectedAmount,
  decimal TotalCollected,
  decimal PendingAmount,
  string PaymentStatus,
  bool IsActive,
  DateTime CreatedAt);

public record CreateFlatRequest(
  string Block,
  int Floor,
  string FlatNumber,
  string OwnerName,
  string OwnerPhone,
  string? Email,
  decimal ExpectedAmount);

public record UpdateFlatRequest(
  string Block,
  int Floor,
  string FlatNumber,
  string OwnerName,
  string OwnerPhone,
  string? Email,
  decimal ExpectedAmount,
  bool IsActive);

public record FlatGridCell(
  int? FlatId,
  string Block,
  int Floor,
  string FlatNumber,
  string OwnerName,
  decimal ExpectedAmount,
  decimal CollectedAmount,
  string Status); // "Paid", "PartiallyPaid", "Pending"

public record BlockGridSummaryResponse(
  string Block,
  decimal BlockTotalCollected,
  decimal BlockTotalExpected,
  int TotalFlats,
  int PaidFlatsCount,
  Dictionary<int, List<FlatGridCell>> FloorFlats);

// GET /api/flats
public class ListFlatsEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<Ok<List<FlatDto>>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Get("/flats");
    AllowAnonymous(); // Or require auth
    Tags("Flats");
    Summary(s => s.Summary = "Get all flats with collection status and pending amounts");
  }

  public override async Task<Results<Ok<List<FlatDto>>, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var flats = await db.Flats.AsNoTracking().ToListAsync(ct);
    var collections = await db.PaymentCollections
      .AsNoTracking()
      .Where(c => c.Type == CollectionType.ResidentBlock && c.FlatId.HasValue)
      .GroupBy(c => c.FlatId!.Value)
      .Select(g => new { FlatId = g.Key, Total = g.Sum(x => x.Amount) })
      .ToDictionaryAsync(x => x.FlatId, x => x.Total, ct);

    var result = flats.Select(f =>
    {
      var collected = collections.TryGetValue(f.Id, out var sum) ? sum : 0m;
      var pending = Math.Max(0m, f.ExpectedAmount - collected);
      var status = collected >= f.ExpectedAmount && f.ExpectedAmount > 0 ? "Paid"
                 : collected > 0 ? "PartiallyPaid"
                 : "Pending";

      return new FlatDto(
        f.Id,
        f.Block,
        f.Floor,
        f.FlatNumber,
        f.OwnerName,
        f.OwnerPhone,
        f.Email,
        f.ExpectedAmount,
        collected,
        pending,
        status,
        f.IsActive,
        f.CreatedAt);
    }).OrderBy(f => f.Block).ThenBy(f => f.Floor).ThenBy(f => f.FlatNumber).ToList();

    return TypedResults.Ok(result);
  }
}

// GET /api/flats/grid-summary
public class GetBlockGridSummaryEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<Ok<List<BlockGridSummaryResponse>>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Get("/flats/grid-summary");
    AllowAnonymous();
    Tags("Flats");
    Summary(s => s.Summary = "Get visual block grid matrix with floor and flat breakdown");
  }

  public override async Task<Results<Ok<List<BlockGridSummaryResponse>>, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var flats = await db.Flats.AsNoTracking().ToListAsync(ct);
    var collections = await db.PaymentCollections
      .AsNoTracking()
      .Where(c => c.Type == CollectionType.ResidentBlock && c.FlatId.HasValue)
      .GroupBy(c => c.FlatId!.Value)
      .Select(g => new { FlatId = g.Key, Total = g.Sum(x => x.Amount) })
      .ToDictionaryAsync(x => x.FlatId, x => x.Total, ct);

    var blocks = flats.Select(f => f.Block).Distinct().OrderBy(b => b).ToList();
    var response = new List<BlockGridSummaryResponse>();

    foreach (var block in blocks)
    {
      var blockFlats = flats.Where(f => f.Block == block).ToList();
      var floorGroups = new Dictionary<int, List<FlatGridCell>>();

      var floors = blockFlats.Select(f => f.Floor).Distinct().OrderByDescending(fl => fl);
      decimal blockCollected = 0;
      decimal blockExpected = 0;
      int paidCount = 0;

      foreach (var floor in floors)
      {
        var floorFlats = blockFlats.Where(f => f.Floor == floor).OrderBy(f => f.FlatNumber).ToList();
        var cellList = new List<FlatGridCell>();

        foreach (var flat in floorFlats)
        {
          var collected = collections.TryGetValue(flat.Id, out var amt) ? amt : 0m;
          blockCollected += collected;
          blockExpected += flat.ExpectedAmount;
          var status = collected >= flat.ExpectedAmount && flat.ExpectedAmount > 0 ? "Paid"
                     : collected > 0 ? "PartiallyPaid"
                     : "Pending";

          if (status == "Paid") paidCount++;

          cellList.Add(new FlatGridCell(
            flat.Id,
            flat.Block,
            flat.Floor,
            flat.FlatNumber,
            flat.OwnerName,
            flat.ExpectedAmount,
            collected,
            status));
        }

        floorGroups[floor] = cellList;
      }

      response.Add(new BlockGridSummaryResponse(
        block,
        blockCollected,
        blockExpected,
        blockFlats.Count,
        paidCount,
        floorGroups));
    }

    return TypedResults.Ok(response);
  }
}

// POST /api/flats
public class CreateFlatEndpoint(AppDbContext db) : Endpoint<CreateFlatRequest, Results<Created<FlatDto>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Post("/flats");
    AllowAnonymous();
    Tags("Flats");
  }

  public override async Task<Results<Created<FlatDto>, ProblemHttpResult>> ExecuteAsync(CreateFlatRequest req, CancellationToken ct)
  {
    var flat = new Flat
    {
      Block = req.Block.Trim(),
      Floor = req.Floor,
      FlatNumber = req.FlatNumber.Trim(),
      OwnerName = req.OwnerName.Trim(),
      OwnerPhone = req.OwnerPhone.Trim(),
      Email = req.Email?.Trim(),
      ExpectedAmount = req.ExpectedAmount,
      IsActive = true,
      CreatedAt = DateTime.UtcNow
    };

    db.Flats.Add(flat);
    await db.SaveChangesAsync(ct);

    var dto = new FlatDto(
      flat.Id,
      flat.Block,
      flat.Floor,
      flat.FlatNumber,
      flat.OwnerName,
      flat.OwnerPhone,
      flat.Email,
      flat.ExpectedAmount,
      0m,
      flat.ExpectedAmount,
      "Pending",
      flat.IsActive,
      flat.CreatedAt);

    return TypedResults.Created($"/flats/{flat.Id}", dto);
  }
}

// PUT /api/flats/{id}
public class UpdateFlatEndpoint(AppDbContext db) : Endpoint<UpdateFlatRequest, Results<Ok<FlatDto>, NotFound, ProblemHttpResult>>
{
  public override void Configure()
  {
    Put("/flats/{id:int}");
    AllowAnonymous();
    Tags("Flats");
  }

  public override async Task<Results<Ok<FlatDto>, NotFound, ProblemHttpResult>> ExecuteAsync(UpdateFlatRequest req, CancellationToken ct)
  {
    var id = Route<int>("id");
    var flat = await db.Flats.FindAsync([id], ct);
    if (flat == null) return TypedResults.NotFound();

    flat.Block = req.Block.Trim();
    flat.Floor = req.Floor;
    flat.FlatNumber = req.FlatNumber.Trim();
    flat.OwnerName = req.OwnerName.Trim();
    flat.OwnerPhone = req.OwnerPhone.Trim();
    flat.Email = req.Email?.Trim();
    flat.ExpectedAmount = req.ExpectedAmount;
    flat.IsActive = req.IsActive;

    await db.SaveChangesAsync(ct);

    var totalCollected = await db.PaymentCollections
      .Where(c => c.FlatId == flat.Id && c.Type == CollectionType.ResidentBlock)
      .SumAsync(c => (decimal?)c.Amount, ct) ?? 0m;

    var pending = Math.Max(0m, flat.ExpectedAmount - totalCollected);
    var status = totalCollected >= flat.ExpectedAmount && flat.ExpectedAmount > 0 ? "Paid"
               : totalCollected > 0 ? "PartiallyPaid"
               : "Pending";

    return TypedResults.Ok(new FlatDto(
      flat.Id,
      flat.Block,
      flat.Floor,
      flat.FlatNumber,
      flat.OwnerName,
      flat.OwnerPhone,
      flat.Email,
      flat.ExpectedAmount,
      totalCollected,
      pending,
      status,
      flat.IsActive,
      flat.CreatedAt));
  }
}

// DELETE /api/flats/{id}
public class DeleteFlatEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<NoContent, NotFound, ProblemHttpResult>>
{
  public override void Configure()
  {
    Delete("/flats/{id:int}");
    AllowAnonymous();
    Tags("Flats");
  }

  public override async Task<Results<NoContent, NotFound, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var id = Route<int>("id");
    var flat = await db.Flats.FindAsync([id], ct);
    if (flat == null) return TypedResults.NotFound();

    db.Flats.Remove(flat);
    await db.SaveChangesAsync(ct);
    return TypedResults.NoContent();
  }
}
