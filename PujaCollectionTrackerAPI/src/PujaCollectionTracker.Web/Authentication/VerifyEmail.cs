using System.ComponentModel.DataAnnotations;
using PujaCollectionTracker.UseCases.Authentication.VerifyEmail;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.Web.Authentication;

/// <summary>
/// Endpoint to verify user email address using the registration token.
/// </summary>
public class VerifyEmail(IMediator mediator, ILogger<VerifyEmail> _logger)
  : Endpoint<VerifyEmailRequest,
      Results<Ok<VerifyEmailResponse>,
              ValidationProblem,
              ProblemHttpResult>>
{
  private readonly IMediator _mediator = mediator;

  public override void Configure()
  {
    Get(VerifyEmailRequest.Route);
    AllowAnonymous();
    Summary(s =>
    {
      s.Summary = "Verify user email";
      s.Description = "Verifies a user's email address using the secure token generated during registration.";
      s.ExampleRequest = new VerifyEmailRequest
      {
        Email = "john.doe@example.com",
        Token = "SECURE_VERIFICATION_TOKEN_HEX_STRING"
      };
      s.ResponseExamples[200] = new VerifyEmailResponse("Email verified successfully.");
      s.Responses[200] = "Email verified successfully";
      s.Responses[400] = "Invalid input or invalid/expired verification token";
      s.Responses[404] = "User not found";
      s.Responses[500] = "Internal server error";
    });

    Tags("Authentication");

    Description(builder => builder
      .Produces<VerifyEmailResponse>(200, "application/json")
      .ProducesProblem(400)
      .ProducesProblem(404)
      .ProducesProblem(500));
  }

  public override async Task<Results<Ok<VerifyEmailResponse>, ValidationProblem, ProblemHttpResult>>
    ExecuteAsync(VerifyEmailRequest request, CancellationToken cancellationToken)
  {
    try
    {
    var result = await _mediator.Send(new VerifyEmailCommand(request.Email, request.Token), cancellationToken);

    if (result.Status == ResultStatus.NotFound)
    {
      return TypedResults.Problem(
        title: "Verification failed",
        detail: "User not found.",
        statusCode: StatusCodes.Status404NotFound);
    }

    if (!result.IsSuccess)
    {
      return TypedResults.Problem(
        title: "Verification failed",
        detail: result.Errors.FirstOrDefault() ?? "Invalid or expired verification token.",
        statusCode: StatusCodes.Status400BadRequest);
    }

    return TypedResults.Ok(new VerifyEmailResponse("Email verified successfully."));
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(VerifyEmail), request);
      throw;
    }
  }
}

public class VerifyEmailRequest
{
  public const string Route = "/auth/verify-email";

  [QueryParam]
  [Required]
  public string Email { get; set; } = string.Empty;

  [QueryParam]
  [Required]
  public string Token { get; set; } = string.Empty;
}

public class VerifyEmailRequestValidator : Validator<VerifyEmailRequest>
{
  public VerifyEmailRequestValidator()
  {
    RuleFor(x => x.Email)
      .NotEmpty()
      .WithMessage("Email is required.")
      .EmailAddress()
      .WithMessage("A valid email address is required.")
      .MaximumLength(200);

    RuleFor(x => x.Token)
      .NotEmpty()
      .WithMessage("Verification token is required.");
  }
}

public record VerifyEmailResponse(string Message);
