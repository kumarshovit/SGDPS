using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.Core.IdentityAggregate.Specifications;
using PujaCollectionTracker.Core.Interfaces;
using PujaCollectionTracker.UseCases.Authentication.Helpers;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.UseCases.Authentication.Register;

/// <summary>
/// Handler for RegisterUserCommand.
/// Registers a new user with the selected role, generates a verification token, and dispatches a verification email.
/// Handles SMTP failures gracefully to maintain registration reliability.
/// </summary>
public class RegisterUserHandler(
  IRepository<User> _repository,
  IReadRepository<Role> _roleRepository,
  IPasswordHasher _passwordHasher,
  IEmailVerificationService _emailVerificationService,
  IEmailSender _emailSender,
  AuthSettings _authSettings,
  ILogger<RegisterUserHandler> _logger)
  : ICommandHandler<RegisterUserCommand, Result<UserId>>
{
  public async ValueTask<Result<UserId>> Handle(
    RegisterUserCommand command,
    CancellationToken cancellationToken)
  {
    try
    {
    var settings = _authSettings;

    // 1. Enforce that only Admin or Collector self-registration is allowed (defaults to Admin)
    var requestedRole = string.IsNullOrWhiteSpace(command.Role) ? "Admin" : command.Role;
    var allowedRoles = new[] { "Admin", "Collector" };
    if (!allowedRoles.Contains(requestedRole, StringComparer.OrdinalIgnoreCase))
    {
      return Result<UserId>.Error("Invalid registration role. Only Admin and Collector accounts can be registered.");
    }

    // 2. Prevent duplicate user registrations
    var existingUser = await _repository.FirstOrDefaultAsync(
      new UserByEmailSpec(command.Email), cancellationToken);

    if (existingUser is not null)
    {
      return Result<UserId>.Conflict("A user with this email address already exists.");
    }

    // 3. Load the selected role from the database
    var roleSpec = new RoleByNameSpec(requestedRole);
    var selectedRole = await _roleRepository.FirstOrDefaultAsync(roleSpec, cancellationToken);

    if (selectedRole is null)
    {
      return Result<UserId>.Error($"Selected role '{requestedRole}' does not exist in the system.");
    }

    // 4. Hash the password and create the User entity
    var passwordHash = _passwordHasher.Hash(command.Password);

    var newUser = new User(
      command.FirstName,
      command.LastName,
      command.Email,
      passwordHash);

    // 5. Assign the selected role and verify email for immediate login access
    newUser.AssignRole(selectedRole);
    newUser.VerifyEmail();

    // 6. Save the user to the database
    var createdUser = await _repository.AddAsync(newUser, cancellationToken);

    // 7. Dispatch the verification email (handling exceptions gracefully)
    try
    {
      var tokenExpiry = TimeSpan.FromHours(settings.VerificationTokenExpiryHours);
      var token = _emailVerificationService.GenerateVerificationToken(command.Email, tokenExpiry);
      var baseUrl = settings.FrontendBaseUrl.TrimEnd('/');
      var route = settings.EmailVerificationRoute.StartsWith('/') 
        ? settings.EmailVerificationRoute 
        : "/" + settings.EmailVerificationRoute;
      var verificationUrl = $"{baseUrl}{route}?email={Uri.EscapeDataString(command.Email)}&token={Uri.EscapeDataString(token)}";
      var htmlBody = EmailTemplateHelper.BuildVerificationEmail(command.FirstName, verificationUrl, settings.VerificationTokenExpiryHours);

      await _emailSender.SendEmailAsync(
        to: command.Email,
        from: "noreply@PujaCollectionTracker.com",
        subject: "Welcome to SGDPS Durga Puja Collection Platform",
        body: htmlBody
      );
    }
    catch (Exception ex)
    {
      _logger.LogWarning(ex, "Email dispatch could not be sent to {Email}. User registration succeeded.", command.Email);
    }

    return createdUser.Id;
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(RegisterUserHandler), command);
      throw;
    }
  }
}
