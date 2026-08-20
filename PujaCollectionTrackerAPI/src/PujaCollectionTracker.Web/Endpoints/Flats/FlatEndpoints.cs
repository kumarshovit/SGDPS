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
    var block = req.Block?.Trim() ?? "";
    var flatNumber = req.FlatNumber?.Trim() ?? "";

    if (string.IsNullOrWhiteSpace(block) || string.IsNullOrWhiteSpace(flatNumber))
      return TypedResults.Problem(detail: "Block and Flat Number are required.", statusCode: 400);

    var exists = await db.Flats.AnyAsync(f => f.Block == block && f.FlatNumber == flatNumber, ct);
    if (exists)
      return TypedResults.Problem(detail: $"Flat {flatNumber} in {block} already exists.", statusCode: 400);

    var flat = new Flat
    {
      Block = block,
      Floor = req.Floor,
      FlatNumber = flatNumber,
      OwnerName = req.OwnerName?.Trim() ?? "",
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

public record BlockItemDto(
  string BlockName,
  int Floors,
  int FlatsPerFloor,
  int TotalUnits,
  int ActiveUnits,
  decimal ExpectedAmount,
  bool IsActive);

public record CreateBlockRequest(
  string BlockName,
  int Floors = 18,
  int FlatsPerFloor = 7,
  decimal ExpectedAmount = 2500m);

// GET /api/blocks
public class ListBlocksEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<Ok<List<BlockItemDto>>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Get("/blocks");
    AllowAnonymous();
    Tags("Blocks");
    Summary(s => s.Summary = "Get list of all blocks with dimensions and unit counts");
  }

  public override async Task<Results<Ok<List<BlockItemDto>>, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var flats = await db.Flats.AsNoTracking().ToListAsync(ct);
    var grouped = flats.GroupBy(f => f.Block).OrderBy(g => g.Key).ToList();
    var result = new List<BlockItemDto>();

    foreach (var g in grouped)
    {
      var blockFlats = g.ToList();
      var floors = blockFlats.Select(f => f.Floor).Distinct().Count();
      var maxFlatsPerFloor = blockFlats.GroupBy(f => f.Floor).Select(fg => fg.Count()).DefaultIfEmpty(0).Max();
      var totalUnits = blockFlats.Count;
      var activeUnits = blockFlats.Count(f => f.IsActive);
      var expectedAmt = blockFlats.FirstOrDefault()?.ExpectedAmount ?? 2500m;
      var isActive = blockFlats.Any(f => f.IsActive);

      result.Add(new BlockItemDto(
        g.Key,
        floors > 0 ? floors : 18,
        maxFlatsPerFloor > 0 ? maxFlatsPerFloor : 7,
        totalUnits,
        activeUnits,
        expectedAmt,
        isActive));
    }

    return TypedResults.Ok(result);
  }
}

// POST /api/blocks
public class CreateBlockEndpoint(AppDbContext db) : Endpoint<CreateBlockRequest, Results<Ok<BlockItemDto>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Post("/blocks");
    AllowAnonymous();
    Tags("Blocks");
    Summary(s => s.Summary = "Create or activate a block with custom floors and flats per floor (default: 18 floors, 7 flats/floor)");
  }

  public override async Task<Results<Ok<BlockItemDto>, ProblemHttpResult>> ExecuteAsync(CreateBlockRequest req, CancellationToken ct)
  {
    var rawName = req.BlockName?.Trim();
    if (string.IsNullOrWhiteSpace(rawName))
      return TypedResults.Problem(detail: "Block name is required", statusCode: 400);

    // Format single letters (e.g. 'e' -> 'E-Block')
    string blockName = rawName;
    if (rawName.Length == 1 && char.IsLetter(rawName[0]))
    {
      blockName = $"{char.ToUpperInvariant(rawName[0])}-Block";
    }

    int floorCount = req.Floors > 0 ? req.Floors : 18;
    int unitsPerFloor = req.FlatsPerFloor > 0 ? req.FlatsPerFloor : 7;
    decimal expectedAmt = req.ExpectedAmount > 0 ? req.ExpectedAmount : 2500m;

    var existingFlats = await db.Flats.Where(f => f.Block.ToLower() == blockName.ToLower()).ToListAsync(ct);
    if (existingFlats.Count != 0)
    {
      foreach (var f in existingFlats)
      {
        f.IsActive = true;
        if (req.ExpectedAmount > 0)
        {
          f.ExpectedAmount = expectedAmt;
        }
      }
      await db.SaveChangesAsync(ct);

      var existingDto = new BlockItemDto(
        blockName,
        existingFlats.Select(f => f.Floor).Distinct().Count(),
        existingFlats.GroupBy(f => f.Floor).Select(g => g.Count()).DefaultIfEmpty(0).Max(),
        existingFlats.Count,
        existingFlats.Count,
        expectedAmt,
        true);

      return TypedResults.Ok(existingDto);
    }

    var newFlats = new List<Flat>();
    for (int fl = 1; fl <= floorCount; fl++)
    {
      for (int unit = 1; unit <= unitsPerFloor; unit++)
      {
        string flatNum = unit < 10 ? $"{fl}0{unit}" : $"{fl}{unit}";
        newFlats.Add(new Flat
        {
          Block = blockName,
          Floor = fl,
          FlatNumber = flatNum,
          OwnerName = $"Resident {blockName[..1].ToUpper()}-{flatNum}",
          OwnerPhone = "",
          ExpectedAmount = expectedAmt,
          IsActive = true,
          CreatedAt = DateTime.UtcNow
        });
      }
    }

    db.Flats.AddRange(newFlats);
    await db.SaveChangesAsync(ct);

    var createdDto = new BlockItemDto(
      blockName,
      floorCount,
      unitsPerFloor,
      newFlats.Count,
      newFlats.Count,
      expectedAmt,
      true);

    return TypedResults.Ok(createdDto);
  }
}

public record ToggleBlockStatusRequest(bool IsActive);

// PUT /api/blocks/{blockName}/status
public class ToggleBlockStatusEndpoint(AppDbContext db) : Endpoint<ToggleBlockStatusRequest, Results<Ok<string>, NotFound, ProblemHttpResult>>
{
  public override void Configure()
  {
    Put("/blocks/{blockName}/status");
    AllowAnonymous();
    Tags("Blocks");
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

// DELETE /api/blocks/{blockName}
public class DeleteBlockEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<Ok<string>, NotFound, ProblemHttpResult>>
{
  public override void Configure()
  {
    Delete("/blocks/{blockName}");
    AllowAnonymous();
    Tags("Blocks");
    Summary(s => s.Summary = "Permanently delete an unwanted block and all its flat units from the database (only if no collections exist)");
  }

  public override async Task<Results<Ok<string>, NotFound, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var blockName = Route<string>("blockName");
    if (string.IsNullOrWhiteSpace(blockName))
      return TypedResults.Problem(detail: "Block name is required", statusCode: 400);

    var cleanName = blockName.Trim().ToLowerInvariant();
    var flats = await db.Flats.Where(f => f.Block.ToLower() == cleanName).ToListAsync(ct);
    if (flats.Count == 0)
      return TypedResults.NotFound();

    var flatIds = flats.Select(f => f.Id).ToList();
    var hasCollections = await db.PaymentCollections.AnyAsync(c => c.FlatId.HasValue && flatIds.Contains(c.FlatId.Value), ct);
    if (hasCollections)
    {
      return TypedResults.Problem(
        detail: $"Cannot permanently delete block '{blockName}' because one or more flats have recorded collection entries. Please deactivate the block instead to preserve payment audit history.",
        statusCode: 400);
    }

    db.Flats.RemoveRange(flats);
    await db.SaveChangesAsync(ct);

    return TypedResults.Ok($"Successfully deleted {flats.Count} flat units for block '{blockName}'.");
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

    flat.Block = string.IsNullOrWhiteSpace(req.Block) ? flat.Block : req.Block.Trim();
    flat.Floor = req.Floor;
    flat.FlatNumber = string.IsNullOrWhiteSpace(req.FlatNumber) ? flat.FlatNumber : req.FlatNumber.Trim();
    flat.OwnerName = req.OwnerName?.Trim() ?? "";
    flat.OwnerPhone = req.OwnerPhone?.Trim() ?? "";
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
