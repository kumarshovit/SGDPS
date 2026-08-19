using System.ComponentModel.DataAnnotations;
using PujaCollectionTracker.UseCases.Authentication.ForgotPassword;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.Web.Authentication;

/// <summary>
/// Endpoint to handle password reset requests.
/// Accessible to anonymous users.
/// </summary>
public class ForgotPassword(IMediator mediator, ILogger<ForgotPassword> _logger)
  : Endpoint<ForgotPasswordRequest,
      Results<Ok<ForgotPasswordResponse>,
              ValidationProblem,
              ProblemHttpResult>>
{
  private readonly IMediator _mediator = mediator;

  public override void Configure()
  {
    Post(ForgotPasswordRequest.Route);
    AllowAnonymous();
    Summary(s =>
    {
      s.Summary = "Request a password reset link";
      s.Description = "Initiates the password reset process by generating a token if the email exists. Returns a generic success response to prevent account enumeration.";
      s.ExampleRequest = new ForgotPasswordRequest
      {
        Email = "john.doe@example.com"
      };
      s.ResponseExamples[200] = new ForgotPasswordResponse("If the email is registered, a password reset token has been generated.");
      s.Responses[200] = "Generic success response returned";
      s.Responses[400] = "Invalid input data - validation errors";
      s.Responses[500] = "Internal server error";
    });

    Tags("Authentication");

    Description(builder => builder
      .Accepts<ForgotPasswordRequest>("application/json")
      .Produces<ForgotPasswordResponse>(200, "application/json")
      .ProducesProblem(400)
      .ProducesProblem(500));
  }

  public override async Task<Results<Ok<ForgotPasswordResponse>, ValidationProblem, ProblemHttpResult>>
    ExecuteAsync(ForgotPasswordRequest request, CancellationToken cancellationToken)
  {
    try
    {
    var result = await _mediator.Send(new ForgotPasswordCommand(request.Email), cancellationToken);

    if (!result.IsSuccess)
    {
      return TypedResults.Problem(result.Errors.FirstOrDefault() ?? "Forgot password request failed.");
    }

    var token = result.Value;
    return TypedResults.Ok(new ForgotPasswordResponse(
      token != null
        ? "Password reset token generated successfully. You can now reset your password."
        : "If the email is registered, a password reset token has been generated.",
      token
    ));
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(ForgotPassword), request);
      throw;
    }
  }
}

public class ForgotPasswordRequest
{
  public const string Route = "/auth/forgot-password";

  [Required]
  public string Email { get; set; } = string.Empty;
}

public class ForgotPasswordRequestValidator : Validator<ForgotPasswordRequest>
{
  public ForgotPasswordRequestValidator()
  {
    RuleFor(x => x.Email)
      .NotEmpty()
      .WithMessage("Email is required.")
      .EmailAddress()
      .WithMessage("A valid email address is required.")
      .MaximumLength(200);
  }
}

public record ForgotPasswordResponse(string Message, string? ResetToken = null);
