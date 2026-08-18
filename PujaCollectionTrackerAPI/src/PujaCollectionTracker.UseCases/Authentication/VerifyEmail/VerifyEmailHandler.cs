using PujaCollectionTracker.Core.IdentityAggregate;
using PujaCollectionTracker.Core.IdentityAggregate.Specifications;
using PujaCollectionTracker.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.UseCases.Authentication.VerifyEmail;

/// <summary>
/// Handler for VerifyEmailCommand.
/// Validates the secure verification token, marks the user's email as verified in the repository,
/// and invalidates the token.
/// </summary>
public class VerifyEmailHandler(
  IRepository<User> _repository,
  IEmailVerificationService _emailVerificationService,
  ILogger<VerifyEmailHandler> _logger)
  : ICommandHandler<VerifyEmailCommand, Result>
{
  public async ValueTask<Result> Handle(VerifyEmailCommand command, CancellationToken cancellationToken)
  {
    try
    {
    // 1. Validate the verification token
    if (!_emailVerificationService.ValidateToken(command.Email, command.Token))
    {
      return Result.Error("Invalid or expired email verification token.");
    }

    // 2. Fetch the user by email
    var user = await _repository.FirstOrDefaultAsync(
      new UserByEmailSpec(command.Email), cancellationToken);

    if (user is null)
    {
      return Result.NotFound("User not found.");
    }

    // 3. Mark email as verified and update repository
    user.VerifyEmail();
    await _repository.UpdateAsync(user, cancellationToken);

    // 4. Invalidate the token so it cannot be used again
    _emailVerificationService.InvalidateToken(command.Email);

    return Result.Success();
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(VerifyEmailHandler), command);
      throw;
    }
  }
}
