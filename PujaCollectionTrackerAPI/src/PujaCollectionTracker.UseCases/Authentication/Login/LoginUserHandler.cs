using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.Core.IdentityAggregate.Specifications;
using PujaCollectionTracker.Core.Interfaces;
using Ardalis.Specification;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.UseCases.Authentication.Login;

/// <summary>
/// Handler for LoginUserCommand.
/// Validates credentials and generates a signed JWT access token including user roles.
/// </summary>
public class LoginUserHandler(
  IRepository<User> _repository,
  IPasswordHasher _passwordHasher,
  IJwtTokenGenerator _jwtTokenGenerator,
  ILogger<LoginUserHandler> _logger)
  : ICommandHandler<LoginUserCommand, Result<LoginResult>>
{
  public async ValueTask<Result<LoginResult>> Handle(
    LoginUserCommand command,
    CancellationToken cancellationToken)
  {
    try
    {
    // Eagerly load UserRoles and the associated Role entities during login lookup.
    var user = await _repository.FirstOrDefaultAsync(
      new UserByEmailWithRolesSpec(command.Email), cancellationToken);

    if (user is null)
      return Result<LoginResult>.Unauthorized();

    if (!_passwordHasher.Verify(command.Password, user.PasswordHash))
      return Result<LoginResult>.Unauthorized("Invalid email or password.");

    if (!user.IsEmailVerified)
    {
      return Result<LoginResult>.Unauthorized("Please verify your email before logging in.");
    }

    var (refreshToken, refreshTokenExpiresAt) = _jwtTokenGenerator.GenerateRefreshToken();
    var refreshTokenHash = _jwtTokenGenerator.HashRefreshToken(refreshToken);

    user.SetRefreshToken(refreshTokenHash, refreshTokenExpiresAt);
    user.UpdateLastLogin();
    await _repository.UpdateAsync(user, cancellationToken);

    var (accessToken, expiresAt) = _jwtTokenGenerator.GenerateToken(user);

    var roles = user.UserRoles.Select(ur => ur.Role?.Name ?? "").Where(r => !string.IsNullOrEmpty(r)).ToList();
    var userDto = new UserDto(
      user.Id,
      user.FirstName,
      user.LastName,
      user.Email,
      user.IsActive,
      user.CreatedOn,
      roles);

      return new LoginResult(accessToken, expiresAt, refreshToken, refreshTokenExpiresAt, userDto);
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(LoginUserHandler), command);
      throw;
    }
  }
}
