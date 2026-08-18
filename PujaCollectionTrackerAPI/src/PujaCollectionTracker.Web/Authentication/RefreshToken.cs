using System.ComponentModel.DataAnnotations;
using PujaCollectionTracker.UseCases.Authentication.RefreshToken;
using FastEndpoints;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.Web.Authentication;

public class RefreshTokenEndpoint(IMediator mediator, ILogger<RefreshTokenEndpoint> _logger)
  : Endpoint<RefreshTokenRequest,
      Results<Ok<RefreshTokenResponse>,
              ValidationProblem,
              ProblemHttpResult>>
{
  private readonly IMediator _mediator = mediator;

  public override void Configure()
  {
    Post(RefreshTokenRequest.Route);
    AllowAnonymous();
    Summary(s =>
    {
      s.Summary = "Refresh JWT access token";
      s.Description = "Validates the refresh token cookie, rotates it, and returns a new Access Token and new Refresh Token.";
      s.ExampleRequest = new RefreshTokenRequest
      {
        RefreshToken = "dGhpcyBpcyBhIHJhbmRvbSByZWZyZXNoIHRva2Vu"
      };
      s.ResponseExamples[200] = new RefreshTokenResponse(
        "token",
        DateTime.UtcNow.AddHours(1),
        DateTime.UtcNow.AddDays(7));
      s.Responses[200] = "Token refresh successful - rotates auth cookies";
      s.Responses[400] = "Invalid input data - validation errors";
      s.Responses[401] = "Invalid or expired refresh token";
      s.Responses[500] = "Internal server error";
    });

    Tags("Authentication");

    Description(builder => builder
      .Accepts<RefreshTokenRequest>("application/json")
      .Produces<RefreshTokenResponse>(200, "application/json")
      .ProducesProblem(400)
      .ProducesProblem(401)
      .ProducesProblem(500));
  }

  public override async Task<Results<Ok<RefreshTokenResponse>, ValidationProblem, ProblemHttpResult>>
    ExecuteAsync(RefreshTokenRequest request, CancellationToken cancellationToken)
  {
    try
    {
      var refreshToken = !string.IsNullOrWhiteSpace(request.RefreshToken)
        ? request.RefreshToken
        : HttpContext.Request.Cookies[AuthCookies.RefreshTokenName];

      if (string.IsNullOrWhiteSpace(refreshToken))
      {
        return TypedResults.Problem(
          title: "Unauthorized",
          detail: "Refresh token is required.",
          statusCode: StatusCodes.Status401Unauthorized);
      }

      var result = await _mediator.Send(new RefreshTokenCommand(refreshToken), cancellationToken);

      if (result.Status == ResultStatus.Unauthorized)
      {
        return TypedResults.Problem(
          title: "Unauthorized",
          detail: result.Errors.FirstOrDefault() ?? "Invalid or expired refresh token.",
          statusCode: StatusCodes.Status401Unauthorized);
      }

      if (!result.IsSuccess)
      {
        return TypedResults.Problem(result.Errors.FirstOrDefault() ?? "Token refresh failed.");
      }

      var value = result.Value;
      AuthCookies.SetAuthCookies(
        HttpContext.Response,
        value.AccessToken,
        value.ExpiresAt,
        value.RefreshToken,
        value.RefreshTokenExpiresAt);

      return TypedResults.Ok(new RefreshTokenResponse(
        value.AccessToken,
        value.ExpiresAt,
        value.RefreshTokenExpiresAt));
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Unhandled exception in {ClassName}. Request: {@Request}", nameof(RefreshTokenEndpoint), request);
      throw;
    }
  }
}

public class RefreshTokenRequest
{
  public const string Route = "/auth/refresh";

  public string? RefreshToken { get; set; }
}

public class RefreshTokenRequestValidator : Validator<RefreshTokenRequest>
{
  public RefreshTokenRequestValidator() { }
}

public record RefreshTokenResponse(
  string AccessToken,
  DateTime ExpiresAt,
  DateTime RefreshTokenExpiresAt);
