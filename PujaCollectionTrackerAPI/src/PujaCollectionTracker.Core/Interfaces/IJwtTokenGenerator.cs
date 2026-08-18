using PujaCollectionTracker.Core.IdentityAggregate;

namespace PujaCollectionTracker.Core.Interfaces;

/// <summary>
/// Defines the contract for JWT access token generation.
/// Implementations live in PujaCollectionTracker.Infrastructure; this interface
/// keeps the use-case layer free from token library dependencies.
/// </summary>
public interface IJwtTokenGenerator
{
  /// <summary>
  /// Generates a signed JWT access token for the given user.
  /// Returns the token string and its absolute expiry time (UTC).
  /// </summary>
  (string AccessToken, DateTime ExpiresAt) GenerateToken(User user);

  /// <summary>
  /// Generates a cryptographically secure random refresh token string and expiry timestamp.
  /// </summary>
  (string RefreshToken, DateTime ExpiresAt) GenerateRefreshToken();

  /// <summary>
  /// Computes a SHA-256 hash of the specified raw refresh token string.
  /// </summary>
  string HashRefreshToken(string refreshToken);
}

