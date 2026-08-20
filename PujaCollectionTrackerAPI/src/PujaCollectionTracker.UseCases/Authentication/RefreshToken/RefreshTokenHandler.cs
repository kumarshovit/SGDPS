using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.Core.IdentityAggregate.Specifications;
using PujaCollectionTracker.Core.Interfaces;
using Ardalis.Result;
using Ardalis.SharedKernel;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.UseCases.Authentication.RefreshToken;

/// <summary>
/// Handler for RefreshTokenCommand.
/// Validates the incoming refresh token hash against stored credentials, rotates the refresh token,
/// generates a fresh access token, updates the repository, and returns the new token pair.
/// </summary>
public class RefreshTokenHandler(
  IRepository<User> _repository,
  IJwtTokenGenerator _jwtTokenGenerator,
  ILogger<RefreshTokenHandler> _logger)
  : ICommandHandler<RefreshTokenCommand, Result<RefreshTokenResult>>
{
  public async ValueTask<Result<RefreshTokenResult>> Handle(
    RefreshTokenCommand command,
    CancellationToken cancellationToken)
  {
    try
    {
      if (string.IsNullOrWhiteSpace(command.RefreshToken))
      {
        return Result<RefreshTokenResult>.Unauthorized("Refresh token is required.");
      }

      // 1. Hash incoming token to compare with stored RefreshTokenHash
      var incomingHash = _jwtTokenGenerator.HashRefreshToken(command.RefreshToken);

      // 2. Fetch user matching the hashed refresh token with eager-loaded roles
      var user = await _repository.FirstOrDefaultAsync(
        new UserByRefreshTokenHashSpec(incomingHash), cancellationToken);

      if (user is null || !user.IsRefreshTokenValid(incomingHash) || !user.IsActive)
      {
        return Result<RefreshTokenResult>.Unauthorized("Invalid, expired, or deactivated refresh token.");
      }

      // 3. Generate new rotated refresh token and compute its hash
      var (newRefreshToken, newRefreshTokenExpiresAt) = _jwtTokenGenerator.GenerateRefreshToken();
      var newRefreshTokenHash = _jwtTokenGenerator.HashRefreshToken(newRefreshToken);

      // 4. Update user aggregate with new rotated refresh token
      user.SetRefreshToken(newRefreshTokenHash, newRefreshTokenExpiresAt);
      user.UpdateLastLogin();
      await _repository.UpdateAsync(user, cancellationToken);

      // 5. Generate fresh access token from the updated user entity
      var (newAccessToken, newExpiresAt) = _jwtTokenGenerator.GenerateToken(user);

      return new RefreshTokenResult(
        newAccessToken,
        newExpiresAt,
        newRefreshToken,
        newRefreshTokenExpiresAt);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Unhandled exception in {ClassName}. Request: {@Request}", nameof(RefreshTokenHandler), command);
      throw;
    }
  }
}
