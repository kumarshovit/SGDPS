using PujaCollectionTracker.Core.CollectionAggregate;
using PujaCollectionTracker.Core.FlatAggregate;
using PujaCollectionTracker.Infrastructure.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace PujaCollectionTracker.Web.Endpoints.Collections;

public record CollectionDto(
  int Id,
  string Type, // "ResidentBlock" or "SponsorshipOther"
  int? FlatId,
  string? Block,
  int? Floor,
  string? FlatNumber,
  string? Category,
  string? DonorResidentName,
  decimal Amount,
  string Mode, // "Cash", "UPI", "Cheque", "BankTransfer"
  string ReceiptNumber,
  string? TransactionReference,
  DateTime CollectionDateTime,
  double? Latitude,
  double? Longitude,
  string CollectedByUserId,
  string? CollectedByName,
  string? Remarks,
  DateTime CreatedAt);

public record CreateCollectionRequest(
  string Type, // "ResidentBlock" or "SponsorshipOther"
  int? FlatId,
  string? Block,
  int? Floor,
  string? FlatNumber,
  string? Category,
  string? DonorResidentName,
  decimal Amount,
  string Mode, // "Cash", "UPI", "Cheque", "BankTransfer"
  string? TransactionReference,
  double? Latitude,
  double? Longitude,
  string? CollectedByUserId,
  string? CollectedByName,
  string? Remarks,
  DateTime? CollectionDateTime);

public record UpdateCollectionRequest(
  decimal Amount,
  string Mode,
  string? TransactionReference,
  string? Remarks);

public record ListCollectionsQuery(
  string? Type,
  string? Block,
  int? Floor,
  int? FlatId,
  string? Mode,
  string? Category,
  string? CollectorId,
  DateTime? StartDate,
  DateTime? EndDate,
  string? Search);

// GET /api/collections
public class ListCollectionsEndpoint(AppDbContext db) : Endpoint<ListCollectionsQuery, Results<Ok<List<CollectionDto>>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Get("/collections");
    AllowAnonymous();
    Tags("Collections");
    Summary(s => s.Summary = "Get collection records with multi-dimensional filtering");
  }

  public override async Task<Results<Ok<List<CollectionDto>>, ProblemHttpResult>> ExecuteAsync(ListCollectionsQuery req, CancellationToken ct)
  {
    var query = db.PaymentCollections.AsNoTracking().AsQueryable();

    if (!string.IsNullOrWhiteSpace(req.Type))
    {
      if (Enum.TryParse<CollectionType>(req.Type, true, out var t))
        query = query.Where(c => c.Type == t);
    }

    if (!string.IsNullOrWhiteSpace(req.Block))
      query = query.Where(c => c.Block == req.Block);

    if (req.Floor.HasValue)
      query = query.Where(c => c.Floor == req.Floor.Value);

    if (req.FlatId.HasValue)
      query = query.Where(c => c.FlatId == req.FlatId.Value);

    if (!string.IsNullOrWhiteSpace(req.Mode))
    {
      if (Enum.TryParse<PaymentMode>(req.Mode, true, out var m))
        query = query.Where(c => c.Mode == m);
    }

    if (!string.IsNullOrWhiteSpace(req.Category))
      query = query.Where(c => c.Category == req.Category);

    if (!string.IsNullOrWhiteSpace(req.CollectorId))
      query = query.Where(c => c.CollectedByUserId == req.CollectorId);

    if (req.StartDate.HasValue)
      query = query.Where(c => c.CollectionDateTime >= req.StartDate.Value);

    if (req.EndDate.HasValue)
      query = query.Where(c => c.CollectionDateTime <= req.EndDate.Value);

    if (!string.IsNullOrWhiteSpace(req.Search))
    {
      var s = req.Search.ToLower();
      query = query.Where(c =>
        (c.DonorResidentName != null && c.DonorResidentName.ToLower().Contains(s)) ||
        (c.Block != null && c.Block.ToLower().Contains(s)) ||
        (c.FlatNumber != null && c.FlatNumber.ToLower().Contains(s)) ||
        (c.Category != null && c.Category.ToLower().Contains(s)) ||
        (c.CollectedByName != null && c.CollectedByName.ToLower().Contains(s)) ||
        (c.ReceiptNumber != null && c.ReceiptNumber.ToLower().Contains(s)) ||
        (c.Remarks != null && c.Remarks.ToLower().Contains(s)));
    }

    var list = await query
      .OrderByDescending(c => c.CollectionDateTime)
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
      .ToListAsync(ct);

    return TypedResults.Ok(list);
  }
}

// GET /api/collections/{id}
public class GetCollectionByIdEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<Ok<CollectionDto>, NotFound, ProblemHttpResult>>
{
  public override void Configure()
  {
    Get("/collections/{id:int}");
    AllowAnonymous();
    Tags("Collections");
  }

  public override async Task<Results<Ok<CollectionDto>, NotFound, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var id = Route<int>("id");
    var c = await db.PaymentCollections.FindAsync([id], ct);
    if (c == null) return TypedResults.NotFound();

    return TypedResults.Ok(new CollectionDto(
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
      c.CreatedAt));
  }
}

// POST /api/collections
public class CreateCollectionEndpoint(AppDbContext db) : Endpoint<CreateCollectionRequest, Results<Created<CollectionDto>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Post("/collections");
    AllowAnonymous();
    Tags("Collections");
    Summary(s => s.Summary = "Record a new payment collection with auto-generated receipt and GPS tracking");
  }

  public override async Task<Results<Created<CollectionDto>, ProblemHttpResult>> ExecuteAsync(CreateCollectionRequest req, CancellationToken ct)
  {
    if (req.Amount <= 0)
      return TypedResults.Problem(detail: "Collection amount must be greater than 0", statusCode: 400);

    var type = Enum.TryParse<CollectionType>(req.Type, true, out var parsedType) ? parsedType : CollectionType.ResidentBlock;
    var mode = Enum.TryParse<PaymentMode>(req.Mode, true, out var parsedMode) ? parsedMode : PaymentMode.Cash;

    string? block = req.Block;
    int? floor = req.Floor;
    string? flatNumber = req.FlatNumber;
    string? donorName = req.DonorResidentName;

    // If flatId is provided, enrich with Flat master details if missing
    if (req.FlatId.HasValue)
    {
      var flat = await db.Flats.FindAsync([req.FlatId.Value], ct);
      if (flat != null)
      {
        block = flat.Block;
        floor = flat.Floor;
        flatNumber = flat.FlatNumber;
        if (string.IsNullOrWhiteSpace(donorName))
          donorName = flat.OwnerName;
      }
    }

    var now = DateTime.UtcNow;
    var receiptNum = $"REC-{now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

    var collection = new PaymentCollection
    {
      Type = type,
      FlatId = req.FlatId,
      Block = block,
      Floor = floor,
      FlatNumber = flatNumber,
      Category = req.Category,
      DonorResidentName = donorName,
      Amount = req.Amount,
      Mode = mode,
      ReceiptNumber = receiptNum,
      TransactionReference = req.TransactionReference,
      CollectionDateTime = req.CollectionDateTime ?? now,
      Latitude = req.Latitude,
      Longitude = req.Longitude,
      CollectedByUserId = req.CollectedByUserId ?? "collector_1",
      CollectedByName = req.CollectedByName ?? "Collector",
      Remarks = req.Remarks,
      CreatedAt = now
    };

    db.PaymentCollections.Add(collection);
    await db.SaveChangesAsync(ct);

    var dto = new CollectionDto(
      collection.Id,
      collection.Type.ToString(),
      collection.FlatId,
      collection.Block,
      collection.Floor,
      collection.FlatNumber,
      collection.Category,
      collection.DonorResidentName,
      collection.Amount,
      collection.Mode.ToString(),
      collection.ReceiptNumber,
      collection.TransactionReference,
      collection.CollectionDateTime,
      collection.Latitude,
      collection.Longitude,
      collection.CollectedByUserId,
      collection.CollectedByName,
      collection.Remarks,
      collection.CreatedAt);

    return TypedResults.Created($"/collections/{collection.Id}", dto);
  }
}

// PUT /api/collections/{id}
public class UpdateCollectionEndpoint(AppDbContext db) : Endpoint<UpdateCollectionRequest, Results<Ok<CollectionDto>, NotFound, ProblemHttpResult>>
{
  public override void Configure()
  {
    Put("/collections/{id:int}");
    AllowAnonymous();
    Tags("Collections");
  }

  public override async Task<Results<Ok<CollectionDto>, NotFound, ProblemHttpResult>> ExecuteAsync(UpdateCollectionRequest req, CancellationToken ct)
  {
    var id = Route<int>("id");
    var c = await db.PaymentCollections.FindAsync([id], ct);
    if (c == null) return TypedResults.NotFound();

    if (req.Amount <= 0)
      return TypedResults.Problem(detail: "Amount must be greater than 0", statusCode: 400);

    var mode = Enum.TryParse<PaymentMode>(req.Mode, true, out var parsedMode) ? parsedMode : c.Mode;

    c.Amount = req.Amount;
    c.Mode = mode;
    c.TransactionReference = req.TransactionReference;
    c.Remarks = req.Remarks;
    c.UpdatedAt = DateTime.UtcNow;

    await db.SaveChangesAsync(ct);

    return TypedResults.Ok(new CollectionDto(
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
      c.CreatedAt));
  }
}

// DELETE /api/collections/{id}
public class DeleteCollectionEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<NoContent, NotFound, ProblemHttpResult>>
{
  public override void Configure()
  {
    Delete("/collections/{id:int}");
    AllowAnonymous();
    Tags("Collections");
    Summary(s => s.Summary = "Soft delete collection entry");
  }

  public override async Task<Results<NoContent, NotFound, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var id = Route<int>("id");
    var c = await db.PaymentCollections.FindAsync([id], ct);
    if (c == null) return TypedResults.NotFound();

    c.IsDeleted = true;
    c.UpdatedAt = DateTime.UtcNow;
    await db.SaveChangesAsync(ct);

    return TypedResults.NoContent();
  }
}
