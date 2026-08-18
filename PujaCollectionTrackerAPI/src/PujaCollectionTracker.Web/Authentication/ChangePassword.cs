using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.UseCases.Authentication.ChangePassword;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.Web.Authentication;

/// <summary>
/// Endpoint to change the logged-in user's password.
/// Requires JWT Bearer authentication (no anonymous access).
/// </summary>
public class ChangePassword(IMediator mediator, ILogger<ChangePassword> _logger)
  : Endpoint<ChangePasswordRequest,
      Results<Ok<ChangePasswordResponse>,
              UnauthorizedHttpResult,
              ValidationProblem,
              ProblemHttpResult>>
{
  private readonly IMediator _mediator = mediator;

  public override void Configure()
  {
    Post(ChangePasswordRequest.Route);
    // JWT Authentication is required (AllowAnonymous is NOT used)
    Summary(s =>
    {
      s.Summary = "Change password for logged-in user";
      s.Description = "Changes the authenticated user's password. Requires a valid JWT token.";
      s.ExampleRequest = new ChangePasswordRequest
      {
        NewPassword = "NewSecurePassword123!"
      };
      s.ResponseExamples[200] = new ChangePasswordResponse("Password changed successfully.");
      s.Responses[200] = "Password changed successfully";
      s.Responses[400] = "Invalid input";
      s.Responses[401] = "Unauthorized - missing or invalid JWT token";
      s.Responses[404] = "User not found";
      s.Responses[500] = "Internal server error";
    });

    Tags("Authentication");

    Description(builder => builder
      .Accepts<ChangePasswordRequest>("application/json")
      .Produces<ChangePasswordResponse>(200, "application/json")
      .ProducesProblem(400)
      .ProducesProblem(401)
      .ProducesProblem(404)
      .ProducesProblem(500));
  }

  public override async Task<Results<Ok<ChangePasswordResponse>, UnauthorizedHttpResult, ValidationProblem, ProblemHttpResult>>
    ExecuteAsync(ChangePasswordRequest request, CancellationToken cancellationToken)
  {
    try
    {
      // Extract the User ID from JWT claims (same pattern as GetMe.cs)
      var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? User.FindFirst("sub")?.Value;

      if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userIdInt))
      {
        return TypedResults.Unauthorized();
      }

      var result = await _mediator.Send(new ChangePasswordCommand(
        UserId.From(userIdInt),
        request.NewPassword), cancellationToken);

      if (result.Status == ResultStatus.NotFound)
      {
        return TypedResults.Problem(
          title: "Change password failed",
          detail: "User not found.",
          statusCode: StatusCodes.Status404NotFound);
      }

      if (!result.IsSuccess)
      {
        return TypedResults.Problem(
          title: "Change password failed",
          detail: result.Errors.FirstOrDefault() ?? "Failed to change password.",
          statusCode: StatusCodes.Status400BadRequest);
      }

      return TypedResults.Ok(new ChangePasswordResponse("Password changed successfully."));
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(ChangePassword), request);
      throw;
    }
  }
}

public class ChangePasswordRequest
{
  public const string Route = "/auth/change-password";

  [Required]
  public string NewPassword { get; set; } = string.Empty;
}

public class ChangePasswordRequestValidator : Validator<ChangePasswordRequest>
{
  public ChangePasswordRequestValidator()
  {
    RuleFor(x => x.NewPassword)
      .NotEmpty()
      .WithMessage("New password is required.")
      .MinimumLength(8)
      .WithMessage("Password must be at least 8 characters long.");
  }
}

public record ChangePasswordResponse(string Message);
