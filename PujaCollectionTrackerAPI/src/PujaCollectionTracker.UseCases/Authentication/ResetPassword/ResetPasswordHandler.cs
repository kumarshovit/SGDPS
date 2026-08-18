using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.Core.IdentityAggregate.Specifications;
using PujaCollectionTracker.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.UseCases.Authentication.ResetPassword;

/// <summary>
/// Handler for ResetPasswordCommand.
/// Validates the secure token, hashes the new password, and updates the user's password hash in the repository.
/// </summary>
public class ResetPasswordHandler(
  IRepository<User> _repository,
  IPasswordHasher _passwordHasher,
  IPasswordResetService _passwordResetService,
  ILogger<ResetPasswordHandler> _logger)
  : ICommandHandler<ResetPasswordCommand, Result>
{
  public async ValueTask<Result> Handle(ResetPasswordCommand command, CancellationToken cancellationToken)
  {
    try
    {
    // Validate that the token is valid and not expired.
    if (!_passwordResetService.ValidateToken(command.Email, command.ResetToken))
    {
      return Result.Error("Invalid or expired password reset token.");
    }

    var user = await _repository.FirstOrDefaultAsync(
      new UserByEmailSpec(command.Email), cancellationToken);

    if (user is null)
    {
      return Result.NotFound("User not found.");
    }

    // Hash the new password and update the user entity.
    var newHash = _passwordHasher.Hash(command.NewPassword);
    user.ChangePassword(newHash);

    await _repository.UpdateAsync(user, cancellationToken);

    // Invalidate the token once used.
    _passwordResetService.InvalidateToken(command.Email);

    return Result.Success();
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(ResetPasswordHandler), command);
      throw;
    }
  }
}
