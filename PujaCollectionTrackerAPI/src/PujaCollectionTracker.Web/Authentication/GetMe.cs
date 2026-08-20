using System.Security.Claims;
using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.UseCases.Authentication.GetMe;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.Web.Authentication;

/// <summary>
/// Endpoint to retrieve the currently logged in user's profile info.
/// Requires JWT Bearer authentication.
/// </summary>
public class GetMe(IMediator mediator, ILogger<GetMe> _logger)
  : EndpointWithoutRequest<Results<Ok<UserMeResponse>, UnauthorizedHttpResult, NotFound, ProblemHttpResult>>
{
  private readonly IMediator _mediator = mediator;

  public override void Configure()
  {
    Get("/auth/me");
    // JWT Authentication is required (AllowAnonymous is omitted)
    
    Summary(s =>
    {
      s.Summary = "Get current user profile";
      s.Description = "Retrieves the profile information of the currently authenticated user using their JWT token.";
      s.ResponseExamples[200] = new UserMeResponse(
        1,
        "John",
        "Doe",
        "john.doe@example.com",
        true,
        DateTime.UtcNow,
        new[] { "Player" }
      );
      s.Responses[200] = "Successfully retrieved user profile";
      s.Responses[401] = "Unauthorized - invalid or missing JWT token";
      s.Responses[404] = "User not found";
      s.Responses[500] = "Internal server error";
    });

    Tags("Authentication");

    Description(builder => builder
      .Produces<UserMeResponse>(200, "application/json")
      .ProducesProblem(401)
      .ProducesProblem(404)
      .ProducesProblem(500));
  }

  public override async Task<Results<Ok<UserMeResponse>, UnauthorizedHttpResult, NotFound, ProblemHttpResult>>
    ExecuteAsync(CancellationToken cancellationToken)
  {
    try
    {
    // Extract the User ID from JWT claims.
    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("sub")?.Value;

    if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userIdInt))
    {
      return TypedResults.Unauthorized();
    }

    var result = await _mediator.Send(new GetMeQuery(UserId.From(userIdInt)), cancellationToken);

    if (result.Status == ResultStatus.NotFound)
    {
      return TypedResults.NotFound();
    }

    if (!result.IsSuccess)
    {
      return TypedResults.Problem(result.Errors.FirstOrDefault() ?? "Failed to retrieve user profile.");
    }

    var user = result.Value;
    if (!user.IsActive)
    {
      return TypedResults.Unauthorized();
    }

    return TypedResults.Ok(new UserMeResponse(
      user.Id.Value,
      user.FirstName,
      user.LastName,
      user.Email,
      user.IsActive,
      user.CreatedOn,
      user.Roles
    ));
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(GetMe), "NoRequest");
      throw;
    }
  }
}

public record UserMeResponse(
  int Id,
  string FirstName,
  string LastName,
  string Email,
  bool IsActive,
  DateTime CreatedOn,
  IReadOnlyCollection<string> Roles);
