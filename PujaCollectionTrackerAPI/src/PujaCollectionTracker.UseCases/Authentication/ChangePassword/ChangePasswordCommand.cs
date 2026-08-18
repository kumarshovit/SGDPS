using PujaCollectionTracker.Core.IdentityAggregate;

namespace PujaCollectionTracker.UseCases.Authentication.ChangePassword;

/// <summary>
/// Command to change a logged-in user's password directly (no token required).
/// </summary>
/// <param name="UserId">The ID of the authenticated user (from JWT claims).</param>
/// <param name="NewPassword">The new plain-text password to set.</param>
public record ChangePasswordCommand(
  UserId UserId,
  string NewPassword) : ICommand<Result>;
