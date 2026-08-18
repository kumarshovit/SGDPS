using System.Security.Claims;
using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.UseCases.Authentication.UpdateProfile;
using Ardalis.Result;
using FastEndpoints;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.Web.Authentication;

/// <summary>
/// Endpoint to update the currently logged in user's profile names (FirstName and LastName).
/// Requires JWT Bearer authentication.
/// </summary>
public class UpdateProfile(IMediator mediator, ILogger<UpdateProfile> _logger)
  : Endpoint<UpdateProfileRequest, Results<Ok<UserMeResponse>, UnauthorizedHttpResult, NotFound, ValidationProblem, ProblemHttpResult>>
{
  private readonly IMediator _mediator = mediator;

  public override void Configure()
  {
    Put("/auth/me");
    // JWT Authentication is required (AllowAnonymous is omitted)
    
    Summary(s =>
    {
      s.Summary = "Update current user profile";
      s.Description = "Updates the first and last name of the currently authenticated user using their JWT token.";
      s.ResponseExamples[200] = new UserMeResponse(
        1,
        "John",
        "Doe",
        "john.doe@example.com",
        true,
        DateTime.UtcNow,
        new[] { "Player" }
      );
      s.Responses[200] = "Successfully updated user profile";
      s.Responses[400] = "Validation error";
      s.Responses[401] = "Unauthorized - invalid or missing JWT token";
      s.Responses[404] = "User not found";
      s.Responses[500] = "Internal server error";
    });

    Tags("Authentication");

    Description(builder => builder
      .Produces<UserMeResponse>(200, "application/json")
      .ProducesValidationProblem(400)
      .ProducesProblem(401)
      .ProducesProblem(404)
      .ProducesProblem(500));
  }

  public override async Task<Results<Ok<UserMeResponse>, UnauthorizedHttpResult, NotFound, ValidationProblem, ProblemHttpResult>>
    ExecuteAsync(UpdateProfileRequest request, CancellationToken cancellationToken)
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

      var command = new UpdateCurrentUserProfileCommand(
        UserId.From(userIdInt),
        request.FirstName,
        request.LastName);

      var result = await _mediator.Send(command, cancellationToken);

      if (result.Status == ResultStatus.NotFound)
      {
        return TypedResults.NotFound();
      }

      if (result.Status == ResultStatus.Invalid)
      {
        return TypedResults.ValidationProblem(
          result.ValidationErrors
            .GroupBy(e => e.Identifier ?? string.Empty)
            .ToDictionary(
              g => g.Key,
              g => g.Select(e => e.ErrorMessage).ToArray()
            )
        );
      }

      if (!result.IsSuccess)
      {
        return TypedResults.Problem(result.Errors.FirstOrDefault() ?? "Failed to update user profile.");
      }

      var user = result.Value;
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
          nameof(UpdateProfile), request);
      throw;
    }
  }
}

public class UpdateProfileRequest
{
  public string FirstName { get; set; } = string.Empty;
  public string LastName { get; set; } = string.Empty;
}

public class UpdateProfileValidator : Validator<UpdateProfileRequest>
{
  public UpdateProfileValidator()
  {
    RuleFor(x => x.FirstName)
      .NotEmpty()
      .WithMessage("First name is required.")
      .MaximumLength(100);

    RuleFor(x => x.LastName)
      .NotEmpty()
      .WithMessage("Last name is required.")
      .MaximumLength(100);
  }
}
