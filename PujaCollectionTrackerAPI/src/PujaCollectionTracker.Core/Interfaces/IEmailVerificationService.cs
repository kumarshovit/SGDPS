namespace PujaCollectionTracker.Core.Interfaces;

/// <summary>
/// Service contract to generate, validate, and invalidate email verification tokens.
/// Isolates application logic from the underlying token persistence mechanism.
/// </summary>
public interface IEmailVerificationService
{
  /// <summary>
  /// Generates a secure verification token for the given email with an expiration duration.
  /// </summary>
  string GenerateVerificationToken(string email, TimeSpan expiration);

  /// <summary>
  /// Validates whether the token matches the email and has not expired.
  /// </summary>
  bool ValidateToken(string email, string token);

  /// <summary>
  /// Invalidates the token after successful verification.
  /// </summary>
  void InvalidateToken(string email);
}
