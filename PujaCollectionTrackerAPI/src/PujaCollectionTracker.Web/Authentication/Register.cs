using System.ComponentModel.DataAnnotations;
using PujaCollectionTracker.UseCases.Authentication.Register;
using PujaCollectionTracker.Web.Extensions;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.Web.Authentication;

/// <summary>
/// Endpoint to register a new user account with a specific role.
/// </summary>
public class Register(IMediator mediator, ILogger<Register> _logger)
  : Endpoint<RegisterUserRequest,
      Results<Created<RegisterUserResponse>,
              ValidationProblem,
              ProblemHttpResult>>
{
  private readonly IMediator _mediator = mediator;

  public override void Configure()
  {
    Post(RegisterUserRequest.Route);
    AllowAnonymous();
    Summary(s =>
    {
      s.Summary = "Register a new user";
      s.Description = "Creates a new user account and assigns the selected role. Registration is allowed for Admin and Collector roles.";
      s.ExampleRequest = new RegisterUserRequest
      {
        FirstName = "John",
        LastName = "Doe",
        Email = "admin@sgdps.com",
        Password = "SecurePass123!",
        Role = "Admin"
      };
      s.ResponseExamples[201] = new RegisterUserResponse(1);
      s.Responses[201] = "User registered successfully";
      s.Responses[400] = "Invalid input data or invalid registration role";
      s.Responses[500] = "Internal server error";
    });

    Tags("Authentication");

    Description(builder => builder
      .Accepts<RegisterUserRequest>("application/json")
      .Produces<RegisterUserResponse>(201, "application/json")
      .ProducesProblem(400)
      .ProducesProblem(500));
  }

  public override async Task<Results<Created<RegisterUserResponse>, ValidationProblem, ProblemHttpResult>>
    ExecuteAsync(RegisterUserRequest request, CancellationToken cancellationToken)
  {
    try
    {
    var result = await _mediator.Send(new RegisterUserCommand(
      request.FirstName,
      request.LastName,
      request.Email,
      request.Password,
      request.Role), cancellationToken);

    return result.ToCreatedResult(
      id => $"/auth/users/{id.Value}",
      id => new RegisterUserResponse(id.Value));
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(Register), request);
      throw;
    }
  }
}

public class RegisterUserRequest
{
  public const string Route = "/auth/register";

  [Required]
  public string FirstName { get; set; } = string.Empty;

  [Required]
  public string LastName { get; set; } = string.Empty;

  [Required]
  public string Email { get; set; } = string.Empty;

  [Required]
  public string Password { get; set; } = string.Empty;

  [Required]
  public string Role { get; set; } = string.Empty;
}

public class RegisterUserValidator : Validator<RegisterUserRequest>
{
  public RegisterUserValidator()
  {
    RuleFor(x => x.FirstName)
      .NotEmpty()
      .WithMessage("First name is required.")
      .MaximumLength(100);

    RuleFor(x => x.LastName)
      .NotEmpty()
      .WithMessage("Last name is required.")
      .MaximumLength(100);

    RuleFor(x => x.Email)
      .NotEmpty()
      .WithMessage("Email is required.")
      .EmailAddress()
      .WithMessage("A valid email address is required.")
      .MaximumLength(200);

    RuleFor(x => x.Password)
      .NotEmpty()
      .WithMessage("Password is required.")
      .MinimumLength(8)
      .WithMessage("Password must be at least 8 characters long.")
      .Matches("[A-Z]")
      .WithMessage("Password must contain at least one uppercase letter.")
      .Matches("[a-z]")
      .WithMessage("Password must contain at least one lowercase letter.")
      .Matches("[0-9]")
      .WithMessage("Password must contain at least one number.")
      .Matches("[^a-zA-Z0-9]")
      .WithMessage("Password must contain at least one special character.");

    RuleFor(x => x.Role)
      .NotEmpty()
      .WithMessage("Role selection is required.")
      .Must(role => new[] { "Admin", "Collector" }.Contains(role, StringComparer.OrdinalIgnoreCase))
      .WithMessage("Invalid role selection. You can only register as Admin or Collector.");
  }
}

public class RegisterUserResponse(int id)
{
  public int Id { get; set; } = id;
}
