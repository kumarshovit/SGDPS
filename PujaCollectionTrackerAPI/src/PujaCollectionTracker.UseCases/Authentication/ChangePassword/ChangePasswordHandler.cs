using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.UseCases.Authentication.ChangePassword;

/// <summary>
/// Handler for ChangePasswordCommand.
/// Looks up the authenticated user by ID, hashes the new password, and updates the record.
/// No token or current-password verification — the user is already authenticated via JWT.
/// </summary>
public class ChangePasswordHandler(
  IRepository<User> _repository,
  IPasswordHasher _passwordHasher,
  ILogger<ChangePasswordHandler> _logger)
  : ICommandHandler<ChangePasswordCommand, Result>
{
  public async ValueTask<Result> Handle(ChangePasswordCommand command, CancellationToken cancellationToken)
  {
    try
    {
      var user = await _repository.GetByIdAsync(command.UserId, cancellationToken);

      if (user is null)
      {
        return Result.NotFound("User not found.");
      }

      // Hash the new password and update the user entity.
      var newHash = _passwordHasher.Hash(command.NewPassword);
      user.ChangePassword(newHash);

      await _repository.UpdateAsync(user, cancellationToken);

      return Result.Success();
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. UserId: {UserId}",
          nameof(ChangePasswordHandler), command.UserId);
      throw;
    }
  }
}
