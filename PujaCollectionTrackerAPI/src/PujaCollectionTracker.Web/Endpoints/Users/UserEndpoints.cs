using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.Core.Interfaces;
using PujaCollectionTracker.Infrastructure.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace PujaCollectionTracker.Web.Endpoints.Users;

public record CollectorDto(
  int Id,
  string FirstName,
  string LastName,
  string FullName,
  string Email,
  bool IsActive,
  decimal TotalCollected,
  int CollectionsCount,
  decimal TodayCollected,
  int TodayCount,
  DateTime CreatedOn);

public record CreateCollectorRequest(
  string FirstName,
  string LastName,
  string Email,
  string Password);

// GET /api/users/collectors
public class ListCollectorsEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<Ok<List<CollectorDto>>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Get("/users/collectors");
    AllowAnonymous();
    Tags("Users");
    Summary(s => s.Summary = "Get all field collectors with live performance metrics");
  }

  public override async Task<Results<Ok<List<CollectorDto>>, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var collectorRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "Collector", ct);
    if (collectorRole == null)
      return TypedResults.Ok(new List<CollectorDto>());

    var userRoles = await db.UserRoles
      .Where(ur => ur.RoleId == collectorRole.Id)
      .Select(ur => ur.UserId)
      .ToListAsync(ct);

    var users = await db.Users
      .Where(u => userRoles.Contains(u.Id))
      .ToListAsync(ct);

    var collections = await db.PaymentCollections.AsNoTracking().ToListAsync(ct);
    var todayStr = DateTime.UtcNow.ToString("yyyy-MM-dd");

    var list = new List<CollectorDto>();

    foreach (var u in users)
    {
      var uIdStr = u.Id.Value.ToString();
      var uCollections = collections.Where(c => c.CollectedByUserId == uIdStr || c.CollectedByUserId == u.Email).ToList();
      var todayCollections = uCollections.Where(c => c.CollectionDateTime.ToString("yyyy-MM-dd") == todayStr).ToList();

      list.Add(new CollectorDto(
        u.Id.Value,
        u.FirstName,
        u.LastName,
        $"{u.FirstName} {u.LastName}",
        u.Email,
        u.IsActive,
        uCollections.Sum(c => c.Amount),
        uCollections.Count,
        todayCollections.Sum(c => c.Amount),
        todayCollections.Count,
        u.CreatedOn));
    }

    return TypedResults.Ok(list.OrderByDescending(c => c.TotalCollected).ToList());
  }
}

// POST /api/users/collectors
public class CreateCollectorEndpoint(AppDbContext db, IPasswordHasher hasher) : Endpoint<CreateCollectorRequest, Results<Created<CollectorDto>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Post("/users/collectors");
    AllowAnonymous();
    Tags("Users");
    Summary(s => s.Summary = "Register a new field collector");
  }

  public override async Task<Results<Created<CollectorDto>, ProblemHttpResult>> ExecuteAsync(CreateCollectorRequest req, CancellationToken ct)
  {
    if (await db.Users.AnyAsync(u => u.Email == req.Email.Trim(), ct))
      return TypedResults.Problem(detail: "User with this email already exists", statusCode: 400);

    var collectorRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "Collector", ct);
    if (collectorRole == null)
    {
      collectorRole = new Role("Collector", "Default Collector role");
      db.Roles.Add(collectorRole);
      await db.SaveChangesAsync(ct);
    }

    var hash = hasher.Hash(req.Password);
    var user = new User(req.FirstName.Trim(), req.LastName.Trim(), req.Email.Trim(), hash);
    user.VerifyEmail();
    user.AssignRole(collectorRole);

    db.Users.Add(user);
    await db.SaveChangesAsync(ct);

    var dto = new CollectorDto(
      user.Id.Value,
      user.FirstName,
      user.LastName,
      $"{user.FirstName} {user.LastName}",
      user.Email,
      user.IsActive,
      0m,
      0,
      0m,
      0,
      user.CreatedOn);

    return TypedResults.Created($"/users/collectors/{user.Id.Value}", dto);
  }
}
