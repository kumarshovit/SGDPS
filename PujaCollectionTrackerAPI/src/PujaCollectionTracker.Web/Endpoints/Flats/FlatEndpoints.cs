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
      var pending = 0m;
      var status = collected > 0 ? "Paid" : "Unpaid";

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
    var flats = await db.Flats.AsNoTracking().Where(f => f.IsActive).ToListAsync(ct);
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

      var floors = blockFlats.Select(f => f.Floor).Distinct();
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
          var status = collected > 0 ? "Paid" : "Unpaid";

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
    Summary(s => s.Summary = "Add a new flat unit");
  }

  public override async Task<Results<Created<FlatDto>, ProblemHttpResult>> ExecuteAsync(CreateFlatRequest req, CancellationToken ct)
  {
    var block = req.Block.Trim();
    var flatNumber = req.FlatNumber.Trim();

    var exists = await db.Flats.AnyAsync(f => f.Block == block && f.FlatNumber == flatNumber, ct);
    if (exists)
      return TypedResults.Problem(detail: $"Flat {flatNumber} in {block} already exists.", statusCode: 400);

    var flat = new Flat
    {
      Block = block,
      Floor = req.Floor,
      FlatNumber = flatNumber,
      OwnerName = req.OwnerName.Trim(),
      OwnerPhone = req.OwnerPhone?.Trim() ?? "",
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
      0m,
      "Unpaid",
      flat.IsActive,
      flat.CreatedAt);

    return TypedResults.Created($"/flats/{flat.Id}", dto);
  }
}

public record CreateBlockRequest(
  string BlockName,
  int Floors = 9,
  int FlatsPerFloor = 7,
  decimal ExpectedAmount = 0);

// POST /api/flats/create-block
public class CreateBlockEndpoint(AppDbContext db) : Endpoint<CreateBlockRequest, Results<Ok<List<FlatDto>>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Post("/flats/create-block");
    AllowAnonymous();
    Tags("Flats");
    Summary(s => s.Summary = "Create a complete block with 9 floors and 7 flats per floor automatically");
  }

  public override async Task<Results<Ok<List<FlatDto>>, ProblemHttpResult>> ExecuteAsync(CreateBlockRequest req, CancellationToken ct)
  {
    var blockName = req.BlockName?.Trim();
    if (string.IsNullOrWhiteSpace(blockName))
      return TypedResults.Problem(detail: "Block name is required", statusCode: 400);

    var existingFlats = await db.Flats.Where(f => f.Block.ToLower() == blockName.ToLower()).ToListAsync(ct);
    if (existingFlats.Count != 0)
    {
      foreach (var f in existingFlats)
      {
        f.IsActive = true;
      }
      await db.SaveChangesAsync(ct);

      var existingDtos = existingFlats
        .Select(f => new FlatDto(
          f.Id,
          f.Block,
          f.Floor,
          f.FlatNumber,
          f.OwnerName,
          f.OwnerPhone,
          f.Email,
          f.ExpectedAmount,
          0m,
          0m,
          "Unpaid",
          f.IsActive,
          f.CreatedAt))
        .ToList();
      return TypedResults.Ok(existingDtos);
    }

    int floorCount = req.Floors > 0 ? req.Floors : 9;
    int unitsPerFloor = req.FlatsPerFloor > 0 ? req.FlatsPerFloor : 7;
    var newFlats = new List<Flat>();

    for (int fl = 1; fl <= floorCount; fl++)
    {
      for (int unit = 1; unit <= unitsPerFloor; unit++)
      {
        string flatNum = $"{fl}0{unit}";
        newFlats.Add(new Flat
        {
          Block = blockName,
          Floor = fl,
          FlatNumber = flatNum,
          OwnerName = $"Owner {blockName[..1].ToUpper()}-{flatNum}",
          OwnerPhone = "",
          ExpectedAmount = req.ExpectedAmount,
          IsActive = true,
          CreatedAt = DateTime.UtcNow
        });
      }
    }

    db.Flats.AddRange(newFlats);
    await db.SaveChangesAsync(ct);

    var dtos = newFlats.Select(f => new FlatDto(
      f.Id,
      f.Block,
      f.Floor,
      f.FlatNumber,
      f.OwnerName,
      f.OwnerPhone,
      f.Email,
      f.ExpectedAmount,
      0m,
      0m,
      "Unpaid",
      f.IsActive,
      f.CreatedAt)).ToList();

    return TypedResults.Ok(dtos);
  }
}

public record ToggleBlockStatusRequest(bool IsActive);

// PUT /api/flats/blocks/{blockName}/status
public class ToggleBlockStatusEndpoint(AppDbContext db) : Endpoint<ToggleBlockStatusRequest, Results<Ok<string>, NotFound, ProblemHttpResult>>
{
  public override void Configure()
  {
    Put("/flats/blocks/{blockName}/status");
    AllowAnonymous();
    Tags("Flats");
    Summary(s => s.Summary = "Activate or deactivate all flats in a block");
  }

  public override async Task<Results<Ok<string>, NotFound, ProblemHttpResult>> ExecuteAsync(ToggleBlockStatusRequest req, CancellationToken ct)
  {
    var blockName = Route<string>("blockName");
    if (string.IsNullOrWhiteSpace(blockName))
      return TypedResults.Problem(detail: "Block name is required", statusCode: 400);

    var cleanName = blockName.Trim().ToLowerInvariant();
    var flats = await db.Flats.Where(f => f.Block.ToLower() == cleanName).ToListAsync(ct);
    if (flats.Count == 0)
      return TypedResults.NotFound();

    foreach (var flat in flats)
    {
      flat.IsActive = req.IsActive;
    }

    await db.SaveChangesAsync(ct);
    return TypedResults.Ok($"Updated {flats.Count} flats in block '{blockName}' to IsActive={req.IsActive}");
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

    var pending = 0m;
    var status = totalCollected > 0 ? "Paid" : "Unpaid";

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
