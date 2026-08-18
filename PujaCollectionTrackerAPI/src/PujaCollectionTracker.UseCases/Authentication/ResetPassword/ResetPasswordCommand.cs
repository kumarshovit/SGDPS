namespace PujaCollectionTracker.UseCases.Authentication.ResetPassword;

/// <summary>
/// Command to reset a user's password using a reset token.
/// </summary>
/// <param name="Email">The user's registered email address.</param>
/// <param name="ResetToken">The secure reset token received via forgot password request.</param>
/// <param name="NewPassword">The new plain-text password to set.</param>
public record ResetPasswordCommand(
  string Email,
  string ResetToken,
  string NewPassword) : ICommand<Result>;
