namespace PujaCollectionTracker.Core.Interfaces;

/// <summary>
/// Service contract to generate, validate, and invalidate password reset tokens.
/// This abstraction isolates the Core and UseCase layers from in-memory or external state persistence.
/// </summary>
public interface IPasswordResetService
{
  /// <summary>
  /// Generates a cryptographically secure token, associates it with the email, and sets an expiration duration.
  /// </summary>
  string GenerateResetToken(string email, TimeSpan expiration);

  /// <summary>
  /// Validates whether the token is correct, matches the email, and is not expired.
  /// </summary>
  bool ValidateToken(string email, string token);

  /// <summary>
  /// Removes or invalidates the token associated with the email once it is used.
  /// </summary>
  void InvalidateToken(string email);
}
