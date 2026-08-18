using System.ComponentModel.DataAnnotations;
using PujaCollectionTracker.UseCases.Authentication.Login;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.Web.Authentication;

public class Login(IMediator mediator, ILogger<Login> _logger)
  : Endpoint<LoginRequest,
      Results<Ok<LoginResponse>,
              ValidationProblem,
              ProblemHttpResult>>
{
  private readonly IMediator _mediator = mediator;

  public override void Configure()
  {
    Post(LoginRequest.Route);
    AllowAnonymous();
    Summary(s =>
    {
      s.Summary = "Login with email and password";
      s.Description = "Authenticates a registered user and returns a signed JWT access token and a refresh token.";
      s.ExampleRequest = new LoginRequest
      {
        Email = "john.doe@example.com",
        Password = "SecurePass123!"
      };
      s.ResponseExamples[200] = new LoginResponse(
        "token",
        DateTime.UtcNow.AddHours(1),
        DateTime.UtcNow.AddDays(7),
        new LoginUserInfo(1, "John", "Doe", "john.doe@example.com", true, DateTime.UtcNow, new[] { "Admin" }));
      s.Responses[200] = "Login successful - sets auth cookies and returns user info";
      s.Responses[400] = "Invalid input data - validation errors";
      s.Responses[401] = "Invalid email or password";
      s.Responses[500] = "Internal server error";
    });

    Tags("Authentication");

    Description(builder => builder
      .Accepts<LoginRequest>("application/json")
      .Produces<LoginResponse>(200, "application/json")
      .ProducesProblem(400)
      .ProducesProblem(401)
      .ProducesProblem(500));
  }

  public override async Task<Results<Ok<LoginResponse>, ValidationProblem, ProblemHttpResult>>
    ExecuteAsync(LoginRequest request, CancellationToken cancellationToken)
  {
    try
    {
    var result = await _mediator.Send(new LoginUserCommand(
      request.Email,
      request.Password), cancellationToken);

    if (result.Status == ResultStatus.Unauthorized)
    {
      return TypedResults.Problem(
        title: "Unauthorized",
        detail: result.Errors.FirstOrDefault() ?? "Invalid email or password",
        statusCode: StatusCodes.Status401Unauthorized);
    }

    if (!result.IsSuccess)
      return TypedResults.Problem(result.Errors.FirstOrDefault() ?? "Login failed.");

    var value = result.Value;
    AuthCookies.SetAuthCookies(
      HttpContext.Response,
      value.AccessToken,
      value.ExpiresAt,
      value.RefreshToken,
      value.RefreshTokenExpiresAt);

    return TypedResults.Ok(new LoginResponse(
      value.AccessToken,
      value.ExpiresAt,
      value.RefreshTokenExpiresAt,
      new LoginUserInfo(
        value.User.Id.Value,
        value.User.FirstName,
        value.User.LastName,
        value.User.Email,
        value.User.IsActive,
        value.User.CreatedOn,
        value.User.Roles ?? Array.Empty<string>())));
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(Login), request);
      throw;
    }
  }
}

public class LoginRequest
{
  public const string Route = "/auth/login";

  [Required]
  public string Email { get; set; } = string.Empty;

  [Required]
  public string Password { get; set; } = string.Empty;
}

public class LoginRequestValidator : Validator<LoginRequest>
{
  public LoginRequestValidator()
  {
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
      .WithMessage("Password must be at least 8 characters long.");
  }
}

public record LoginResponse(
  string AccessToken,
  DateTime ExpiresAt,
  DateTime RefreshTokenExpiresAt,
  LoginUserInfo User);


public record LoginUserInfo(
  int Id,
  string FirstName,
  string LastName,
  string Email,
  bool IsActive,
  DateTime CreatedOn,
  IReadOnlyCollection<string> Roles);
