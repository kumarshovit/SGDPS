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
  string? LastName,
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
    var todayStr = DateTime.UtcNow.AddHours(5.5).ToString("yyyy-MM-dd");

    var list = new List<CollectorDto>();

    foreach (var u in users)
    {
      var uIdStr = u.Id.Value.ToString();
      var fullName = $"{u.FirstName} {u.LastName}".Trim();
      var firstName = u.FirstName.Trim();

      var uCollections = collections.Where(c =>
        c.CollectedByUserId == uIdStr ||
        string.Equals(c.CollectedByUserId, u.Email, StringComparison.OrdinalIgnoreCase) ||
        (!string.IsNullOrWhiteSpace(c.CollectedByName) && (
          string.Equals(c.CollectedByName.Trim(), fullName, StringComparison.OrdinalIgnoreCase) ||
          string.Equals(c.CollectedByName.Trim(), firstName, StringComparison.OrdinalIgnoreCase) ||
          string.Equals(c.CollectedByName.Trim(), u.Email, StringComparison.OrdinalIgnoreCase)
        ))
      ).ToList();

      var todayCollections = uCollections.Where(c => c.CollectionDateTime.AddHours(5.5).ToString("yyyy-MM-dd") == todayStr).ToList();

      list.Add(new CollectorDto(
        u.Id.Value,
        u.FirstName,
        u.LastName,
        fullName,
        u.Email,
        u.IsActive,
        uCollections.Sum(c => c.Amount),
        uCollections.Count,
        todayCollections.Sum(c => c.Amount),
        todayCollections.Count,
        DateTime.SpecifyKind(u.CreatedOn, DateTimeKind.Utc)));
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
    if (string.IsNullOrWhiteSpace(req.FirstName))
      return TypedResults.Problem(detail: "First Name is required", statusCode: 400);

    if (string.IsNullOrWhiteSpace(req.Email))
      return TypedResults.Problem(detail: "Email is required", statusCode: 400);

    if (string.IsNullOrWhiteSpace(req.Password))
      return TypedResults.Problem(detail: "Password is required", statusCode: 400);

    var cleanEmail = req.Email.Trim().ToLowerInvariant();
    if (await db.Users.AnyAsync(u => u.Email.ToLower() == cleanEmail, ct))
      return TypedResults.Problem(detail: "A user with this email address already exists.", statusCode: 400);

    var collectorRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == "Collector", ct);
    if (collectorRole == null)
    {
      collectorRole = new Role("Collector", "Default Collector role");
      db.Roles.Add(collectorRole);
      await db.SaveChangesAsync(ct);
    }

    var hash = hasher.Hash(req.Password.Trim());
    var user = new User(req.FirstName.Trim(), req.LastName?.Trim() ?? string.Empty, cleanEmail, hash);
    user.VerifyEmail();
    user.AssignRole(collectorRole);

    db.Users.Add(user);
    await db.SaveChangesAsync(ct);

    var dto = new CollectorDto(
      user.Id.Value,
      user.FirstName,
      user.LastName,
      $"{user.FirstName} {user.LastName}".Trim(),
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

public record UpdateUserNameRequest(string FirstName, string? LastName, string? Password = null);

// PUT /api/users/{id}/name
public class UpdateUserNameEndpoint(AppDbContext db, IPasswordHasher hasher) : Endpoint<UpdateUserNameRequest, Results<Ok<CollectorDto>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Put("/users/{id:int}/name");
    AllowAnonymous();
    Tags("Users");
    Summary(s => s.Summary = "Update user first and last name, and optionally password");
  }

  public override async Task<Results<Ok<CollectorDto>, ProblemHttpResult>> ExecuteAsync(UpdateUserNameRequest req, CancellationToken ct)
  {
    var id = Route<int>("id");
    if (string.IsNullOrWhiteSpace(req.FirstName))
      return TypedResults.Problem(detail: "First Name is required", statusCode: 400);

    var userId = UserId.From(id);
    var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
    if (user == null)
      return TypedResults.Problem(detail: "User not found", statusCode: 404);

    user.UpdateName(req.FirstName.Trim(), req.LastName?.Trim());

    if (!string.IsNullOrWhiteSpace(req.Password))
    {
      if (req.Password.Trim().Length < 8)
        return TypedResults.Problem(detail: "Password must be at least 8 characters long", statusCode: 400);

      var newHash = hasher.Hash(req.Password.Trim());
      user.ChangePassword(newHash);
      user.RevokeRefreshToken();
    }

    await db.SaveChangesAsync(ct);

    var collections = await db.PaymentCollections.Where(c => c.CollectedByUserId == id.ToString()).ToListAsync(ct);

    var dto = new CollectorDto(
      user.Id.Value,
      user.FirstName,
      user.LastName,
      $"{user.FirstName} {user.LastName}".Trim(),
      user.Email,
      user.IsActive,
      collections.Sum(c => c.Amount),
      collections.Count,
      0m,
      0,
      user.CreatedOn);

    return TypedResults.Ok(dto);
  }
}

public record UpdateUserStatusRequest(bool IsActive);

// PUT /api/users/{id}/status
public class UpdateUserStatusEndpoint(AppDbContext db) : Endpoint<UpdateUserStatusRequest, Results<Ok<CollectorDto>, ProblemHttpResult>>
{
  public override void Configure()
  {
    Put("/users/{id:int}/status");
    AllowAnonymous();
    Tags("Users");
    Summary(s => s.Summary = "Toggle user active/inactive status");
  }

  public override async Task<Results<Ok<CollectorDto>, ProblemHttpResult>> ExecuteAsync(UpdateUserStatusRequest req, CancellationToken ct)
  {
    var id = Route<int>("id");
    var userId = UserId.From(id);
    var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
    if (user == null)
      return TypedResults.Problem(detail: "User not found", statusCode: 404);

    if (req.IsActive)
    {
      user.Activate();
    }
    else
    {
      user.Deactivate();
      user.RevokeRefreshToken();
    }

    await db.SaveChangesAsync(ct);

    var collections = await db.PaymentCollections.Where(c => c.CollectedByUserId == id.ToString()).ToListAsync(ct);

    var dto = new CollectorDto(
      user.Id.Value,
      user.FirstName,
      user.LastName,
      $"{user.FirstName} {user.LastName}".Trim(),
      user.Email,
      user.IsActive,
      collections.Sum(c => c.Amount),
      collections.Count,
      0m,
      0,
      user.CreatedOn);

    return TypedResults.Ok(dto);
  }
}

// DELETE /api/users/{id}
public class DeleteUserEndpoint(AppDbContext db) : EndpointWithoutRequest<Results<Ok<string>, NotFound, ProblemHttpResult>>
{
  public override void Configure()
  {
    Delete("/users/{id:int}");
    AllowAnonymous();
    Tags("Users");
    Summary(s => s.Summary = "Delete or permanently deactivate a collector/user");
  }

  public override async Task<Results<Ok<string>, NotFound, ProblemHttpResult>> ExecuteAsync(CancellationToken ct)
  {
    var id = Route<int>("id");
    var userId = UserId.From(id);
    var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
    if (user == null)
      return TypedResults.NotFound();

    user.Deactivate();
    user.RevokeRefreshToken();
    await db.SaveChangesAsync(ct);

    return TypedResults.Ok($"Collector '{user.FirstName} {user.LastName}' has been soft-deleted and deactivated. Mobile access and collection permissions have been revoked.");
  }
}

