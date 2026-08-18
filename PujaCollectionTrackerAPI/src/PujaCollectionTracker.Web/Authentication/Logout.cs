using System.Security.Claims;
using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.UseCases.Authentication.Logout;
using FastEndpoints;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.Web.Authentication;

/// <summary>
/// Endpoint to log out the currently authenticated user.
/// Requires JWT Bearer authentication.
/// </summary>
public class Logout(IMediator mediator, ILogger<Logout> _logger)
  : EndpointWithoutRequest<Results<Ok<LogoutResponse>, UnauthorizedHttpResult, ProblemHttpResult>>
{
  private readonly IMediator _mediator = mediator;

  public override void Configure()
  {
    Post("/auth/logout");
    // JWT Authentication is required (AllowAnonymous is omitted)

    Summary(s =>
    {
      s.Summary = "Log out user";
      s.Description = "Logs out the currently authenticated user by revoking their stored refresh token. The client application should also discard the stored JWT access token.";
      s.ResponseExamples[200] = new LogoutResponse("Logged out successfully.");
      s.Responses[200] = "Logged out successfully.";
      s.Responses[401] = "Unauthorized - invalid or missing JWT token";
      s.Responses[500] = "Internal server error";
    });

    Tags("Authentication");

    Description(builder => builder
      .Produces<LogoutResponse>(200, "application/json")
      .ProducesProblem(401)
      .ProducesProblem(500));
  }

  public override async Task<Results<Ok<LogoutResponse>, UnauthorizedHttpResult, ProblemHttpResult>>
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

    var result = await _mediator.Send(new LogoutCommand(UserId.From(userIdInt)), cancellationToken);

    if (result.Status == ResultStatus.Unauthorized)
    {
      return TypedResults.Unauthorized();
    }

    if (!result.IsSuccess)
    {
      return TypedResults.Problem(result.Errors.FirstOrDefault() ?? "Failed to log out.");
    }

    AuthCookies.ClearAuthCookies(HttpContext.Response);

    return TypedResults.Ok(new LogoutResponse("Logged out successfully."));
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(Logout), "NoRequest");
      throw;
    }
  }
}

public record LogoutResponse(string Message);
