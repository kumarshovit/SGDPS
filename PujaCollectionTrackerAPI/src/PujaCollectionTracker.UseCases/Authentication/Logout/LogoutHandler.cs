using PujaCollectionTracker.Core.IdentityAggregate;
using Ardalis.Result;
using Ardalis.SharedKernel;
using Microsoft.Extensions.Logging;

namespace PujaCollectionTracker.UseCases.Authentication.Logout;

/// <summary>
/// Handler for LogoutCommand.
/// Validates that the authenticated user entity exists and is active in the repository.
/// In stateless JWT authentication without refresh tokens, server-side validation completes
/// the logout operation, requiring the client to discard the access token.
/// </summary>
public class LogoutHandler(IRepository<User> _repository, ILogger<LogoutHandler> _logger)
  : ICommandHandler<LogoutCommand, Result>
{
  public async ValueTask<Result> Handle(
    LogoutCommand command,
    CancellationToken cancellationToken)
  {
    try
    {
    var user = await _repository.GetByIdAsync(command.UserId, cancellationToken);

    if (user is null)
    {
      return Result.NotFound("User not found.");
    }

    if (!user.IsActive)
    {
      return Result.Unauthorized("User account is inactive.");
    }

    user.RevokeRefreshToken();
    await _repository.UpdateAsync(user, cancellationToken);

    return Result.Success();
    }
    catch (Exception ex)
    {
      _logger.LogError(
          ex,
          "Unhandled exception in {ClassName}. Request: {@Request}",
          nameof(LogoutHandler), command);
      throw;
    }
  }
}
