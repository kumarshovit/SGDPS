using System.ComponentModel.DataAnnotations;
using PujaCollectionTracker.UseCases.Authentication.ResetPassword;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.Web.Authentication;

/// <summary>
/// Endpoint to handle password reset operations using a verification token.
/// Accessible to anonymous users.
/// </summary>
public class ResetPassword(IMediator mediator, ILogger<ResetPassword> _logger)
  : Endpoint<ResetPasswordRequest,
      Results<Ok<ResetPasswordResponse>,
              ValidationProblem,
              ProblemHttpResult>>
{
  private readonly IMediator _mediator = mediator;

  public override void Configure()
  {
    Post(ResetPasswordRequest.Route);
    AllowAnonymous();
    Summary(s =>
    {
      s.Summary = "Reset user password using a token";
      s.Description = "Resets the user's password if the email, token, and new password are valid and not expired.";
      s.ExampleRequest = new ResetPasswordRequest
      {
        Email = "john.doe@example.com",
        ResetToken = "SECURE_RESET_TOKEN_HEX_STRING",
        NewPassword = "NewSecurePassword123!"
      };
      s.ResponseExamples[200] = new ResetPasswordResponse("Password has been reset successfully.");
      s.Responses[200] = "Password reset successfully";
      s.Responses[400] = "Invalid input or invalid/expired reset token";
      s.Responses[404] = "User not found";
      s.Responses[500] = "Internal server error";
    });

    Tags("Authentication");

    Description(builder => builder
      .Accepts<ResetPasswordRequest>("application/json")
      .Produces<ResetPasswordResponse>(200, "application/json")
      .ProducesProblem(400)
      .ProducesProblem(404)
      .ProducesProblem(500));
  }

  public override async Task<Results<Ok<ResetPasswordResponse>, ValidationProblem, ProblemHttpResult>>
    ExecuteAsync(ResetPasswordRequest request, CancellationToken cancellationToken)
  {
    try
    {
    var result = await _mediator.Send(new ResetPasswordCommand(
      request.Email,
      request.ResetToken,
      request.NewPassword), cancellationToken);

    if (result.Status == ResultStatus.NotFound)
    {
      return TypedResults.Problem(
        title: "Reset password failed",
        detail: "User not found.",
        statusCode: StatusCodes.Status404NotFound);
    }

    if (!result.IsSuccess)
    {
      return TypedResults.Problem(
        title: "Reset password failed",
        detail: result.Errors.FirstOrDefault() ?? "Invalid or expired token.",
        statusCode: StatusCodes.Status400BadRequest);
    }

    return TypedResults.Ok(new ResetPasswordResponse("Password has been reset successfully."));
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(ResetPassword), request);
      throw;
    }
  }
}

public class ResetPasswordRequest
{
  public const string Route = "/auth/reset-password";

  [Required]
  public string Email { get; set; } = string.Empty;

  [Required]
  public string ResetToken { get; set; } = string.Empty;

  [Required]
  public string NewPassword { get; set; } = string.Empty;
}

public class ResetPasswordRequestValidator : Validator<ResetPasswordRequest>
{
  public ResetPasswordRequestValidator()
  {
    RuleFor(x => x.Email)
      .NotEmpty()
      .WithMessage("Email is required.")
      .EmailAddress()
      .WithMessage("A valid email address is required.")
      .MaximumLength(200);

    RuleFor(x => x.ResetToken)
      .NotEmpty()
      .WithMessage("Reset token is required.");

    RuleFor(x => x.NewPassword)
      .NotEmpty()
      .WithMessage("New password is required.")
      .MinimumLength(8)
      .WithMessage("Password must be at least 8 characters long.");
  }
}

public record ResetPasswordResponse(string Message);
